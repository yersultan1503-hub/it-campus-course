import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {build,transform}=createRequire(require.resolve('vite/package.json'))('esbuild');
import {readFile,mkdir} from 'node:fs/promises';
import {COURSE_LESSONS} from '../src/courseMissions.js';
test('actual React catalogue disables student locked levels and direct locked Q3 iframe, while staff sees all open',async()=>{
 await mkdir('work',{recursive:true});await build({entryPoints:['src/App.jsx'],outfile:'work/app-access-qa.mjs',bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',logLevel:'silent'});
 const dom=new JSDOM('<html><body><div id="test-root"></div></body></html>',{url:'https://campus.test/game/?lesson=q3-08',pretendToBeVisual:true});
 const saved=new Map();for(const key of ['window','document','location','history','localStorage','navigator','HTMLElement','addEventListener','removeEventListener','matchMedia','fetch','IS_REACT_ACT_ENVIRONMENT'])saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
 let role='student';const course=()=>({quarters:[1,2,3,4].map(number=>({number,lessons:[...COURSE_LESSONS.filter(l=>Number(l.id[1])===number),...(number===2?Array.from({length:3},(_,i)=>({id:'q2-0'+(i+6),number:i+6,title:'Server expanded Q2 '+i})):number===4?Array.from({length:2},(_,i)=>({id:'q4-0'+(i+1),number:i+1,title:'Server Q4 '+i})):[])].map(l=>({...l,kind:'lesson',unlocked:role!=='student'||l.number===1,progress:{missionPassed:false}}))}))});
 const values={window:dom.window,document:dom.window.document,location:dom.window.location,history:dom.window.history,localStorage:dom.window.localStorage,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,addEventListener:dom.window.addEventListener.bind(dom.window),removeEventListener:dom.window.removeEventListener.bind(dom.window),matchMedia:()=>({matches:false}),IS_REACT_ACT_ENVIRONMENT:true,fetch:async path=>({ok:true,json:async()=>path==='/api/me'?{user:{id:'fixture-user',role},progress:{}}:course()})};
 for(const [key,value] of Object.entries(values))Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 dom.window.localStorage.setItem('it-campus-v1',JSON.stringify({version:1,missions:{db:{lab:{},quiz:{},debug:{}}},xp:99999,role:'admin'}));
 const {createElement,act}=await import('react'),{createRoot}=await import('react-dom/client'),{App}=await import('../work/app-access-qa.mjs');const root=createRoot(dom.window.document.querySelector('#test-root'));
 const settle=()=>new Promise(resolve=>setTimeout(resolve,25));
 try{
  await act(async()=>{root.render(createElement(App));await settle();});
  assert.equal(dom.window.document.querySelector('iframe'),null,'locked deep link must not load legacy campus');
  await act(async()=>{[...dom.window.document.querySelectorAll('button')].find(b=>b.textContent==='Сабақтар').click();await settle();});
  let buttons=[...dom.window.document.querySelectorAll('.catalog-lesson')];assert.equal(buttons.length,30);assert.equal(buttons.filter(b=>b.disabled).length,26);assert.equal(buttons.filter(b=>!b.disabled).length,4);assert.match(dom.window.document.body.textContent,/4-тоқсан · Деректер ауданы/);assert.match(dom.window.document.body.textContent,/Server expanded Q2/);assert.match(dom.window.document.body.textContent,/Server Q4/);
  role='teacher';await act(async()=>{dom.window.dispatchEvent(new dom.window.Event('focus'));await settle();});buttons=[...dom.window.document.querySelectorAll('.catalog-lesson')];assert.ok(buttons.every(b=>!b.disabled));
 }finally{await act(async()=>root.unmount());dom.window.close();for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
test('legacy source patch parses as JSX and guards actual zone/mode entry functions',async()=>{
 const source=await readFile('integration/legacy-q3-App.guarded.jsx','utf8');const result=await transform(source,{loader:'jsx',logLevel:'silent'});assert.equal(result.warnings.length,0);assert.match(source,/function openZone\(i=selected\)\{if\(!courseCanOpen\(i\)\)/);assert.match(source,/function beginMode\(id\)\{if\(!courseCanOpen\(selected\)\)/);assert.match(source,/__campusLegacyEntryGuarded=true/);
});
