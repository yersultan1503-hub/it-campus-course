import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeCourse,loadLessonMission,startLessonAttempt,submitLessonAnswers,initialLesson} from '../src/courseMissions.js';
import {accessFor} from '../src/courseAccess.js';
import {serverAutomaticGrade} from '../src/serverGrades.js';
const titles={2:['Функциялар және процедуралар','Параметрлер және аргументтер','Қайтарылатын нәтиже','Декомпозиция және тестілеу','Рекурсия','Жолдарды индекстеу және кесінділер','Жол әдістері','Файлдан оқу','Файлға жазу','Көпіршікті сұрыптау','Таңдау/кірістіру сұрыптауы','Графтың құрылымы','BFS/DFS','Қысқа жол'],4:['Big Data','Реляциялық қор','Бастапқы кілт','Дерек типтері','Біркестелі SQL','Көпкестелі SQL','Формалар','Есептер','SELECT сұраныстары','Web және ДҚ']};
// Approved parent-provided registry fixture, not a claim of official syllabus provenance.
const quarters=[2,4].map(number=>({number,lessons:titles[number].map((title,index)=>({id:`q${number}-${String(index+1).padStart(2,'0')}`,order:index+1,title,kind:'lesson',unlocked:index===0,progress:{}}))}));
test('all 14 Q2 and 10 Q4 approved IDs preserve API titles, lock flags and meaningful hubs',()=>{
 const catalog=mergeCourse({quarters}),snapshot={status:'ready',me:{user:{id:'s',role:'student'}},course:{quarters},expiresAt:Date.now()+45000};
 for(const q of quarters){const lessons=catalog.filter(l=>l.group==='q'+q.number);assert.equal(lessons.length,q.lessons.length);assert.deepEqual(lessons.map(l=>l.title),titles[q.number]);for(const l of lessons){assert.equal(accessFor(snapshot,l.id).allowed,l.id.endsWith('-01'));assert.equal(initialLesson('?lesson='+l.id).group,l.group);}}
 assert.deepEqual(catalog.filter(l=>l.group==='q2').map(l=>l.station),Array.from({length:14},(_,i)=>i));assert.equal(catalog.find(l=>l.id==='q4-09').station,2);
});
test('every approved Q2/Q4 ID has its own server questions, attempt and grade with answer-only evidence',async()=>{
 const catalog=mergeCourse({quarters});for(const entry of catalog.filter(l=>['q2','q4'].includes(l.group))){
 const calls=[],questions=Array.from({length:3},(_,i)=>({id:entry.id+'-q'+i,prompt:entry.title+' '+i,options:[{id:'a',label:'A'},{id:'b',label:'B'}]}));const lesson={...entry,missionId:entry.id+'-mission',mission:{title:entry.title,questions}};
 const fetcher=async(path,options)=>{calls.push({path,options});return {ok:true,json:async()=>path.startsWith('/api/lesson/')?lesson:path==='/api/attempts'?{attemptId:entry.id+'-attempt'}:{passed:false,progress:{automaticGrade:{score:7,maxScore:10,correct:2,total:3,attemptId:entry.id+'-attempt',source:'server'}}}};};
 const loaded=await loadLessonMission(entry.id,fetcher,catalog),attempt=await startLessonAttempt(loaded,fetcher,catalog),answers=Object.fromEntries(questions.map(q=>[q.id,'a']));const result=await submitLessonAnswers(attempt.attemptId,loaded,answers,fetcher,catalog);
 assert.equal(calls[0].path,'/api/lesson/'+entry.id);assert.deepEqual(JSON.parse(calls[1].options.body),{lessonId:entry.id,missionId:lesson.missionId});assert.deepEqual(JSON.parse(calls[2].options.body),{answers});assert.equal(serverAutomaticGrade(result.progress).score,7);assert.equal(result.passed,false);
 }
});
