"""Prepare a reviewed source snapshot, never include private credentials or learner data."""
from pathlib import Path
import subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[1]
GAME=Path('/Users/ersultan/Documents/Codex/2026-11-08/it-campus-year-game/outputs/game-source')
OLD=Path('/Users/ersultan/Desktop/IT_CAMPUS')
known=set()
for line in subprocess.check_output(['git','-C',str(OLD),'ls-tree','-r','HEAD']).decode().splitlines():
 known.add(line.split()[2])
entries=[]
def add(path,target):
 if path.is_symlink() or not path.is_file():return
 data=path.read_bytes();sha=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
 entry={'path':target,'source':str(path),'sha':sha,'size':len(data),'existing':sha in known}
 try:
  text=data.decode('utf8')
  if '\x00' in text:raise UnicodeError()
  # Secrets may never enter a versioned source snapshot.
  import re
  if re.search(r'GOCSPX-[\w-]{12,}|sb_secret_[\w-]{12,}|gh[pousr]_[A-Za-z0-9]{20,}',text):raise RuntimeError('Secret pattern in '+target)
  entry['content']=text
 except UnicodeError:entry['binary']=True
 entries.append(entry)
for name in ['server.py','course_catalog.json','course_content.py','requirements.txt','README.md','CONTRACT.md','GOOGLE_SETUP.md','DESIGN_AUDIT.md','CLOUD_DATABASE.md','BACKUP_POLICY.md','seed_local.py','.gitignore']:
 add(ROOT/name,'pilot/'+name)
for dirname in ['tests','scripts','database','legacy-game-source']:
 for p in (ROOT/dirname).rglob('*'):
  if not any(x in p.parts for x in ['__pycache__','node_modules','dist']):add(p,'pilot/'+str(p.relative_to(ROOT)))
for p in (ROOT/'public').rglob('*'):
 if p.relative_to(ROOT/'public').parts[0] != 'game':add(p,'pilot/'+str(p.relative_to(ROOT)))
# Preserve the material registry without absolute MacBook paths.
registry=json.loads((ROOT/'materials/quarter1.json').read_text())
for lesson in registry:
 lesson.pop('folder',None)
 for r in lesson.get('resources',[]):r.pop('localPath',None)
content=json.dumps(registry,ensure_ascii=False,indent=2)
entries.append({'path':'pilot/materials/quarter1.json','content':content,'sha':hashlib.sha1(b'blob '+str(len(content.encode())).encode()+b'\0'+content.encode()).hexdigest(),'existing':False,'size':len(content.encode())})
for name in ['quarter2.json','classroom-q2-raw.json','extended-content.json']:
 add(ROOT/'materials'/name,'pilot/materials/'+name)
for p in (ROOT/'materials/legal').glob('*'):add(p,'pilot/materials/legal/'+p.name)
for dirname in ['src','public','tests','scripts','worker','asset-audit','integration']:
 for p in (GAME/dirname).rglob('*'):
  if not any(x.startswith('.') for x in p.relative_to(GAME).parts):add(p,'game-source/'+str(p.relative_to(GAME)))
for name in ['package.json','package-lock.json','pnpm-workspace.yaml','vite.config.mjs','index.html','AGENTS.md','HANDOFF.md','DISTRICTS.md','.openai/hosting.json']:
 add(GAME/name,'game-source/'+name)
# Snapshot manifest is private orchestration metadata, not uploaded itself.
out=ROOT/'data/github-snapshot.json';out.write_text(json.dumps(entries,ensure_ascii=False));out.chmod(0o600)
print(json.dumps({'files':len(entries),'existing_blobs':sum(e['existing'] for e in entries),'new_binary_bytes':sum(e['size'] for e in entries if e.get('binary') and not e['existing'])}))
