import test from 'node:test';
import assert from 'node:assert/strict';
import {accessFor,fetchCourseAccess} from '../src/courseAccess.js';
import {legacyPolicy,validLegacySelection} from '../src/legacyAccess.js';
function snapshot(role='student',all=false){return {status:'ready',checkedAt:Date.now(),expiresAt:Date.now()+45000,me:{user:{id:'test-user',role}},course:{quarters:[{number:3,lessons:Array.from({length:8},(_,i)=>({id:'q3-'+String(i+1).padStart(2,'0'),kind:'lesson',unlocked:all||i===0,progress:{completed:all}}))}]}};}
test('server flags alone govern entry; staff role, local XP, completion fields and absent flags do not grant it',()=>{
 const s=snapshot();assert.equal(accessFor(s,'q3-01').allowed,true);assert.equal(accessFor(s,'q3-08').allowed,false);s.me.user.role='admin';assert.equal(accessFor(s,'q3-08').allowed,false);s.course.quarters[0].lessons[7].progress={completed:true,missionPassed:true,xp:999};assert.equal(accessFor(s,'q3-08').allowed,false);assert.equal(accessFor(snapshot('teacher',true),'q3-08').allowed,true);assert.equal(accessFor(snapshot('admin',true),'q3-08').allowed,true);
 s.course.quarters[0].lessons[7].unlocked=undefined;assert.equal(accessFor(s,'q3-08').allowed,false);assert.equal(accessFor(s,'q3-09').allowed,false);
});
test('loading, expired, malformed, logged-out and revoked snapshots fail closed',()=>{
 const s=snapshot();assert.equal(accessFor(s,'q3-01',s.expiresAt+1).allowed,false);assert.equal(accessFor({status:'loading'},'q3-01').allowed,false);s.me=null;assert.equal(accessFor(s,'q3-01').allowed,false);assert.equal(accessFor({status:'error',error:{status:401}},'q3-01').code,'login_required');
});
test('access fetch uses credentialed GETs and an endpoint failure clears permission',async()=>{
 const s=snapshot('teacher',true),calls=[];const good=async(path,options)=>{calls.push(options);return {ok:true,json:async()=>path==='/api/me'?s.me:s.course};};
 const ready=await fetchCourseAccess(good);assert.equal(accessFor(ready,'q3-08').allowed,true);assert.ok(calls.every(c=>c.credentials==='same-origin'&&c.method===undefined));
 const denied=await fetchCourseAccess(async path=>path==='/api/me'?{ok:false,status:401,json:async()=>({code:'login_required',error:'Сессия аяқталды'})}:{ok:true,json:async()=>s.course});assert.equal(accessFor(denied,'q3-01').allowed,false);
 const bad=await fetchCourseAccess(async()=>({ok:true,json:async()=>({})}));assert.equal(bad.status,'error');
});
test('iframe selection messages are navigation only and cannot supply permissions or XP',()=>{
 const s=snapshot(),source={},frame={contentWindow:source},origin='https://campus.test';const event={origin,source,data:{type:'campus:legacy-selection',lessonId:'q3-01'}};
 assert.equal(validLegacySelection(event,frame,origin,s),true);assert.equal(validLegacySelection({...event,origin:'https://evil.test'},frame,origin,s),false);assert.equal(validLegacySelection({...event,source:{}},frame,origin,s),false);assert.equal(validLegacySelection({...event,data:{...event.data,lessonId:'q3-08',passed:true,xp:999,allowed:true}},frame,origin,s),false);assert.equal(validLegacySelection({...event,data:{type:'passed',lessonId:'q3-01'}},frame,origin,s),false);assert.deepEqual(legacyPolicy(s).allowed,['html']);
});
