import {useEffect,useRef,useCallback,useState} from 'react';
import {accessFor} from './courseAccess';
import {attachLegacyAccess,legacyPolicy,validLegacySelection} from './legacyAccess';
import {legacyCampusUrl} from './courseMissions';
export function LegacyCampus({lesson,access,onSelect}){
 const frame=useRef(null),controller=useRef(null),owned=useRef(false),[error,setError]=useState('');const permission=accessFor(access,lesson.id);
 const loaded=useCallback(()=>{try{const win=frame.current.contentWindow;const existing=win.__campusLegacyAccess;controller.current=existing||attachLegacyAccess(win.document,legacyPolicy(access));owned.current=!existing;win.__campusLegacyAccess=controller.current;controller.current.update(legacyPolicy(access));setError('');}catch{setError('Кампус рұқсаттарын қосу мүмкін болмады. Сайтқа оралыңыз.');}},[access]);
 useEffect(()=>{controller.current?.update(legacyPolicy(access));},[access]);
 useEffect(()=>{const message=event=>{if(validLegacySelection(event,frame.current,location.origin,access))onSelect(event.data.lessonId);};addEventListener('message',message);return()=>removeEventListener('message',message);},[access,onSelect]);
 useEffect(()=>()=>{if(owned.current)controller.current?.dispose();},[lesson.id,permission.allowed]);
 if(!permission.allowed)return <div className="legacy-access-state" role="status"><h2>{permission.code==='locked'?'Бұл сабақ әлі жабық':'Кампус рұқсаты тексерілуде'}</h2><p>{permission.message}</p></div>;
 if(error)return <div className="legacy-access-state" role="alert">{error}</div>;
 return <iframe ref={frame} onLoad={loaded} className="legacy-campus-frame" title="3-тоқсанның бөлек 3D кампусы" src={legacyCampusUrl(lesson.id,lesson.legacyGameUrl)} allow="fullscreen"/>;
}
