import unittest
import test_server as support
from server import LESSON,MISSION,Store
class GradeTests(unittest.TestCase):
 setUp=support.PilotTests.setUp
 tearDown=support.PilotTests.tearDown
 req=support.PilotTests.req
 login=support.PilotTests.login
 raises=support.PilotTests.raises
 def test_grade_failed_practice_without_reflection_and_keep_unlock_separate(self):
  s=self.login('student1@it-campus.invalid');t=self.login('teacher3@it-campus.invalid')
  body={'studentId':self.a,'lessonId':LESSON,'score':4,'feedback':'Repeat wiring'}
  self.raises('not_submitted',lambda:self.req('/api/teacher/grade',body,t))
  attempt=self.req('/api/attempts',{'lessonId':LESSON,'missionId':MISSION},s)[0]['attemptId']
  self.req('/api/attempts/'+attempt+'/submit',{'fault':'cable'},s)
  self.req('/api/teacher/grade',body,t)
  p=self.req('/api/progress',{},s,'GET')[0];self.assertEqual(p['grade']['score'],4);self.assertFalse(p['nextUnlocked'])
  practice=self.req('/api/teacher/students',{},t,'GET')[0]['students'][0]['practices'][0]
  self.assertEqual(practice['submittedCount'],1);self.assertEqual(practice['latestAttempt']['evidence']['fault'],'cable')
  self.req('/api/teacher/grade',{**body,'score':7},t)
  self.assertEqual(Store(self.s.path).request('GET','/api/progress',{},s)[0]['grade']['score'],7)
 def test_grade_scope_validation_and_student_denial(self):
  s=self.login('student1@it-campus.invalid');t=self.login('teacher3@it-campus.invalid');a=self.login('admin4@it-campus.invalid')
  body={'studentId':self.a,'lessonId':LESSON,'score':10}
  self.raises('forbidden',lambda:self.req('/api/teacher/grade',body,s))
  self.raises('forbidden',lambda:self.req('/api/teacher/grade',{**body,'studentId':self.b},t))
  for score in [-1,11,True,1.5,'5',None]:self.raises('score',lambda:self.req('/api/teacher/grade',{**body,'score':score},a))
 def test_q3_student_level_sequence_and_staff_access(self):
  s=self.login('student1@it-campus.invalid');a=self.login('admin4@it-campus.invalid')
  self.assertEqual([x['unlocked'] for x in self.req('/api/course',{},s,'GET')[0]['quarters'][2]['lessons']],[True]+[False]*7)
  self.raises('locked',lambda:self.req('/api/lesson/q3-03',{},s,'GET'))
  self.assertEqual(self.req('/api/lesson/q3-03',{},a,'GET')[0]['status'],'ready')
  from server import Handler
  from types import SimpleNamespace
  h=object.__new__(Handler);h.server=SimpleNamespace(store=self.s);h.json_response=lambda *args:None
  h.headers={'Cookie':s};h.path='/legacy-q3/game/?lesson=links';self.assertFalse(h.resource_access())
  h.path='/legacy-q3/game/?lesson=html';self.assertTrue(h.resource_access())
  h.headers={'Cookie':a};h.path='/legacy-q3/game/?lesson=links';self.assertTrue(h.resource_access())
