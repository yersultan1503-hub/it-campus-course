"""Create explicitly test-only local accounts. Never run against production."""
from server import Store,ROOT
import secrets,json,os
s=Store(ROOT/'data/pilot.sqlite3');records=[]
for role,n in [('student',1),('student',2),('teacher',3),('admin',4)]:
 p=f'{role}{n}@it-campus.invalid'
 with s.db() as c:
  if c.execute('SELECT 1 FROM users WHERE email=?',(p,)).fetchone():continue
 password=secrets.token_urlsafe(18);s.create(p,f'Сынақ {role} {n}',role,password)
 records.append({'role':role,'email':p,'password':password})
if records:
 path=ROOT/'data/LOCAL_TEST_ACCOUNTS.json';path.write_text(json.dumps(records,ensure_ascii=False,indent=2));os.chmod(path,0o600)
print('Local test accounts ready; private file data/LOCAL_TEST_ACCOUNTS.json. No Google accounts created.')
