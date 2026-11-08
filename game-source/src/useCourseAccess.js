import {useCallback,useEffect,useRef,useState} from 'react';
import {fetchCourseAccess} from './courseAccess';
export function useCourseAccess(){
 const [access,setAccess]=useState({status:'loading'}),generation=useRef(0),alive=useRef(false);
 const refresh=useCallback(async()=>{const request=++generation.current;const next=await fetchCourseAccess();if(alive.current&&request===generation.current)setAccess(next);},[]);
 const invalidate=useCallback(()=>{generation.current++;setAccess({status:'loading'});refresh();},[refresh]);
 useEffect(()=>{alive.current=true;refresh();const timer=setInterval(refresh,20000),focus=()=>refresh(),visibility=()=>{if(!document.hidden)refresh();};addEventListener('focus',focus);document.addEventListener('visibilitychange',visibility);return()=>{alive.current=false;generation.current++;clearInterval(timer);removeEventListener('focus',focus);document.removeEventListener('visibilitychange',visibility);};},[refresh]);
 return {access,refresh,invalidate};
}
