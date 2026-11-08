"""Isolated, loopback-only IT CAMPUS pilot. Google sign-in plus isolated local test accounts."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from http.cookies import SimpleCookie
import argparse, base64, hashlib, hmac, json, os, re, secrets, sqlite3, time
import urllib.request, urllib.parse, urllib.error

ROOT=Path(__file__).resolve().parent
LESSON='q1-network-01'; MISSION='network-connect-01'
class ApiError(Exception):
 def __init__(self,status,code,message): self.status,self.code,self.message=status,code,message

def fail(status,code,message): raise ApiError(status,code,message)
def email(v):
 if not isinstance(v,str): fail(400,'email','Email мекенжайын енгізіңіз.')
 v=v.strip().lower()
 if len(v)>254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+",v):fail(400,'email','Email мекенжайын дұрыс енгізіңіз.')
 return v

def password_hash(p):
 if not isinstance(p,str) or not 12<=len(p)<=128: fail(400,'password','Пароль 12–128 таңбадан тұруы керек.')
 salt=secrets.token_hex(16)
 return salt+':'+hashlib.pbkdf2_hmac('sha256',p.encode(),bytes.fromhex(salt),600000).hex()
def password_ok(p,s):
 if not isinstance(p,str) or len(p)>128:return False
 salt,digest=s.split(':')
 return hmac.compare_digest(hashlib.pbkdf2_hmac('sha256',p.encode(),bytes.fromhex(salt),600000).hex(),digest)
def token_hash(s): return hashlib.sha256(s.encode()).hexdigest()
def txt(d,k,minlen=1,maxlen=2000):
 v=d.get(k)
 if not isinstance(v,str) or not minlen<=len(v.strip())<=maxlen:fail(400,'validation',f'{k}: {minlen}–{maxlen} таңба енгізіңіз.')
 return v.strip()

class GoogleIdentity:
 def __init__(self):
  private_path=ROOT/'data'/'google-oauth.json'
  config={}
  if private_path.exists():
   if private_path.stat().st_mode & 0o077:raise RuntimeError('Google credential file must be owner-only (0600)')
   config=json.loads(private_path.read_text()).get('web',{})
  self.client_id=os.getenv('GOOGLE_CLIENT_ID',config.get('client_id',''));self.secret=os.getenv('GOOGLE_CLIENT_SECRET',config.get('client_secret',''))
  self.redirect_uri=os.getenv('GOOGLE_REDIRECT_URI','http://127.0.0.1:8890/api/auth/google/callback')
 @property
 def configured(self):return bool(self.client_id and self.secret)
 def authorization_url(self,state,nonce,verifier):
  if not self.configured:fail(503,'google_not_configured','Google арқылы кіру әлі бапталмаған.')
  challenge=base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
  return 'https://accounts.google.com/o/oauth2/v2/auth?'+urllib.parse.urlencode({'client_id':self.client_id,'redirect_uri':self.redirect_uri,'response_type':'code','scope':'openid email profile','state':state,'nonce':nonce,'code_challenge':challenge,'code_challenge_method':'S256','prompt':'select_account'})
 def exchange(self,code,verifier,nonce):
  if not self.configured:fail(503,'google_not_configured','Google арқылы кіру әлі бапталмаған.')
  try:
   from google.oauth2 import id_token
   from google.auth.transport.requests import Request
   import requests
   response=requests.post('https://oauth2.googleapis.com/token',data={'client_id':self.client_id,'client_secret':self.secret,'code':code,'code_verifier':verifier,'grant_type':'authorization_code','redirect_uri':self.redirect_uri},timeout=15)
   response.raise_for_status();tokens=response.json()
   claims=id_token.verify_oauth2_token(tokens['id_token'],Request(),self.client_id)
  except Exception:fail(401,'google_failed','Google растауы орындалмады. Қайта кіріңіз.')
  if claims.get('nonce')!=nonce or claims.get('email_verified') is not True or not claims.get('sub'):fail(401,'google_invalid','Google аккаунты расталмады.')
  return claims

class Store:
 def __init__(self,path,identity=None,allow_test_login=False):
  self.allow_test_login=allow_test_login;self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True);self.identity=identity or GoogleIdentity()
  with self.db() as c:c.executescript('''
  PRAGMA journal_mode=WAL;
  CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('student','teacher','admin')), password TEXT NOT NULL,class_id TEXT NOT NULL DEFAULT '10A',must_change INTEGER NOT NULL DEFAULT 0,verified INTEGER NOT NULL DEFAULT 1,google_sub TEXT UNIQUE,auth_source TEXT NOT NULL DEFAULT 'local-test');
  CREATE TABLE IF NOT EXISTS sessions(user_id TEXT PRIMARY KEY REFERENCES users(id), token_hash TEXT UNIQUE NOT NULL, created REAL NOT NULL, seen REAL NOT NULL, expires REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS oauth_state(token_hash TEXT PRIMARY KEY,nonce TEXT NOT NULL,verifier TEXT NOT NULL,expires REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS oauth_pending(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),lesson_id TEXT NOT NULL,mission_id TEXT NOT NULL,passed INTEGER NOT NULL DEFAULT 0,evidence TEXT,created REAL NOT NULL);
  CREATE TABLE IF NOT EXISTS submissions(user_id TEXT PRIMARY KEY REFERENCES users(id),explanation TEXT NOT NULL,reflection TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',feedback TEXT NOT NULL DEFAULT '',revision INTEGER NOT NULL DEFAULT 1);
  CREATE TABLE IF NOT EXISTS teacher_requests(user_id TEXT PRIMARY KEY REFERENCES users(id),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created REAL NOT NULL,reviewed REAL,reviewer TEXT,decision_note TEXT NOT NULL DEFAULT '');
  CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,actor TEXT,action TEXT NOT NULL,target TEXT,at REAL NOT NULL,detail TEXT NOT NULL DEFAULT '');
  ''')
  with self.db() as c:
   columns={x[1] for x in c.execute('PRAGMA table_info(users)')}
   if 'phone' in columns:
    c.execute('ALTER TABLE users RENAME COLUMN phone TO email')
    for u in c.execute('SELECT id,email,role FROM users').fetchall():
     if u['email'].startswith('+7'):c.execute('UPDATE users SET email=? WHERE id=?',(u['role']+u['email'][-1]+'@it-campus.invalid',u['id']))
   if 'google_sub' not in columns:
    c.execute('ALTER TABLE users ADD COLUMN google_sub TEXT')
    c.execute('CREATE UNIQUE INDEX IF NOT EXISTS google_subject_unique ON users(google_sub)')
    c.execute("ALTER TABLE users ADD COLUMN auth_source TEXT NOT NULL DEFAULT 'local-test'")
   if 'active' not in columns:c.execute('ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1')
   c.execute("CREATE UNIQUE INDEX IF NOT EXISTS single_admin ON users(role) WHERE role='admin'")
   c.execute('DROP TABLE IF EXISTS sms')
  os.chmod(self.path,0o600)
 def db(self):
  c=sqlite3.connect(self.path,timeout=20);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON');return c
 def limit(self,key,count,seconds):
  key=token_hash(key);now=time.time()
  with self.db() as c:
   c.execute('BEGIN IMMEDIATE');r=c.execute('SELECT * FROM limits WHERE key=?',(key,)).fetchone()
   if r and r['until']>now and r['count']>=count:fail(429,'rate_limit','Тым көп әрекет. Біраздан кейін қайталаңыз.')
   n=r['count']+1 if r and r['until']>now else 1;until=r['until'] if r and r['until']>now else now+seconds
   c.execute('INSERT OR REPLACE INTO limits VALUES(?,?,?)',(key,n,until))
 def create(self,p,name,role,password,class_id='10A'):
  with self.db() as c:
   uid=secrets.token_hex(12);c.execute('INSERT INTO users(id,email,name,role,password,class_id) VALUES(?,?,?,?,?,?)',(uid,email(p),name,role,password_hash(password),class_id));return uid
 def audit(self,c,actor,action,target='',detail=''):c.execute('INSERT INTO audit(actor,action,target,at,detail) VALUES(?,?,?,?,?)',(actor,action,target,time.time(),detail))
 def user(self,c,cookie,allow_change=False):
  try:raw=SimpleCookie(cookie or '').get('campus_session');raw=raw.value if raw else ''
  except Exception:raw=''
  now=time.time();u=c.execute('SELECT u.*,s.created,s.seen,s.expires FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token_hash=?',(token_hash(raw),)).fetchone()
  if not u or not u['active'] or u['expires']<now or now-u['seen']>1800:fail(401,'login_required','Сессия аяқталды. Қайта кіріңіз.')
  c.execute('UPDATE sessions SET seen=? WHERE user_id=?',(now,u['id']))
  if u['must_change'] and not allow_change:fail(403,'password_change_required','Уақытша парольді жаңартыңыз.')
  return u
 def public_user(self,u):return {'id':u['id'],'name':u['name'],'email':u['email'],'role':u['role'],'classId':u['class_id'],'mustChangePassword':False,'authSource':u['auth_source'],'emailVerified':u['auth_source']=='google' and bool(u['verified']),'active':bool(u['active']),'registered':bool(u['google_sub']),'accessMode':'staff' if u['role'] in ('teacher','admin') else 'student'}
 def session(self,c,u,replace=False,cookie=''):
  if not u or not u['active']:fail(403,'account_removed','Бұл аккаунттың жобаға кіруі тоқтатылған. Әкімшіге хабарласыңыз.')
  now=time.time();old=c.execute('SELECT * FROM sessions WHERE user_id=?',(u['id'],)).fetchone()
  try:own=SimpleCookie(cookie or '').get('campus_session');own=token_hash(own.value) if own else ''
  except Exception:own=''
  if old and old['expires']>now and now-old['seen']<=1800 and old['token_hash']!=own and not replace:fail(409,'session_active','Аккаунт басқа құрылғыда ашық. Кіруді осы құрылғыға ауыстырасыз ба?')
  token=secrets.token_urlsafe(32)
  c.execute('INSERT OR REPLACE INTO sessions VALUES(?,?,?,?,?)',(u['id'],token_hash(token),now,now,now+8*3600));self.audit(c,u['id'],'login_replace' if old else 'login')
  return token
 def progress(self,c,uid):
  passed=bool(c.execute('SELECT 1 FROM attempts WHERE user_id=? AND passed=1 AND lesson_id=? LIMIT 1',(uid,LESSON)).fetchone());s=c.execute('SELECT * FROM submissions WHERE user_id=?',(uid,)).fetchone();status=s['status'] if s else 'none';done=passed and status=='approved'
  return {'missionPassed':passed,'reflectionSubmitted':bool(s),'reviewStatus':status,'completed':done,'nextUnlocked':done}
 def scoped_student(self,c,u,uid):
  s=c.execute("SELECT * FROM users WHERE id=? AND role='student'",(uid,)).fetchone()
  if not s or u['role'] not in ('admin','teacher') or (u['role']=='teacher' and u['class_id']!=s['class_id']):fail(403,'forbidden','Бұл оқушыға рұқсат жоқ.')
  return s
 def google_start(self):
  state=secrets.token_urlsafe(32);nonce=secrets.token_urlsafe(32);verifier=secrets.token_urlsafe(48)
  url=self.identity.authorization_url(state,nonce,verifier)
  with self.db() as c:
   c.execute('DELETE FROM oauth_state WHERE expires<?',(time.time(),))
   c.execute('INSERT INTO oauth_state VALUES(?,?,?,?)',(token_hash(state),nonce,verifier,time.time()+600))
  return url,state
 def google_callback(self,query,cookie):
  try:binding=SimpleCookie(cookie).get('campus_oauth');binding=binding.value if binding else ''
  except Exception:binding=''
  state=query.get('state',[''])[0]
  if not binding or not hmac.compare_digest(binding,state):fail(401,'google_state','Google кіруін осы браузерден қайта бастаңыз.')
  with self.db() as c:
   c.execute('BEGIN IMMEDIATE');r=c.execute('SELECT * FROM oauth_state WHERE token_hash=? AND expires>?',(token_hash(state),time.time())).fetchone()
   if not r:fail(401,'google_state','Google кіру мерзімі аяқталған.')
   c.execute('DELETE FROM oauth_state WHERE token_hash=?',(token_hash(state),))
  if query.get('error'):fail(401,'google_cancelled','Google арқылы кіру тоқтатылды.')
  code=query.get('code',[''])[0]
  if not code or len(code)>4096:fail(401,'google_code','Google кіру коды жоқ.')
  claims=self.identity.exchange(code,r['verifier'],r['nonce']);mail=email(claims.get('email'));subject=claims['sub']
  with self.db() as c:
   c.execute('BEGIN IMMEDIATE');u=c.execute('SELECT * FROM users WHERE google_sub=?',(subject,)).fetchone()
   if not u:
    invited=c.execute('SELECT * FROM users WHERE email=?',(mail,)).fetchone()
    if invited:
     if invited['google_sub'] or invited['auth_source']!='google-invited':fail(409,'google_account_conflict','Бұл email басқа профильге бекітілген. Әкімшіге хабарласыңыз.')
     if not invited['active']:fail(403,'account_removed','Бұл аккаунттың жобаға кіруі тоқтатылған.')
     uid=invited['id'];c.execute("UPDATE users SET google_sub=?,auth_source='google',verified=1,name=? WHERE id=?",(subject,str(claims.get('name') or mail)[:80],uid))
    else:
     uid=secrets.token_hex(12);c.execute("INSERT INTO users(id,email,name,role,password,google_sub,auth_source) VALUES(?,?,?,'student','google-managed',?,'google')",(uid,mail,str(claims.get('name') or mail)[:80],subject))
    u=c.execute('SELECT * FROM users WHERE id=?',(uid,)).fetchone();self.audit(c,uid,'google_register')
   elif u['email']!=mail:
    if u['role']=='admin':fail(403,'owner_email_changed','Әкімші поштасы өзгерген. Кіру тоқтатылды.')
    if c.execute('SELECT 1 FROM users WHERE email=? AND id<>?',(mail,u['id'])).fetchone():fail(409,'google_account_conflict','Email сәйкестігін әкімші тексеруі керек.')
    c.execute('UPDATE users SET email=? WHERE id=?',(mail,u['id']))
   try:token=self.session(c,u,cookie=cookie);return '/',token,None
   except ApiError as e:
    if e.code!='session_active':raise
    pending=secrets.token_urlsafe(32);c.execute('DELETE FROM oauth_pending WHERE expires<? OR user_id=?',(time.time(),u['id']));c.execute('INSERT INTO oauth_pending VALUES(?,?,?)',(token_hash(pending),u['id'],time.time()+300));return '/?view=session-confirm',None,pending
 def request(self,method,path,data,cookie='',ip='local'):
  if not isinstance(data,dict):fail(400,'json','JSON объект қажет.')
  if method=='POST':
   self.limit('request:'+ip,200,60)
   if path.startswith('/api/auth/'):
    self.limit('auth:'+ip,50,600)
    if 'email' in data:
     p=email(data['email']);self.limit(path+':'+p,12,600)
  token=None
  with self.db() as c:
   c.execute('BEGIN IMMEDIATE')
   if method=='GET' and path=='/api/config':return {'googleConfigured':self.identity.configured,'mode':'local-pilot','registration':'google','localTestLogin':self.allow_test_login},None
   if method=='POST' and path in ('/api/auth/google/confirm','/api/auth/google/cancel'):
    try:t=SimpleCookie(cookie).get('campus_pending');t=t.value if t else ''
    except Exception:t=''
    pending=c.execute('SELECT * FROM oauth_pending WHERE token_hash=? AND expires>?',(token_hash(t),time.time())).fetchone()
    if not pending:fail(401,'google_pending_expired','Кіру растауы аяқталды. Google арқылы қайта кіріңіз.')
    c.execute('DELETE FROM oauth_pending WHERE token_hash=?',(token_hash(t),))
    if path.endswith('cancel'):return {'ok':True},None
    if data.get('replaceSession') is not True:fail(400,'confirmation_required','Сессия ауыстыруды растаңыз.')
    u=c.execute('SELECT * FROM users WHERE id=?',(pending['user_id'],)).fetchone()
    return {'user':self.public_user(u)},self.session(c,u,True,cookie)
   if method=='POST' and path=='/api/auth/login':
    if not self.allow_test_login:fail(403,'test_login_disabled','Тек Google арқылы кіріңіз.')
    p=email(data.get('email'));u=c.execute("SELECT * FROM users WHERE email=? AND auth_source='local-test'",(p,)).fetchone()
    if not u or not password_ok(data.get('password'),u['password']):fail(401,'invalid_credentials','Email немесе сынақ паролі дұрыс емес.')
    token=self.session(c,u,data.get('replaceSession') is True,cookie);return {'user':self.public_user(u)},token
   u=self.user(c,cookie,allow_change=path in ('/api/me','/api/auth/password','/api/auth/logout'))
   uid=u['id']
   if method=='GET' and path=='/api/profile':
    return {'user':self.public_user(u),'session':{'singleActive':True,'expiresAt':u['expires']},'progress':self.progress(c,uid),'teacherRequest':dict(r) if (r:=c.execute('SELECT status,reason,decision_note FROM teacher_requests WHERE user_id=?',(uid,)).fetchone()) else None},None
   if method=='POST' and path=='/api/teacher-request':
    if u['role']!='student':fail(409,'role_conflict','Сіздің рөліңіз мұғалім не әкімші.')
    if u['auth_source']!='google' or not u['verified']:fail(403,'google_required','Алдымен Google арқылы кіріңіз.')
    reason=txt(data,'reason',10,1000)
    old=c.execute('SELECT status FROM teacher_requests WHERE user_id=?',(uid,)).fetchone()
    if old and old['status']=='pending':fail(409,'request_pending','Өтінішіңіз қаралуда.')
    c.execute("INSERT INTO teacher_requests(user_id,reason,status,created) VALUES(?,?,'pending',?) ON CONFLICT(user_id) DO UPDATE SET reason=excluded.reason,status='pending',created=excluded.created,reviewed=NULL,reviewer=NULL,decision_note=''",(uid,reason,time.time()))
    self.audit(c,uid,'teacher_request',uid);return {'ok':True},None
   if method=='GET' and path=='/api/staff/catalog':
    if u['role'] not in ('teacher','admin'):fail(403,'forbidden','Бұл каталог мұғалім мен әкімшіге арналған.')
    registry=ROOT/'materials/quarter1.json';items=json.loads(registry.read_text()) if registry.exists() else []
    lessons=[]
    for i,item in enumerate(items):
     lesson={'id':item.get('id',f'q1-resource-{i+1:02}'),'title':item.get('title','Оқу материалы'),'resources':[{k:r.get(k,'') for k in ('title','type','url')} for r in item.get('resources',[])]}
     if i==0:lesson.update(lessonUrl='/?lesson='+LESSON,gameUrl='/game/?lesson='+LESSON)
     lessons.append(lesson)
    return {'quarters':[{'number':1,'title':'Бірінші тоқсан','status':'ready','lessons':lessons},{'number':2,'title':'Екінші тоқсан','status':'not-imported','lessons':[]},{'number':3,'title':'Үшінші тоқсан','status':'external','lessons':[],'courseUrl':'https://it-club-10-course.vercel.app/index.html','gameUrl':'https://it-club-10-course.vercel.app/game/'},{'number':4,'title':'Төртінші тоқсан','status':'not-imported','lessons':[]}]},None
   if method=='POST' and path=='/api/auth/logout':c.execute('DELETE FROM sessions WHERE user_id=?',(uid,));return {'ok':True},''
   if method=='GET' and path in ('/api/me','/api/progress'):
    prog=self.progress(c,uid)
    if path.endswith('progress'):return prog,None
    s=c.execute('SELECT explanation,reflection,feedback,status FROM submissions WHERE user_id=?',(uid,)).fetchone();return {'user':self.public_user(u),'progress':prog,'submission':dict(s) if s else None},None
   if method=='GET' and path=='/api/lesson/'+LESSON:
    registry=ROOT/'materials/quarter1.json';items=json.loads(registry.read_text()) if registry.exists() else []
    resources=items[0]['resources'] if items else []
    return {'id':LESSON,'title':'Компьютерлік желілердің жұмыс жасау принциптері','objective':'10.6.1.1 — желілік компоненттердің мақсатын сипаттау: тораптар, маршрутизаторлар, коммутаторлар.','resources':resources,'missionId':MISSION},None
   if method=='GET' and path=='/api/lesson/q1-network-02':
    if u['role'] not in ('teacher','admin') and not self.progress(c,uid)['completed']:fail(403,'locked','Алдымен бірінші сабақты аяқтап, мұғалім бағасын алыңыз.')
    return {'id':'q1-network-02','title':'Желі. Желілік компоненттер','status':'coming-soon'},None
   if method=='POST' and path=='/api/attempts':
    if data.get('lessonId')!=LESSON or data.get('missionId')!=MISSION:fail(400,'mission','Бұл миссия пилотқа кірмейді.')
    existing=c.execute('SELECT id FROM attempts WHERE user_id=? AND lesson_id=? AND passed=0 ORDER BY created DESC LIMIT 1',(uid,LESSON)).fetchone()
    aid=existing['id'] if existing else secrets.token_hex(16)
    if not existing:c.execute('INSERT INTO attempts(id,user_id,lesson_id,mission_id,created) VALUES(?,?,?,?,?)',(aid,uid,LESSON,MISSION,time.time()))
    return {'attemptId':aid},None
   m=re.fullmatch('/api/attempts/([0-9a-f]{32})/submit',path)
   if method=='POST' and m:
    a=c.execute('SELECT * FROM attempts WHERE id=? AND user_id=?',(m[1],uid)).fetchone()
    if not a:fail(404,'attempt_missing','Орындау табылмады.')
    if a['passed']:return {'passed':True,'criteria':[{'id':k,'passed':True,'feedback':'Расталған нәтиже сақталған.'} for k in ['roles','links','fault']],'progress':self.progress(c,uid)},None
    roles=data.get('roles')=={'switch':'local','router':'networks','node':'endpoint'}
    links=data.get('links');norm=set()
    if isinstance(links,list) and len(links)<=10:
     for link in links:
      if isinstance(link,list) and len(link)==2 and all(isinstance(x,str) for x in link):norm.add(tuple(sorted(link)))
    wiring=norm=={tuple(sorted(x)) for x in [('pc1','switch'),('pc2','switch'),('switch','router')]} and isinstance(links,list) and len(links)==3
    fault=data.get('fault')=='cable';passed=roles and wiring and fault
    criteria=[{'id':k,'passed':v,'feedback':good if v else bad} for k,v,good,bad in [('roles',roles,'Құрылғылардың қызметі дұрыс.','Торап — соңғы құрылғы; коммутатор — жергілікті желі; маршрутизатор — желілер арасы.'),('links',wiring,'Екі компьютер коммутаторға, коммутатор маршрутизаторға қосылды.','Екі компьютерді коммутаторға, коммутаторды маршрутизаторға жалғаңыз.'),('fault',fault,'Үзілген кабель анықталды.','Жоғары желіге шығатын байланыс кабелін тексеріңіз.')]]
    c.execute('UPDATE attempts SET passed=?,evidence=? WHERE id=?',(int(passed),json.dumps(data,ensure_ascii=False),a['id']));return {'passed':passed,'criteria':criteria,'progress':self.progress(c,uid)},None
   if method=='POST' and path=='/api/submission':
    if u['role']!='student':fail(403,'student_required','Жұмысты оқушы аккаунтынан жіберіңіз.')
    if data.get('lessonId')!=LESSON:fail(400,'lesson','Қате сабақ.')
    if not self.progress(c,uid)['missionPassed']:fail(409,'mission_required','Алдымен миссияны аяқтаңыз.')
    exp,ref=txt(data,'explanation',20),txt(data,'reflection',20)
    old=c.execute('SELECT * FROM submissions WHERE user_id=?',(uid,)).fetchone()
    if not old or (old['explanation'],old['reflection'])!=(exp,ref):
     c.execute("INSERT INTO submissions(user_id,explanation,reflection) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET explanation=excluded.explanation,reflection=excluded.reflection,status='pending',feedback='',revision=submissions.revision+1",(uid,exp,ref));self.audit(c,uid,'submission')
    return {'ok':True,'progress':self.progress(c,uid)},None
   if method=='GET' and path=='/api/teacher/students':
    if u['role'] not in ('admin','teacher'):fail(403,'forbidden','Мұғалім рұқсаты қажет.')
    rows=c.execute("SELECT * FROM users WHERE active=1 AND role='student'"+(' AND class_id=?' if u['role']=='teacher' else ''),(u['class_id'],) if u['role']=='teacher' else ()).fetchall();students=[]
    for s in rows:
     sub=c.execute('SELECT explanation,reflection,feedback,status,revision FROM submissions WHERE user_id=?',(s['id'],)).fetchone();students.append({**self.public_user(s),'progress':self.progress(c,s['id']),'submission':dict(sub) if sub else None})
    return {'students':students},None
   if method=='POST' and path=='/api/teacher/review':
    target=txt(data,'studentId',1,60);self.scoped_student(c,u,target);prog=self.progress(c,target)
    if not prog['missionPassed'] or not prog['reflectionSubmitted']:fail(409,'not_submitted','Жұмыс әлі тапсырылмаған.')
    if not isinstance(data.get('approved'),bool):fail(400,'review','Бағалау шешімі қажет.')
    feedback=txt(data,'feedback',3);status='approved' if data['approved'] else 'revise'
    c.execute('UPDATE submissions SET status=?,feedback=? WHERE user_id=?',(status,feedback,target));self.audit(c,uid,'review',target,status+': '+feedback);return {'ok':True},None
   if path.startswith('/api/admin/'):
    if u['role']!='admin':fail(403,'forbidden','Әкімші рұқсаты қажет.')
    if method=='GET' and path=='/api/admin/users':return {'users':[self.public_user(x) for x in c.execute('SELECT * FROM users ORDER BY name')],'requests':[dict(x) for x in c.execute("SELECT r.*,u.name,u.email FROM teacher_requests r JOIN users u ON u.id=r.user_id WHERE r.status='pending' AND u.active=1 ORDER BY r.created")]},None
    if method=='POST' and path in ('/api/admin/change-role','/api/admin/remove-user','/api/admin/restore-user','/api/admin/review-request'):
     target=txt(data,'userId',1,60);v=c.execute('SELECT * FROM users WHERE id=?',(target,)).fetchone()
     if not v:fail(404,'not_found','Аккаунт табылмады.')
     if v['role']=='admin' or target==uid:fail(403,'admin_protected','Жалғыз әкімшінің рөлін не қолжетімділігін өзгертуге болмайды.')
     if path.endswith('review-request'):
      r=c.execute("SELECT * FROM teacher_requests WHERE user_id=? AND status='pending'",(target,)).fetchone()
      if not r or not v['active']:fail(409,'request_closed','Өтініш қаралған немесе аккаунт жабылған.')
      if not isinstance(data.get('approved'),bool):fail(400,'decision','Шешім қажет.')
      note=txt(data,'note',0,500);status='approved' if data['approved'] else 'rejected'
      c.execute('UPDATE teacher_requests SET status=?,reviewed=?,reviewer=?,decision_note=? WHERE user_id=?',(status,time.time(),uid,note,target))
      if data['approved']:c.execute("UPDATE users SET role='teacher' WHERE id=?",(target,))
      self.audit(c,uid,'teacher_request_'+status,target,note)
     elif path.endswith('change-role'):
      role=data.get('role')
      if role not in ('student','teacher'):fail(400,'role','Тек оқушы немесе мұғалім рөлін таңдаңыз.')
      if not v['active']:fail(409,'account_removed','Алдымен аккаунтқа қолжетімділікті қайтарыңыз.')
      c.execute('UPDATE users SET role=? WHERE id=?',(role,target));c.execute("UPDATE teacher_requests SET status='cancelled',reviewed=?,reviewer=? WHERE user_id=? AND status='pending'",(time.time(),uid,target));self.audit(c,uid,'role_changed',target,v['role']+' -> '+role)
     else:
      active=path.endswith('restore-user');c.execute('UPDATE users SET active=? WHERE id=?',(int(active),target))
      if not active:c.execute("UPDATE teacher_requests SET status='cancelled',reviewed=?,reviewer=? WHERE user_id=? AND status='pending'",(time.time(),uid,target))
      self.audit(c,uid,'access_restored' if active else 'access_removed',target)
     c.execute('DELETE FROM sessions WHERE user_id=?',(target,));c.execute('DELETE FROM oauth_pending WHERE user_id=?',(target,));return {'ok':True},None
    if method=='POST' and path=='/api/admin/revoke-session':
     target=txt(data,'userId',1,60);v=c.execute('SELECT * FROM users WHERE id=?',(target,)).fetchone()
     if not v:fail(404,'not_found','Аккаунт табылмады.')
     if v['role']=='admin':fail(403,'admin_protected','Әкімші аккаунтын Google арқылы басқарыңыз.')
     c.execute('DELETE FROM sessions WHERE user_id=?',(target,))
     self.audit(c,uid,'revoke_session',target);return {'ok':True},None
   fail(404,'not_found','Мұндай әрекет табылмады.')

class Handler(SimpleHTTPRequestHandler):
 server_version='ITCampusPilot'
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'public'),**kwargs)
 def log_message(self,*args):pass
 def end_headers(self):
  self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','strict-origin-when-cross-origin');self.send_header('X-Frame-Options','SAMEORIGIN');super().end_headers()
 def json_response(self,status,result,token=None):
  b=json.dumps(result,ensure_ascii=False).encode();self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(b)))
  if token is not None:self.send_header('Set-Cookie','campus_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+('28800' if token else '0'))
  self.end_headers();self.wfile.write(b)
 def api(self,method):
  try:
   expected='127.0.0.1:'+str(self.server.server_port)
   if self.headers.get('Host')!=expected:fail(403,'host','Қате мекенжай.')
   path=urllib.parse.urlsplit(self.path).path;data={}
   if method=='POST':
    if self.headers.get('X-Campus-Request')!='1' or self.headers.get('Origin','http://'+expected)!='http://'+expected:fail(403,'csrf','Сұрауды сайттан жіберіңіз.')
    if 'application/json' not in self.headers.get('Content-Type',''):fail(415,'json','JSON қажет.')
    try:n=int(self.headers.get('Content-Length','0'))
    except ValueError:fail(400,'size','Қате сұрау.')
    if not 0<n<=16000:fail(413,'size','Сұрау көлемі тым үлкен.')
    try:data=json.loads(self.rfile.read(n))
    except (ValueError,UnicodeError):fail(400,'json','Қате JSON.')
   result,token=self.server.store.request(method,path,data,self.headers.get('Cookie',''),self.client_address[0]);self.json_response(200,result,token)
  except ApiError as e:self.json_response(e.status,{'error':e.message,'code':e.code})
  except sqlite3.IntegrityError:self.json_response(409,{'error':'Бұл Google аккаунтына профиль тіркелген.','code':'conflict'})
  except Exception:self.json_response(500,{'error':'Ішкі қате. Қайталап көріңіз.','code':'internal'})
 def oauth(self,path):
  expected='127.0.0.1:'+str(self.server.server_port)
  if self.headers.get('Host')!=expected:return self.json_response(403,{'code':'host','error':'Қате мекенжай.'})
  cookies=[]
  try:
   self.server.store.limit('google:'+self.client_address[0],30,600)
   if path=='/api/auth/google/start':
    location,state=self.server.store.google_start();cookies.append('campus_oauth='+state+'; HttpOnly; SameSite=Lax; Path=/; Max-Age=600')
   else:
    location,token,pending=self.server.store.google_callback(urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query),self.headers.get('Cookie',''))
    cookies.append('campus_oauth=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
    if token:cookies.append('campus_session='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800')
    if pending:cookies.append('campus_pending='+pending+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=300')
  except ApiError as e:location='/?view=auth&authError='+urllib.parse.quote(e.code)
  except Exception:location='/?view=auth&authError=google_failed'
  self.send_response(303);self.send_header('Location',location);self.send_header('Cache-Control','no-store')
  for cookie in cookies:self.send_header('Set-Cookie',cookie)
  self.send_header('Content-Length','0');self.end_headers()
 def do_GET(self):
  path=urllib.parse.urlsplit(self.path).path
  if path in ('/api/auth/google/start','/api/auth/google/callback'):return self.oauth(path)
  if self.path.startswith('/api/'):return self.api('GET')
  # Serve only public build files, never private data, credentials, registry source or directory listing.
  path=Path(self.translate_path(self.path)).resolve();public=(ROOT/'public').resolve()
  if not path.is_relative_to(public) or any(x.startswith('.') for x in path.relative_to(public).parts):return self.send_error(404)
  super().do_GET()
 def do_POST(self):self.api('POST')
 def list_directory(self,path):self.send_error(404);return None

def run(port=8890,db=None):
 srv=ThreadingHTTPServer(('127.0.0.1',port),Handler);srv.store=Store(db or ROOT/'data/pilot.sqlite3');print(f'Pilot http://127.0.0.1:{port}',flush=True);srv.serve_forever()
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=8890);args=p.parse_args();run(args.port)
