import test from 'node:test';
import assert from 'node:assert/strict';
import {Q1_LESSONS,Q3_LESSONS,Q3_KEYS,initialLesson,mergeCourse,loadLessonMission,startLessonAttempt,submitLessonAnswers,answerEvidence,legacyCampusUrl} from '../src/courseMissions.js';
const lesson=id=>({id,title:'Тақырып',kind:'instruction',missionId:'server-mission-'+id,mission:{title:'Зертхана',prompt:'Орында',questions:[{id:'a',prompt:'Қайсысы?',options:[{id:'x',label:'Бір'},{id:'y',label:'Екі'}]}]}});
test('all 12 Q1 instructional lessons are routed; assessments never acquire a game attempt',async()=>{
 assert.equal(Q1_LESSONS.length,12);assert.equal(new Set(Q1_LESSONS.map(l=>l.id)).size,12);assert.equal(Q3_LESSONS.length,8);
 for(const id of ['q1-07','q1-13','q1-15','q4-01']){await assert.rejects(loadLessonMission(id,()=>{throw new Error('fetch must not run');}),/ойын тізіміне/);}
 assert.equal(initialLesson('?lesson=q1-14').station,7);assert.equal(initialLesson('?lesson=q3-08').id,'q3-08');assert.equal(initialLesson('?lesson=q1-07').id,'q1-network-01');
});
test('every generic lesson fetches its own mission id and submits answers only; server pass is authoritative',async()=>{
 for(const {id} of [...Q1_LESSONS.slice(1),...Q3_LESSONS]){
  const calls=[],mock=async(path,options)=>{calls.push({path,options});return {ok:true,json:async()=>path.startsWith('/api/lesson/')?lesson(id):path==='/api/attempts'?{attemptId:'attempt-1'}:{passed:false,criteria:[{id:'a',passed:false,feedback:'Қайта көр'}],progress:{completed:false}}};};
  const data=await loadLessonMission(id,mock),attempt=await startLessonAttempt(data,mock),response=await submitLessonAnswers(attempt.attemptId,data,{a:'y',score:100,passed:true},mock);
  assert.equal(calls[0].path,'/api/lesson/'+id);assert.equal(calls[0].options.credentials,'same-origin');assert.deepEqual(JSON.parse(calls[1].options.body),{lessonId:id,missionId:'server-mission-'+id});assert.deepEqual(JSON.parse(calls[2].options.body),{answers:{a:'y'}});assert.equal(calls[2].options.headers['X-Campus-Request'],'1');assert.equal(response.passed,false);
 }
});
test('server locks, authentication and malformed missions cannot become playable/success',async()=>{
 for(const status of [401,403])await assert.rejects(loadLessonMission('q1-02',async()=>({ok:false,status,json:async()=>({code:'locked',error:'Жабық'})})),e=>e.status===status);
 await assert.rejects(loadLessonMission('q1-02',async()=>({ok:true,json:async()=>lesson('q1-03')})),/басқа сабақ/);
 await assert.rejects(loadLessonMission('q1-02',async()=>({ok:true,json:async()=>({...lesson('q1-02'),mission:{questions:[]}})})),/әлі дайын емес/);
 assert.throws(()=>answerEvidence(lesson('q1-02'),{a:'not-an-option'}),/Әр сұраққа/);
 await assert.rejects(startLessonAttempt({...lesson('q1-02'),kind:'assessment'}),/берілмеген/);
});
test('registry titles update without importing assessments or changing spatial grouping',()=>{
 const merged=mergeCourse({quarters:[{number:1,lessons:[{id:'q1-14',title:'Сервер атауы',locked:true,station:0},{id:'q1-15',title:'ТЖБ'}]}]});assert.equal(merged.find(l=>l.id==='q1-14').title,'Сервер атауы');assert.equal(merged.find(l=>l.id==='q1-14').station,7);assert.equal(merged.find(l=>l.id==='q1-14').locked,true);assert.ok(!merged.some(l=>l.id==='q1-15'));
});
test('Q3 uses eight distinct legacy links, never an arbitrary iframe URL or Q1 city',()=>{
 Q3_LESSONS.forEach((l,i)=>assert.equal(legacyCampusUrl(l.id),'/legacy-q3/game/?lesson='+Q3_KEYS[i]));assert.equal(legacyCampusUrl('q1-02'),null);assert.equal(legacyCampusUrl('q3-01','https://untrusted.example/'),'/'+'legacy-q3/game/?lesson=html');
});
