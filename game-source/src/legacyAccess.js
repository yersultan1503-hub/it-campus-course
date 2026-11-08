import {accessFor} from './courseAccess.js';
export const LEGACY_KEYS=['html','table','links','css','media','js','quiz','db'];
export const legacyLessonId=key=>{const i=LEGACY_KEYS.indexOf(key);return i<0?null:'q3-'+String(i+1).padStart(2,'0');};
export function legacyPolicy(snapshot,now=Date.now()){
 return {checkedAt:snapshot?.checkedAt||0,expiresAt:snapshot?.expiresAt||0,allowed:LEGACY_KEYS.filter(key=>accessFor(snapshot,legacyLessonId(key),now).allowed),staff:snapshot?.status==='ready'&&['teacher','admin'].includes(snapshot.me?.user?.role)};
}
export function validLegacySelection(event,frame,origin,snapshot){
 return event.origin===origin&&event.source===frame?.contentWindow&&event.data?.type==='campus:legacy-selection'&&typeof event.data.lessonId==='string'&&LEGACY_KEYS.some(key=>legacyLessonId(key)===event.data.lessonId)&&accessFor(snapshot,event.data.lessonId).allowed;
}
// Same-origin UI adapter. Grade/unlock enforcement remains on the server API.
export function attachLegacyAccess(doc,initialPolicy={allowed:[]}){
 const win=doc.defaultView;let policy=initialPolicy,disposed=false,lastSelection=null;
 const originalLabels=new WeakMap(),style=doc.createElement('style');
 style.textContent='.campus-legacy-curtain{position:fixed;inset:0;z-index:2147483000;background:#102a3ef5;color:#edf4f8;display:grid;place-content:center;padding:28px;text-align:center;font:16px/1.7 Arial}.campus-legacy-curtain button{padding:14px 20px;border:1px solid #a9c6d6;border-radius:10px;background:#e7be76;color:#153247;font-weight:700}.station-label:disabled,.area-list>button:disabled,.quest-button:disabled,.mode-card:disabled{opacity:.5!important;filter:grayscale(.7);cursor:not-allowed!important}.campus-legacy-note{position:fixed;bottom:78px;left:18px;z-index:15;padding:8px 12px;max-width:calc(100vw - 36px);border-radius:9px;background:#143449e8;color:#e5eff5;font:11px/1.5 Arial;pointer-events:none}';doc.head.append(style);
 const curtain=doc.createElement('section');curtain.className='campus-legacy-curtain';curtain.setAttribute('role','status');
 const title=doc.createElement('h2');title.textContent='Бұл зертхана әлі жабық';const message=doc.createElement('p');message.textContent='Сабақтарды сервердегі рұқсат ретімен орындаңыз.';
 const back=doc.createElement('button');back.textContent='Ашық зертханаға оралу';const courseLink=doc.createElement('a');courseLink.href='/?lesson='+legacyLessonId(new URL(win.location.href).searchParams.get('lesson')||'html');courseLink.target='_top';courseLink.textContent='Сабаққа және кіру бетіне оралу';courseLink.style.color='#f2cb88';curtain.append(title,message,back,courseLink);doc.body.append(curtain);
 const note=doc.createElement('div');note.className='campus-legacy-note';note.textContent='Сабақтарды сервер ашады. Зертханаға экрандағы батырмамен кіріңіз. XP — жаттығу нәтижесі.';doc.body.append(note);
 const allowedKeys=()=>Date.now()<=(policy.expiresAt||0)?policy.allowed:[];
 const selectedKey=()=>{const selected=doc.querySelector('.station-label.selected');const index=Number(selected?.id?.replace('station-label-',''));return Number.isInteger(index)?LEGACY_KEYS[index]:null;};
 const setDisabled=(node,disabled)=>{if(node.disabled!==disabled)node.disabled=disabled;if(node.getAttribute('aria-disabled')!==String(disabled))node.setAttribute('aria-disabled',String(disabled));};
 function apply(){if(disposed)return;
  const labels=[...doc.querySelectorAll('.station-label')];labels.forEach((node,index)=>{const key=LEGACY_KEYS[index],allowed=allowedKeys().includes(key);setDisabled(node,!allowed);if(!originalLabels.has(node))originalLabels.set(node,node.getAttribute('aria-label')||node.textContent);const label=originalLabels.get(node)+(allowed?' · Сервер рұқсат берді':' · Құлыптаулы');if(node.getAttribute('aria-label')!==label)node.setAttribute('aria-label',label);});
  doc.querySelectorAll('.area-list>button').forEach((node,index)=>setDisabled(node,!allowedKeys().includes(LEGACY_KEYS[index])));
  const key=selectedKey(),allowed=!!key&&allowedKeys().includes(key);
  doc.querySelectorAll('.quest-button,.mode-card').forEach(node=>setDisabled(node,!allowed));
  const noAccess=allowedKeys().length===0;curtain.hidden=!noAccess&&(!key||allowed);curtain.style.display=curtain.hidden?'none':'grid';const heading=noAccess?'Рұқсатты серверден тексеру қажет':'Бұл зертхана әлі жабық';if(title.textContent!==heading)title.textContent=heading;back.hidden=noAccess;
  if(allowed&&lastSelection!==key){lastSelection=key;if(win.parent!==win)win.parent.postMessage({type:'campus:legacy-selection',lessonId:legacyLessonId(key)},win.location.origin);}
 }
 back.addEventListener('click',()=>{const index=LEGACY_KEYS.indexOf(allowedKeys()[0]);doc.querySelector('#station-label-'+index)?.click();});
 const stop=event=>{event.preventDefault();event.stopImmediatePropagation();};
 function click(event){
  if(curtain.contains(event.target))return;
  const label=event.target.closest?.('.station-label');if(label){const key=LEGACY_KEYS[Number(label.id.replace('station-label-',''))];if(!allowedKeys().includes(key))stop(event);return;}
  const row=event.target.closest?.('.area-list>button');if(row){const index=[...row.parentElement.children].indexOf(row);if(!allowedKeys().includes(LEGACY_KEYS[index]))stop(event);return;}
  if(event.target.closest?.('.quest-button,.mode-card')&&!allowedKeys().includes(selectedKey()))stop(event);
 }
 function key(event){if(/INPUT|TEXTAREA|SELECT/.test(event.target?.tagName))return;if(allowedKeys().length===0){if(!['Tab','Enter','Escape'].includes(event.key))stop(event);return;}if(!policy.staff&&!win.__campusLegacyEntryGuarded&&allowedKeys().length<8&&(['KeyE'].includes(event.code)||['e','у'].includes(event.key?.toLowerCase())))stop(event);if(!curtain.hidden&&!['Tab','Enter','Escape'].includes(event.key))stop(event);}
 doc.addEventListener('click',click,true);doc.addEventListener('keydown',key,true);
 const observer=new win.MutationObserver(apply);observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','disabled']});apply();
 const expiry=setInterval(()=>{if(Date.now()>(policy.expiresAt||0))apply();},1000);
 const controller={update(next){if((next.checkedAt||0)<(policy.checkedAt||0))return;policy=next;apply();},canOpen:key=>allowedKeys().includes(key),dispose(){disposed=true;clearInterval(expiry);observer.disconnect();doc.removeEventListener('click',click,true);doc.removeEventListener('keydown',key,true);style.remove();curtain.remove();note.remove();}};
 return controller;
}
