import sys,tempfile,unittest,sqlite3,concurrent.futures,urllib.parse,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server import Store,ApiError,email,LESSON,MISSION,token_hash
PASS='A-test-only-password-2026'
class FakeGoogle:
 configured=True
 def authorization_url(self,state,nonce,verifier):return 'https://accounts.google.com/o/oauth2/v2/auth?state='+state
 def exchange(self,code,verifier,nonce):
  if code=='bad':raise ApiError(401,'google_failed','bad')
  return {'sub':code,'email':code+'@example.com','email_verified':True,'name':'Google Test'}
class PilotTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.s=Store(Path(self.tmp.name)/'db',FakeGoogle(),allow_test_login=True)
  self.a=self.s.create('student1@it-campus.invalid','Student','student',PASS)
  self.b=self.s.create('student2@it-campus.invalid','Other','student',PASS,'10B')
  self.t=self.s.create('teacher3@it-campus.invalid','Teacher','teacher',PASS)
  self.admin=self.s.create('admin4@it-campus.invalid','Admin','admin',PASS)
 def tearDown(self):self.tmp.cleanup()
 def req(self,p,d={},cookie='',method='POST'):return self.s.request(method,p,d,cookie)
 def login(self,p):return 'campus_session='+self.req('/api/auth/login',{'email':p,'password':PASS})[1]
 def raises(self,code,fn):
  with self.assertRaises(ApiError) as e:fn()
  self.assertEqual(e.exception.code,code)
 def finish(self,c):
  a=self.req('/api/attempts',{'lessonId':LESSON,'missionId':MISSION},c)[0]['attemptId']
  r=self.req('/api/attempts/'+a+'/submit',{'roles':{'switch':'local','router':'networks','node':'endpoint'},'links':[['pc1','switch'],['pc2','switch'],['router','switch']],'fault':'cable'},c)[0]
  self.assertTrue(r['passed']);return a
 def test_end_to_end_review_unlock_persistence_and_scope(self):
  c=self.login('student1@it-campus.invalid');t=self.login('teacher3@it-campus.invalid')
  self.raises('locked',lambda:self.req('/api/lesson/q1-network-02',{},c,'GET'))
  a=self.finish(c);self.assertTrue(self.req('/api/attempts/'+a+'/submit',{},c)[0]['passed'])
  data={'lessonId':LESSON,'explanation':'Коммутатор жергілікті желідегі екі компьютерді байланыстырады.','reflection':'Мен бүгін құрылғылардың міндетін және желіні қосуды түсіндім.'}
  self.req('/api/submission',data,c);self.assertFalse(self.req('/api/progress',{},c,'GET')[0]['nextUnlocked'])
  self.req('/api/teacher/review',{'studentId':self.a,'approved':True,'feedback':'Үш критерий орындалды.'},t)
  self.assertTrue(self.req('/api/progress',{},c,'GET')[0]['completed'])
  self.assertEqual(self.req('/api/lesson/q1-network-02',{},c,'GET')[0]['status'],'ready')
  reopened=Store(self.s.path,FakeGoogle());self.assertTrue(reopened.request('GET','/api/progress',{},c)[0]['completed'])
  self.req('/api/submission',data,c);self.assertTrue(self.req('/api/progress',{},c,'GET')[0]['completed'])
  self.assertEqual(len(self.req('/api/teacher/students',{},t,'GET')[0]['students']),1)
  self.raises('forbidden',lambda:self.req('/api/teacher/review',{'studentId':self.b,'approved':True,'feedback':'test'},t))
 def test_no_score_spoof_or_other_user_attempt(self):
  c=self.login('student1@it-campus.invalid');b=self.login('student2@it-campus.invalid');a=self.req('/api/attempts',{'lessonId':LESSON,'missionId':MISSION},c)[0]['attemptId']
  self.assertFalse(self.req('/api/attempts/'+a+'/submit',{'passed':True,'score':100},c)[0]['passed'])
  self.raises('attempt_missing',lambda:self.req('/api/attempts/'+a+'/submit',{},b))
  self.raises('mission_required',lambda:self.req('/api/submission',{'lessonId':LESSON,'explanation':'x'*20,'reflection':'x'*20},c))
  self.raises('forbidden',lambda:self.req('/api/admin/users',{},c,'GET'))
 def test_single_session_and_admin_revoke(self):
  c=self.login('student1@it-campus.invalid');adm=self.login('admin4@it-campus.invalid')
  self.raises('session_active',lambda:self.login('student1@it-campus.invalid'))
  c2='campus_session='+self.req('/api/auth/login',{'email':'student1@it-campus.invalid','password':PASS,'replaceSession':True})[1]
  self.raises('login_required',lambda:self.req('/api/me',{},c,'GET'))
  self.req('/api/admin/revoke-session',{'userId':self.a},adm)
  self.raises('login_required',lambda:self.req('/api/me',{},c2,'GET'))
  self.raises('not_found',lambda:self.req('/api/admin/reset-password',{'userId':self.a},adm))
 def test_email_unique_and_role_restriction(self):
  self.assertEqual(email(' Student1@IT-CAMPUS.invalid '),'student1@it-campus.invalid')
  with self.assertRaises(sqlite3.IntegrityError):self.s.create('STUDENT1@IT-CAMPUS.INVALID','Duplicate','student',PASS)
  u=self.login('student1@it-campus.invalid');self.assertEqual(self.req('/api/me',{},u,'GET')[0]['user']['role'],'student')
  self.raises('login_required',lambda:self.req('/api/auth/register',{'email':'new@example.com','role':'admin'}))
 def test_concurrent_logins_allow_only_one(self):
  def f(_):
   try:return self.req('/api/auth/login',{'email':'student1@it-campus.invalid','password':PASS})[1]
   except ApiError as e:return e.code
  with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(f,range(2)))
  self.assertEqual(results.count('session_active'),1)
 def test_google_state_replay_and_session_confirm(self):
  _,state=self.s.google_start()
  self.raises('google_state',lambda:self.s.google_callback({'state':[state],'code':['google1']},'campus_oauth=wrong'))
  dest,token,pending=self.s.google_callback({'state':[state],'code':['google1']},'campus_oauth='+state)
  self.assertEqual(dest,'/');self.assertIsNone(pending)
  c='campus_session='+token;u=self.req('/api/me',{},c,'GET')[0]['user'];self.assertEqual(u['email'],'google1@example.com');self.assertEqual(u['role'],'student')
  self.raises('google_state',lambda:self.s.google_callback({'state':[state],'code':['google1']},'campus_oauth='+state))
  _,state2=self.s.google_start();dest,token2,pending=self.s.google_callback({'state':[state2],'code':['google1']},'campus_oauth='+state2)
  self.assertIsNone(token2);self.assertEqual(dest,'/?view=session-confirm');self.assertTrue(pending)
  confirmed,token3=self.req('/api/auth/google/confirm',{'replaceSession':True},'campus_pending='+pending)
  self.raises('login_required',lambda:self.req('/api/me',{},c,'GET'))
  self.assertEqual(confirmed['user']['id'],u['id']);self.assertTrue(token3)
  self.raises('google_pending_expired',lambda:self.req('/api/auth/google/confirm',{'replaceSession':True},'campus_pending='+pending))
  self.raises('invalid_credentials',lambda:self.req('/api/auth/login',{'email':'google1@example.com','password':PASS}))
 def test_profile_verification_and_staff_catalog(self):
  student=self.login('student1@it-campus.invalid');teacher=self.login('teacher3@it-campus.invalid');admin=self.login('admin4@it-campus.invalid')
  p=self.req('/api/profile',{},student,'GET')[0]
  self.assertFalse(p['user']['emailVerified']);self.assertEqual(p['user']['accessMode'],'student');self.assertTrue(p['session']['singleActive'])
  self.assertNotIn('password',p['user'])
  self.raises('forbidden',lambda:self.req('/api/staff/catalog',{},student,'GET'))
  self.raises('locked',lambda:self.req('/api/lesson/q1-network-02',{},student,'GET'))
  for session in (teacher,admin):
   catalog=self.req('/api/staff/catalog',{},session,'GET')[0]
   self.assertEqual([q['number'] for q in catalog['quarters']],[1,2,3,4])
   self.assertEqual(self.req('/api/lesson/q1-network-02',{},session,'GET')[0]['status'],'ready')
   self.assertEqual(self.req('/api/profile',{},session,'GET')[0]['user']['accessMode'],'staff')
  _,state=self.s.google_start();_,token,_=self.s.google_callback({'state':[state],'code':['profile-google']},'campus_oauth='+state)
  self.assertTrue(self.req('/api/profile',{},'campus_session='+token,'GET')[0]['user']['emailVerified'])
 def test_rate_limit_and_google_not_configured(self):
  for i in range(2):self.s.limit('small',2,60)
  self.raises('rate_limit',lambda:self.s.limit('small',2,60))
  from server import GoogleIdentity
  v=GoogleIdentity();v.client_id=v.secret='';self.s.identity=v
  self.raises('google_not_configured',lambda:self.s.google_start())
if __name__=='__main__':unittest.main()
