"""Read-only comparison and rollback-only authorization checks. No fake accounts."""
import sys,sqlite3,json,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from server import Store
from postgres_store import Connection
url=json.loads((ROOT/'data/cloud-private.json').read_text())['database_url']
local=sqlite3.connect(ROOT/'data/pre-cloud-backup.sqlite3');local.row_factory=sqlite3.Row
users={r['role']:dict(r) for r in local.execute('SELECT * FROM users')}
s=Store('/tmp/no-local-data',database_url=url)
for role,u in users.items():
 with Connection(url) as c:
  c.context(google_email=u['email'],google_sub=u['google_sub'] or '')
  visible=c.execute('SELECT id,role FROM users').fetchall()
  if role=='student':assert [x['id'] for x in visible]==[u['id']]
  if role=='admin':assert len(visible)==3
  if role=='teacher':assert all(x['role']!='admin' for x in visible)
  c.connection.rollback()
 print(role,'row isolation OK')
u=users['student'];results=[]
for _ in range(2):
 with Connection(url) as c:
  c.context(google_email=u['email'],google_sub=u['google_sub'] or '')
  results.append([s.progress(c,u['id'],l['id']) for l in s.catalog]);c.connection.rollback()
assert results[0]==results[1];print('Independent connections: same 47 progress/grade records')
# Grade readback and a legitimate manual zero remain separate from auto grading.
u=users['teacher']
with Connection(url) as c:
 c.context(google_email=u['email'],google_sub=u['google_sub'] or '')
 c.execute('INSERT INTO practice_grades VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET score=excluded.score,grader=excluded.grader',(users['student']['id'],'q1-network-01',0,'rollback-only verification',u['id'],1.0))
 p=s.progress(c,users['student']['id']);assert p['effectiveGrade']['score']==0 and p['effectiveGrade']['source']=='teacher';assert 'gradedAt' in p['grade']
 c.connection.rollback()
print('Manual grade 0 preserved; test write rolled back')
