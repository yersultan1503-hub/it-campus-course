import {fetchCourseAccess} from './courseAccess.js';
import {attachLegacyAccess,legacyPolicy} from './legacyAccess.js';
const controller=window.__campusLegacyAccess||attachLegacyAccess(document,{allowed:[]});window.__campusLegacyAccess=controller;
let active=true,request=0;
async function refresh(){const version=++request;const snapshot=await fetchCourseAccess();if(active&&version===request)controller.update(legacyPolicy(snapshot));}
refresh();const timer=setInterval(refresh,20000);const visible=()=>{if(!document.hidden)refresh();};window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
window.addEventListener('pagehide',()=>{active=false;clearInterval(timer);controller.dispose();},{once:true});
