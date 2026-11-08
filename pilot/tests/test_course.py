import unittest,json
import test_server as support
from server import LESSON,MISSION,ApiError
from course_content import BANK
class CourseTests(unittest.TestCase):
 def test_resource_access_paths(self):
  from server import Handler
  from types import SimpleNamespace
  student=self.login('student1@it-campus.invalid');admin=self.login('admin4@it-campus.invalid')
  h=object.__new__(Handler);h.server=SimpleNamespace(store=self.s);results=[]
  h.json_response=lambda status,payload:results.append(status)
  for path,cookie,allowed in [('/resources/course/q1/07-01.pdf',student,False),('/x/../resources/course/q1/07-01.pdf',student,False),('/resources/course/q1/07-01.pdf',admin,True),('/resources/course/q1/01-01.pdf','',False)]:
   h.path=path;h.headers={'Cookie':cookie};self.assertEqual(h.resource_access(),allowed)
 setUp=support.PilotTests.setUp
 tearDown=support.PilotTests.tearDown
 req=support.PilotTests.req
 login=support.PilotTests.login
 raises=support.PilotTests.raises
 finish=support.PilotTests.finish
 def test_name_edit_visible_to_teacher_and_admin_without_role_escalation(self):
  student=self.login('student1@it-campus.invalid');teacher=self.login('teacher3@it-campus.invalid');admin=self.login('admin4@it-campus.invalid')
  self.req('/api/profile',{'name':'Жаңа Аты-жөні','role':'admin','email':'owner@example.com'},student)
  for endpoint,cookie,key in [('/api/admin/users',admin,'users'),('/api/teacher/students',teacher,'students')]:
   u=next(x for x in self.req(endpoint,{},cookie,'GET')[0][key] if x['id']==self.a);self.assertEqual(u['name'],'Жаңа Аты-жөні');self.assertEqual(u['role'],'student');self.assertEqual(u['email'],'student1@it-campus.invalid')
  self.raises('name',lambda:self.req('/api/profile',{'name':'bad\nname'},student))
 def test_short_reflection_unlocks_only_after_teacher_review(self):
  student=self.login('student1@it-campus.invalid');teacher=self.login('teacher3@it-campus.invalid');data={'lessonId':LESSON,'confidence':'help','difficulty':'practice'}
  self.raises('mission_required',lambda:self.req('/api/submissions',data,student))
  self.finish(student);self.req('/api/submissions',data,student)
  self.assertFalse(self.req('/api/progress',{},student,'GET')[0]['completed'])
  self.req('/api/teacher/review',{'studentId':self.a,'lessonId':LESSON,'approved':True,'feedback':'Келесіде бірге қайталаймыз.'},teacher)
  self.assertEqual(self.req('/api/lesson/q1-02',{},student,'GET')[0]['status'],'ready')
  self.req('/api/submissions',data,student);self.assertTrue(self.req('/api/progress',{},student,'GET')[0]['completed'])
  self.req('/api/submissions',{**data,'confidence':'partial'},student);self.assertFalse(self.req('/api/progress',{},student,'GET')[0]['completed'])
 def test_catalog_all_materials_and_server_missions(self):
  admin=self.login('admin4@it-campus.invalid');student=self.login('student1@it-campus.invalid')
  c=self.req('/api/course',{},admin,'GET')[0];self.assertEqual([len(q['lessons']) for q in c['quarters']],[15,0,8,0])
  for quarter in c['quarters']:
   for meta in quarter['lessons']:
    d=self.req('/api/lesson/'+meta['id'],{},admin,'GET')[0];self.assertTrue(d['resources']);self.assertNotIn('"correct"',json.dumps(d['mission']))
    if meta['kind']=='lesson' and meta['id']!=LESSON:
     aid=self.req('/api/attempts',{'lessonId':d['id'],'missionId':d['missionId']},admin)[0]['attemptId']
     bad=self.req('/api/attempts/'+aid+'/submit',{'passed':True,'score':100,'answers':{}},admin)[0];self.assertFalse(bad['passed'])
     answers={q['id']:q['correct'] for q in BANK[d['id']]};self.assertTrue(self.req('/api/attempts/'+aid+'/submit',{'answers':answers},admin)[0]['passed'])
  self.raises('locked',lambda:self.req('/api/attempts',{'lessonId':'q1-03','missionId':'q1-03-mission'},student))
  self.assertTrue(self.req('/api/lesson/q3-01',{},student,'GET')[0]['legacyGameUrl'])
  self.assertFalse(any(x.get('staffOnly') for x in self.req('/api/lesson/'+LESSON,{},student,'GET')[0]['resources']))
