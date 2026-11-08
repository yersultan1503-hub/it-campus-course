import test from 'node:test';
import assert from 'node:assert/strict';
import {api,evidence,createAttempt,submitAttempt} from '../src/campusApi.js';
test('same-origin API carries exact evidence and CSRF header, never score/pass',async()=>{
 const calls=[];const mock=async(path,options)=>{calls.push({path,options});return {ok:true,json:async()=>path==='/api/attempts'?{attemptId:'a/1'}:{passed:false,criteria:[],progress:{missionPassed:false}}};};
 await api('/api/me',undefined,mock);const attempt=await createAttempt(mock);
 const roles={switch:'local',router:'networks',node:'endpoint'},links=[['pc1','switch'],['pc2','switch'],['switch','router']];
 const body=evidence(roles,links,'cable');const result=await submitAttempt(attempt.attemptId,body,mock);
 assert.equal(result.passed,false);assert.equal(calls[0].options.credentials,'same-origin');assert.equal(calls[0].options.method,undefined);
 assert.deepEqual(JSON.parse(calls[1].options.body),{lessonId:'q1-network-01',missionId:'network-connect-01'});
 assert.equal(calls[2].path,'/api/attempts/a%2F1/submit');assert.equal(calls[2].options.headers['X-Campus-Request'],'1');
 assert.deepEqual(JSON.parse(calls[2].options.body),{roles,links,fault:'cable'});assert.equal('score' in body,false);assert.equal('passed' in body,false);
 roles.switch='changed';links[0][0]='changed';assert.equal(body.roles.switch,'local');assert.equal(body.links[0][0],'pc1');
});
test('server errors never become success',async()=>{
 for(const status of [401,403,422,500])await assert.rejects(api('/api/me',undefined,async()=>({ok:false,status,json:async()=>({error:'Қайта кіріңіз',code:'unauthorized'})})),e=>e.status===status&&e.code==='unauthorized');
});
test('network and malformed responses preserve failure',async()=>{
 await assert.rejects(submitAttempt('a',{},async()=>{throw new Error('offline');}),/offline/);
 await assert.rejects(api('/api/me',undefined,async()=>({ok:true,json:async()=>{throw new Error('bad');}})),/Сервер жауабы/);
});
