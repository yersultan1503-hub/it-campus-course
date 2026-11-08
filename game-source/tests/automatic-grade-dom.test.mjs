import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('vite/package.json'))('esbuild');
test('server automatic grade renders even when practice is not passed and never claims an unlock',async()=>{
 await build({entryPoints:['src/GenericMission.jsx'],outfile:'work/grade-qa.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',logLevel:'silent'});
 const dom=new JSDOM('<div id="root"></div>',{url:'https://campus.test/game/?lesson=q4-08'}),keys=['window','document','navigator','HTMLElement','fetch','IS_REACT_ACT_ENVIRONMENT'],saved=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const grade={score:7,maxScore:10,correct:2,total:3,attemptId:'a',source:'server'},lesson={id:'q4-08',kind:'lesson',title:'Server lesson',missionId:'m',mission:{questions:[{id:'q',prompt:'Choose',options:[{id:'a',label:'A'},{id:'b',label:'B'}]}]}};
 const values={window:dom.window,document:dom.window.document,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,fetch:async(path,options)=>({ok:true,json:async()=>path==='/api/me'?{user:{id:'s',role:'student'}}:path.startsWith('/api/lesson/')?lesson:path==='/api/attempts'?{attemptId:'a'}:{passed:false,criteria:[],progress:{automaticGrade:grade}}})};
 for(const [k,value] of Object.entries(values))Object.defineProperty(globalThis,k,{configurable:true,writable:true,value});
 const {createElement,act}=await import('react'),{createRoot}=await import('react-dom/client'),{GenericMission}=await import('../work/grade-qa.mjs');const root=createRoot(document.querySelector('#root'));let passed=0,refresh=0;const settle=()=>new Promise(r=>setTimeout(r,10));
 try{
  await act(async()=>{root.render(createElement(GenericMission,{lessonId:lesson.id,catalog:[lesson],onPassed:()=>passed++,onResult:()=>refresh++}));await settle();});
  assert.match(document.body.textContent,/ТӨРТІНШІ ТОҚСАН/);assert.doesNotMatch(document.body.textContent,/БІРІНШІ ТОҚСАН/);
  await act(async()=>{[...document.querySelectorAll('button')].find(b=>b.textContent==='Миссияны бастау').click();await settle();});
  await act(async()=>{document.querySelector('input[value="a"]').click();});
  await act(async()=>{document.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await settle();});
  assert.match(document.body.textContent,/Автоматты баға: 7\/10/);assert.match(document.body.textContent,/2\/3 дұрыс жауап/);assert.match(document.body.textContent,/Практиканы аяқтау.*бөлек тексеріледі/);assert.equal(passed,0);assert.equal(refresh,1);assert.equal(document.querySelector('fieldset.mission-questions').disabled,false);
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [k,d] of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});
