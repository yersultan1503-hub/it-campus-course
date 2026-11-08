"""HTTPS deployment entry. Static curriculum remains behind the same access checks."""
import json,os,posixpath,urllib.parse
from pathlib import Path
from functools import lru_cache
from fastapi import FastAPI,Request
from fastapi.responses import JSONResponse,RedirectResponse,FileResponse
from starlette.concurrency import run_in_threadpool
from server import Store,ApiError,fail,ROOT
app=FastAPI(docs_url=None,redoc_url=None,openapi_url=None)
ORIGIN=os.getenv('CAMPUS_ORIGIN','http://127.0.0.1:8891').rstrip('/')
SECURE=ORIGIN.startswith('https:')
@lru_cache(maxsize=1)
def store():
 if not os.getenv('CAMPUS_DATABASE_URL'):raise RuntimeError('Shared database must be configured')
 return Store('/tmp/campus-no-local-fallback.sqlite3')
def cookie(response,key,value,age,same='strict'):
 response.set_cookie(key,value,max_age=age,httponly=True,secure=SECURE,samesite=same,path='/')
@app.middleware('http')
async def headers(request,call_next):
 try:response=await call_next(request)
 except ApiError as e:response=JSONResponse({'error':e.message,'code':e.code},status_code=e.status)
 response.headers.update({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'SAMEORIGIN'})
 if request.url.path.startswith(('/api/','/resources/','/legacy-q3/game')):response.headers['Cache-Control']='private, no-store'
 if request.url.path.startswith('/resources/course/') and request.url.path.endswith('.html'):response.headers['Content-Security-Policy']="sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"
 return response
@app.get('/api/auth/google/{action}')
def oauth(action:str,request:Request):
 if action not in ('start','callback'):fail(404,'not_found','Бет табылмады.')
 cookies=[]
 try:
  store().limit('google:'+(request.client.host if request.client else 'remote'),30,600)
  if action=='start':
   location,state=store().google_start();cookies.append(('campus_oauth',state,600,'lax'))
  else:
   location,token,pending=store().google_callback(urllib.parse.parse_qs(request.url.query),request.headers.get('cookie',''));cookies.append(('campus_oauth','',0,'lax'))
   if token:cookies.append(('campus_session',token,28800,'strict'))
   if pending:cookies.append(('campus_pending',pending,300,'strict'))
 except ApiError as e:location='/?view=auth&authError='+urllib.parse.quote(e.code)
 response=RedirectResponse(location,status_code=303)
 for name,value,age,same in cookies:cookie(response,name,value,age,same)
 return response
@app.api_route('/api/{path:path}',methods=['GET','POST'])
async def api(path:str,request:Request):
 data={}
 if request.method=='POST':
  if request.headers.get('origin')!=ORIGIN or request.headers.get('x-campus-request')!='1':fail(403,'csrf','Сұрауды сайттан жіберіңіз.')
  if 'application/json' not in request.headers.get('content-type',''):fail(415,'json','JSON қажет.')
  body=await request.body()
  if not 0<len(body)<=16000:fail(413,'size','Сұрау көлемі тым үлкен.')
  try:data=json.loads(body)
  except (ValueError,UnicodeError):fail(400,'json','Қате JSON.')
 result,token=await run_in_threadpool(store().request,request.method,'/api/'+path,data,request.headers.get('cookie',''),request.client.host if request.client else 'remote')
 response=JSONResponse(result)
 if token is not None:cookie(response,'campus_session',token,28800 if token else 0)
 return response
@app.api_route('/{resource:path}',methods=['GET','HEAD'])
def file(resource:str,request:Request):
 path=posixpath.normpath('/'+urllib.parse.unquote(resource).lstrip('/'))
 if path.startswith(('/resources/course/','/resources/qmj/')) or path in ('/legacy-q3/game','/legacy-q3/game/index.html'):
  with store().db() as c:
   u=store().user(c,request.headers.get('cookie',''))
   if path.startswith('/legacy-q3/game'):
    keys=['html','table','links','css','media','js','quiz','db'];key=request.query_params.get('lesson','html')
    if key not in keys:fail(404,'lesson_missing','Сабақ табылмады.')
    if not store().unlocked(c,u,store().lesson('q3-%02d'%(keys.index(key)+1))):fail(403,'locked','Алдыңғы сабақ әлі аяқталмаған.')
   elif path.startswith('/resources/qmj/Q'):
    if u['role'] not in ('teacher','admin'):fail(403,'forbidden','ҚМЖ мұғалімге арналған.')
   else:
    matches=[(l,r) for l in store().catalog for r in l['resources'] if path in [urllib.parse.unquote(r.get(k,'')) for k in ('url','previewUrl','downloadUrl')]]
    if not matches or not any((not r.get('staffOnly') or u['role'] in ('teacher','admin')) and store().unlocked(c,u,l) for l,r in matches):fail(403,'forbidden','Бұл материалға рұқсат жоқ.')
 public=ROOT/'public';private=ROOT/'private_resources'
 if path.startswith('/resources/') and private.exists():target=private/path.removeprefix('/resources/')
 elif path in ('/legacy-q3/game','/legacy-q3/game/index.html') and (ROOT/'private_legacy.html').exists():target=ROOT/'private_legacy.html'
 else:target=public/path.lstrip('/')
 if path.startswith('/resources/') and path.endswith('.mp4') and not target.exists():
  media=public/'media'/path.removeprefix('/resources/')
  if path in json.loads((ROOT/'media_paths.json').read_text()) if (ROOT/'media_paths.json').exists() else media.is_file():return RedirectResponse('/media/'+urllib.parse.quote(path.removeprefix('/resources/')),status_code=307)
 if target.is_dir():target=target/'index.html'
 if not target.resolve().is_relative_to(ROOT.resolve()) or any(x.startswith('.') for x in Path(path).parts) or not target.is_file():fail(404,'not_found','Бет табылмады.')
 return FileResponse(target)
