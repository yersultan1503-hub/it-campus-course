import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {attachLegacyAccess,LEGACY_KEYS,legacyPolicy} from '../src/legacyAccess.js';
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
function fixture(){return new JSDOM('<html><head></head><body><div class="station-labels">'+LEGACY_KEYS.map((key,i)=>`<button id="station-label-${i}" class="station-label ${i===0?'selected':''}">${key}</button>`).join('')+'</div><div class="area-list">'+LEGACY_KEYS.map(key=>`<button>${key}</button>`).join('')+'</div><button class="quest-button">Enter</button><button class="mode-card">Lab</button></body></html>',{url:'https://campus.test/legacy-q3/game/?lesson=html'});}
const policy=(keys,staff=false)=>({allowed:keys,staff,checkedAt:Date.now(),expiresAt:Date.now()+45000});
test('student inner station/map/mode buttons ignore seeded localStorage XP and React re-enables',async()=>{
 const dom=fixture(),doc=dom.window.document;dom.window.localStorage.setItem('it-campus-v1',JSON.stringify({version:1,missions:Object.fromEntries(LEGACY_KEYS.map(k=>[k,{lab:{},quiz:{},debug:{}}]))}));const bridge=attachLegacyAccess(doc,policy(['html']));await flush();
 assert.equal([...doc.querySelectorAll('.station-label')].filter(b=>b.disabled).length,7);assert.equal([...doc.querySelectorAll('.area-list>button')].filter(b=>b.disabled).length,7);assert.equal(doc.querySelector('.quest-button').disabled,false);
 doc.querySelector('#station-label-7').disabled=false;await flush();assert.equal(doc.querySelector('#station-label-7').disabled,true);
 const walking=new dom.window.KeyboardEvent('keydown',{key:'w',code:'KeyW',bubbles:true,cancelable:true});doc.body.dispatchEvent(walking);assert.equal(walking.defaultPrevented,false);
 const e=new dom.window.KeyboardEvent('keydown',{key:'e',code:'KeyE',bubbles:true,cancelable:true});doc.body.dispatchEvent(e);assert.equal(e.defaultPrevented,true);
 bridge.dispose();dom.window.close();
});
test('3D building selection cannot bypass lock: internal curtain and mode disabled until return',async()=>{
 const dom=fixture(),doc=dom.window.document,bridge=attachLegacyAccess(doc,policy(['html']));doc.querySelector('#station-label-0').classList.remove('selected');doc.querySelector('#station-label-7').classList.add('selected');await flush();
 assert.equal(doc.querySelector('.campus-legacy-curtain').hidden,false);assert.equal(doc.querySelector('.mode-card').disabled,true);const click=new dom.window.MouseEvent('click',{bubbles:true,cancelable:true});doc.querySelector('.mode-card').dispatchEvent(click);assert.equal(click.defaultPrevented,true);assert.equal(bridge.canOpen('db'),false);
 doc.querySelector('#station-label-7').classList.remove('selected');doc.querySelector('#station-label-0').classList.add('selected');await flush();assert.equal(doc.querySelector('.campus-legacy-curtain').hidden,true);assert.equal(doc.querySelector('.mode-card').disabled,false);bridge.dispose();dom.window.close();
});
test('staff all open; revocation closes all; native E only allowed when the source entry hook is present',async()=>{
 const dom=fixture(),doc=dom.window.document,bridge=attachLegacyAccess(doc,policy(LEGACY_KEYS,true));assert.ok([...doc.querySelectorAll('.station-label')].every(b=>!b.disabled));
 bridge.update({...policy(['html']),checkedAt:Date.now()+1});dom.window.__campusLegacyEntryGuarded=true;const e=new dom.window.KeyboardEvent('keydown',{key:'e',code:'KeyE',bubbles:true,cancelable:true});doc.body.dispatchEvent(e);assert.equal(e.defaultPrevented,false);assert.equal(bridge.canOpen('table'),false);
 bridge.update({allowed:[],checkedAt:Date.now()+2,expiresAt:0});await flush();assert.ok([...doc.querySelectorAll('.station-label')].every(b=>b.disabled));assert.equal(doc.querySelector('.campus-legacy-curtain').hidden,false);assert.equal(doc.querySelector('.campus-legacy-curtain a').target,'_top');bridge.dispose();dom.window.close();
});
