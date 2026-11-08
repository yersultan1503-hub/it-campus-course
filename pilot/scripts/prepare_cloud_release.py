"""Build a release without private account data, credentials, test logins or old builds."""
from pathlib import Path
import shutil,json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT.parent/'year-cloud-release';OUT.mkdir(exist_ok=True)
for name in ['app.py','server.py','postgres_store.py','course_content.py','course_catalog.json','requirements.txt']:
 shutil.copy2(ROOT/name,OUT/name)
(OUT/'materials').mkdir(exist_ok=True)
shutil.copy2(ROOT/'materials/extended-content.json',OUT/'materials/extended-content.json')
(OUT/'database').mkdir(exist_ok=True);shutil.copy2(ROOT/'database/supabase-ca.crt',OUT/'database/supabase-ca.crt')
shutil.copytree(ROOT/'public',OUT/'public',dirs_exist_ok=True,ignore=shutil.ignore_patterns('resources'))
shutil.copytree(ROOT/'public/resources',OUT/'private_resources',dirs_exist_ok=True)
# Course videos are public teaching media, not account or assessment data.
# Serve them on the CDN; authenticated resource entry still checks the lesson.
media_paths=[]
for video in (OUT/'private_resources').rglob('*.mp4'):
 media_paths.append('/resources/'+str(video.relative_to(OUT/'private_resources')))
 target=OUT/'public/media'/video.relative_to(OUT/'private_resources');target.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(video),target)
(OUT/'media_paths.json').write_text(json.dumps(media_paths))
# The old game entry must pass authentication before its HTML is delivered.
p=OUT/'public/legacy-q3/game/index.html'
if p.exists():shutil.copy2(p,OUT/'private_legacy.html');p.unlink()
# Remove superseded compiled JS/CSS from the staged game, keep asset models.
import re
index=(OUT/'public/game/index.html').read_text()
for p in (OUT/'public/game/assets').glob('campus-*'):
 if p.suffix in ('.js','.css') and p.name not in index:p.unlink()
(OUT/'vercel.json').write_text(json.dumps({'framework':'fastapi','regions':['fra1'],'functions':{'app.py':{'excludeFiles':'public/**'}}},indent=2))
(OUT/'.vercel').mkdir(exist_ok=True);(OUT/'.vercel/project.json').write_text(json.dumps({'projectId':'prj_9WB2Ez89pycG2PECtMED3yoGhofX','orgId':'team_ve9BglR4R0z0tHpSHuYMmfMR','projectName':'it-campus-year-course'}))
(OUT/'.python-version').write_text('3.12\n')
(OUT/'.vercelignore').write_text('.git\n__pycache__\n*.pyc\n.env*\n')
print('Prepared',OUT)
print('Private protected resources:',sum(p.stat().st_size for p in (OUT/'private_resources').rglob('*') if p.is_file())//1024//1024,'MB')
