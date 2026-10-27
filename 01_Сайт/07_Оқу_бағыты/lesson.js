import {gameNames,missionSummary,reflectionReady,completionCount} from './lesson-progress.mjs';
const id=document.body.dataset.game,num=document.body.dataset.lesson,key='it-course-lesson-'+num+'-v2';
const form=document.querySelector('#reflection-form'),status=document.querySelector('#save-status');
let state={},storageOK=true;
function read(k){try{return localStorage.getItem(k);}catch{storageOK=false;return null;}}
try{const saved=JSON.parse(read(key)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))state=saved;}catch{}
for(const el of form.elements)if(el.name&&typeof state[el.name]==='string')el.value=state[el.name];
for(const c of document.querySelectorAll('[data-done]')){c.checked=state[c.dataset.done]===true;c.addEventListener('change',()=>{state[c.dataset.done]=c.checked;save();});}
function save(){try{localStorage.setItem(key,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}status.textContent=storageOK?'Жауаптар осы браузерде сақталды.':'Браузерде сақтау қолжетімсіз. Жауаптарыңды TXT файлына жүктеп ал.';refresh();}
form.addEventListener('input',()=>{for(const el of form.elements)if(el.name)state[el.name]=el.value;save();});
function refresh(){
 const m=missionSummary(read('it-campus-v1'),id),count=completionCount(state,m);
 document.querySelector('#journey-count').textContent=count+' / 5 қадам';document.querySelector('#journey-progress').value=count;
 document.querySelectorAll('[data-step]').forEach(el=>{const step=el.dataset.step,done=step==='mission'?m.complete:step==='reflection'?reflectionReady(state):state[step]===true;el.classList.toggle('is-done',done);el.setAttribute('aria-label',el.textContent+(done?' — орындалды':''));});
 const out=document.querySelector('#mission-status');out.classList.toggle('complete',m.complete);
 out.textContent=(m.complete?'Миссия орындалды. ':'Миссия әлі аяқталған жоқ. ')+(m.lab?'Зертхана дайын. ':'Зертхана: орындалмаған. ')+`Қосымша ойындар: ${Math.min(m.extras,2)} / 2.`;
 document.querySelector('#export-code').hidden=!artifact();
}
function artifact(){try{const p=JSON.parse(read('it-campus-v1')||'null');return p?.version===1&&typeof p.artifacts?.[id]?.code==='string'?p.artifacts[id].code:null;}catch{return null;}}
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
document.querySelector('#export-reflection').addEventListener('click',()=>{
 if(!form.reportValidity())return;const m=missionSummary(read('it-campus-v1'),id);
 const text=[document.title,'Оқушы: '+(state.nickname||'көрсетілмеген'),'Күні: '+new Date().toLocaleString('kk-KZ'),'Ойын нәтижесі: '+(m.complete?'зертхана және кемінде екі ойын орындалды':'миссия толық аяқталмаған'),'Орындалған ойындар: '+(m.names.map(k=>gameNames[k]).join(', ')||'жоқ'),'Бұл — осы браузерде сақталған оқу есебі. Мұғалім тексереді, ресми баға емес.','Бүгін не үйрендім?\n'+state.learned,'Қай жерде қиналдым және қалай түзеттім?\n'+state.challenge,'Келесі жолы нені жақсартамын?\n'+state.next].join('\n\n');
 download(text,num+'_рефлексия.txt','text/plain;charset=utf-8');status.textContent='Файл жүктеуге берілді. Classroom-ға өзің тірке.';
});
document.querySelector('#export-code').addEventListener('click',()=>{const code=artifact();if(code)download(code,num+'_ойындағы_жұмыс.html','text/html;charset=utf-8');});
document.querySelector('video')?.addEventListener('ended',()=>{state.video=true;document.querySelector('[data-done="video"]').checked=true;save();});
addEventListener('pageshow',refresh);addEventListener('focus',refresh);addEventListener('storage',e=>{if(e.key==='it-campus-v1')refresh();});
if(!storageOK)status.textContent='Браузерде сақтау қолжетімсіз. Жауаптарды жүктеп ал.';
refresh();
const deck=document.querySelector('.slide-deck');
if(deck){
 const total=Number(deck.dataset.total),texts=JSON.parse(document.querySelector('#slide-texts').textContent);let slide=1;
 const show=()=>{const img=document.querySelector('#slide-image');img.src='../media/slides/'+num+'/'+String(slide).padStart(2,'0')+'.jpg';img.alt=slide+' слайд';document.querySelector('#slide-count').textContent=slide+' / '+total;document.querySelector('#slide-prev').disabled=slide===1;document.querySelector('#slide-next').disabled=slide===total;document.querySelector('#slide-text').textContent=texts[slide-1]||'Мәтін PDF нұсқасында қолжетімді.';};
 document.querySelector('#slide-prev').addEventListener('click',()=>{slide=Math.max(1,slide-1);show();});document.querySelector('#slide-next').addEventListener('click',()=>{slide=Math.min(total,slide+1);show();});
 deck.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();slide=Math.max(1,Math.min(total,slide+(e.key==='ArrowRight'?1:-1)));show();}});show();
}
