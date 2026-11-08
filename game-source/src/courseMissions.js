import {api,submitAttempt} from './campusApi.js';
export const Q1_LESSONS=[
 {id:'q1-network-01',number:1,title:'Компьютерлік желілердің жұмыс жасау принциптері',station:0,group:'network'},
 {id:'q1-02',number:2,title:'Желі. Желілік компоненттер',station:1,group:'network'},
 {id:'q1-03',number:3,title:'IP-адрестер',station:2,group:'network'},
 {id:'q1-04',number:4,title:'Домен жүйесі',station:3,group:'network'},
 {id:'q1-05',number:5,title:'Желіде жұмыс істеу кезіндегі қауіпсіздік шаралары',station:4,group:'network'},
 {id:'q1-06',number:6,title:'Ақпаратты қорғау әдістері',station:5,group:'network'},
 {id:'q1-08',number:8,title:'Идентификациялау әдістері',station:6,group:'network'},
 {id:'q1-09',number:9,title:'Санау жүйелерін түрлендіру · 1',station:7,group:'logic'},
 {id:'q1-10',number:10,title:'Санау жүйелерін түрлендіру · 2',station:7,group:'logic'},
 {id:'q1-11',number:11,title:'Логикалық операциялар',station:7,group:'logic'},
 {id:'q1-12',number:12,title:'Ақиқат кестесін құру',station:7,group:'logic'},
 {id:'q1-14',number:14,title:'Компьютердің логикалық негіздері',station:7,group:'logic'}
];
export const Q3_KEYS=['html','table','links','css','media','js','quiz','db'];
export const Q3_LESSONS=Q3_KEYS.map((key,index)=>({id:'q3-'+String(index+1).padStart(2,'0'),number:index+1,title:['HTML құжаты','Кестелер және графика','Сілтемелер','CSS және макет','Аудио және бейне','JavaScript','Интерактивті жоба','Деректер қоры'][index],group:'q3',legacyKey:key}));
export const Q2_LESSONS=[{id:'q2-01',number:1,title:'Функциялар және процедуралар'},{id:'q2-02',number:2,title:'Параметрлер және аргументтер'},{id:'q2-03',number:3,title:'Қайтарылатын нәтиже'},{id:'q2-04',number:4,title:'Декомпозиция және тестілеу'},{id:'q2-05',number:5,title:'Рекурсия'}].map((l,station)=>({...l,station,quarter:2,group:'q2'}));
export const COURSE_LESSONS=[...Q1_LESSONS,...Q2_LESSONS,...Q3_LESSONS];
export function legacyCampusUrl(id,serverUrl){const lesson=Q3_LESSONS.find(l=>l.id===id);if(!lesson)return null;if(serverUrl){try{const url=new URL(serverUrl,'https://campus.invalid');if(url.origin==='https://campus.invalid'&&url.pathname==='/legacy-q3/game/'&&url.searchParams.get('lesson')===lesson.legacyKey)return url.pathname+url.search;}catch{}}return '/legacy-q3/game/?lesson='+lesson.legacyKey;}
export const GROUPS=[{id:'network',label:'Желілер және қауіпсіздік'},{id:'logic',label:'Санау жүйелері және логика'},{id:'q2',label:'2-тоқсан · Сервер тізіліміндегі сабақтар'},{id:'q3',label:'3-тоқсан · Бөлек кампус'}];
export const courseLesson=(id,catalog=COURSE_LESSONS)=>catalog.find(lesson=>lesson.id===id);
export function initialLesson(search){const id=new URLSearchParams(search).get('lesson');return courseLesson(id)||(/^q2-[a-z0-9-]+$/.test(id||'')?{id,title:'Екінші тоқсан',group:'q2',quarter:2,pending:true}:Q1_LESSONS[0]);}
export const lessonReturn=id=>'/?lesson='+encodeURIComponent(id)+'#result';
export function mergeCourse(catalog){
 const lessons=catalog?.quarters?.flatMap(q=>q.lessons||[])||catalog?.lessons||[];
 const known=COURSE_LESSONS.map(local=>{const server=lessons.find(l=>l.id===local.id);return {...local,...server,id:local.id,station:local.station,group:local.group};});
 const q2=(catalog?.quarters?.find(q=>Number(q.number)===2)?.lessons||[]).filter(l=>/^q2-[a-z0-9-]+$/.test(l.id||'')&&!known.some(k=>k.id===l.id)&&l.kind==='lesson'&&typeof l.title==='string').map(l=>({...l,number:l.order,quarter:2,group:'q2',registered:true}));
 return [...known,...q2];
}
export function validateMission(lesson,catalog=COURSE_LESSONS){
 if(!courseLesson(lesson?.id,catalog)||lesson.id==='q1-network-01'||/assessment|bjb|tjb/i.test(lesson.kind||''))throw new Error('Бұл сабаққа ойын миссиясы берілмеген.');
 const mission=lesson.mission;
 if(!lesson.missionId||!mission?.questions?.length)throw new Error('Серверде миссияның сұрақтары әлі дайын емес.');
 const ids=new Set();
 for(const q of mission.questions){if(!q.id||ids.has(q.id)||!q.prompt||!Array.isArray(q.options)||q.options.length<2)throw new Error('Миссия сұрақтарының пішімі дұрыс емес.');ids.add(q.id);const options=new Set();for(const option of q.options){if(!option.id||options.has(option.id)||typeof option.label!=='string')throw new Error('Жауап нұсқаларының пішімі дұрыс емес.');options.add(option.id);}}
 return lesson;
}
export async function loadLessonMission(id,fetcher=fetch,catalog=COURSE_LESSONS){if(!courseLesson(id,catalog))throw new Error('Бұл сабақ ойын тізіміне кірмейді.');const data=await api('/api/lesson/'+encodeURIComponent(id),undefined,fetcher);if(data.id!==id)throw new Error('Сервер басқа сабақтың дерегін қайтарды.');return validateMission(data,catalog);}
export async function startLessonAttempt(lesson,fetcher=fetch,catalog=COURSE_LESSONS){validateMission(lesson,catalog);return api('/api/attempts',{lessonId:lesson.id,missionId:lesson.missionId},fetcher);}
export function answerEvidence(lesson,answers,catalog=COURSE_LESSONS){validateMission(lesson,catalog);const entries=lesson.mission.questions.map(q=>{const value=answers[q.id];if(!q.options.some(o=>o.id===value))throw new Error('Әр сұраққа жауап таңдаңыз.');return [q.id,value];});return {answers:Object.fromEntries(entries)};}
export async function submitLessonAnswers(attemptId,lesson,answers,fetcher=fetch,catalog=COURSE_LESSONS){return submitAttempt(attemptId,answerEvidence(lesson,answers,catalog),fetcher);}
