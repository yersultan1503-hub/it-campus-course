import test_server as support
from test_server import FakeGoogle,PASS
from server import Store,ApiError
from pathlib import Path
import tempfile,unittest
class AccessTests(unittest.TestCase):
 setUp=support.PilotTests.setUp
 tearDown=support.PilotTests.tearDown
 req=support.PilotTests.req
 login=support.PilotTests.login
 raises=support.PilotTests.raises
 finish=support.PilotTests.finish
 def test_teacher_application_and_role_changes(self):
  with self.s.db() as c:c.execute("UPDATE users SET auth_source='google',google_sub='student-sub' WHERE id=?",(self.a,))
  with self.s.db() as c:token=self.s.session(c,c.execute('SELECT * FROM users WHERE id=?',(self.a,)).fetchone())
  student='campus_session='+token;admin=self.login('admin4@it-campus.invalid');teacher=self.login('teacher3@it-campus.invalid')
  self.req('/api/teacher-request',{'reason':'I teach informatics in class 10A.'},student)
  self.raises('request_pending',lambda:self.req('/api/teacher-request',{'reason':'Duplicate request'},student))
  self.raises('forbidden',lambda:self.req('/api/admin/change-role',{'userId':self.a,'role':'teacher'},teacher))
  rows=self.req('/api/admin/users',{},admin,'GET')[0]['requests'];self.assertEqual(rows[0]['user_id'],self.a)
  self.req('/api/admin/review-request',{'userId':self.a,'approved':True,'note':'Approved'},admin)
  self.raises('login_required',lambda:self.req('/api/me',{},student,'GET'))
  with self.s.db() as c:self.assertEqual(c.execute('SELECT role FROM users WHERE id=?',(self.a,)).fetchone()[0],'teacher')
  self.raises('request_closed',lambda:self.req('/api/admin/review-request',{'userId':self.a,'approved':True,'note':''},admin))
  self.req('/api/admin/change-role',{'userId':self.a,'role':'student'},admin)
  self.raises('role',lambda:self.req('/api/admin/change-role',{'userId':self.a,'role':'admin'},admin))
  for path in ['change-role','remove-user','restore-user','review-request']:
   self.raises('admin_protected',lambda:self.req('/api/admin/'+path,{'userId':self.admin,'role':'student'},admin))
 def test_remove_revokes_and_blocks_reentry_restore_preserves_progress(self):
  student=self.login('student1@it-campus.invalid');admin=self.login('admin4@it-campus.invalid');self.finish(student)
  self.req('/api/admin/remove-user',{'userId':self.a},admin)
  self.raises('login_required',lambda:self.req('/api/me',{},student,'GET'))
  self.raises('account_removed',lambda:self.login('student1@it-campus.invalid'))
  self.req('/api/admin/restore-user',{'userId':self.a},admin)
  new=self.login('student1@it-campus.invalid');self.assertTrue(self.req('/api/profile',{},new,'GET')[0]['progress']['missionPassed'])
 def test_default_disables_password_entry(self):
  s=Store(Path(self.tmp.name)/'closed',FakeGoogle());s.create('a@example.com','A','admin',PASS)
  self.raises('test_login_disabled',lambda:s.request('POST','/api/auth/login',{'email':'a@example.com','password':PASS}))
 def test_invitation_claim_requires_matching_verified_google_email(self):
  with self.s.db() as c:c.execute("INSERT INTO users(id,email,name,role,password,auth_source,verified) VALUES('invited','invited@example.com','Invited','teacher','google-managed','google-invited',0)")
  _,state=self.s.google_start();_,token,_=self.s.google_callback({'state':[state],'code':['invited']},'campus_oauth='+state)
  user=self.req('/api/profile',{},'campus_session='+token,'GET')[0]['user'];self.assertEqual(user['role'],'teacher');self.assertTrue(user['emailVerified'])
