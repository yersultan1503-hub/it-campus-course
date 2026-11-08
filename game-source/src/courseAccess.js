import {api} from './campusApi.js';
const TTL=45000;
export function accessFor(snapshot,id,now=Date.now()){
 if(!snapshot||snapshot.status==='loading')return {allowed:false,code:'loading',message:'Рұқсаттар тексерілуде…'};
 if(snapshot.status!=='ready')return {allowed:false,code:snapshot.error?.status===401?'login_required':'unavailable',message:snapshot.error?.message||'Рұқсатты серверден тексеру мүмкін болмады.'};
 if(!snapshot.me?.user?.id||!['student','teacher','admin'].includes(snapshot.me?.user?.role))return {allowed:false,code:'login_required',message:'Алдымен сайтта аккаунтқа кіріңіз.'};
 if(now>snapshot.expiresAt)return {allowed:false,code:'stale',message:'Рұқсаттарды жаңарту қажет.'};
 if(snapshot.me?.user?.mustChangePassword)return {allowed:false,code:'password_change_required',message:'Сайтта құпиясөзді өзгертіңіз.'};
 const entry=snapshot.course?.quarters?.flatMap(q=>q.lessons||[]).find(l=>l.id===id);
 if(!entry||entry.kind!=='lesson')return {allowed:false,code:'missing',message:'Бұл сабаққа ойын миссиясы берілмеген.'};
 // Staff flags also come from /api/course; a role name alone never grants access.
 return entry.unlocked===true?{allowed:true,code:'open',message:'Сервер рұқсат берді.'}:{allowed:false,code:'locked',message:'Алдыңғы сабақты аяқтап, мұғалімнің қабылдауын күтіңіз.'};
}
export async function fetchCourseAccess(fetcher=fetch){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
 try{
  const wrapped=(path,options)=>fetcher(path,{...options,signal:controller.signal});
  const results=await Promise.allSettled([api('/api/me',undefined,wrapped),api('/api/course',undefined,wrapped)]);
  const me=results[0].status==='fulfilled'?results[0].value:null,course=results[1].status==='fulfilled'?results[1].value:null;
  let error=results.find(r=>r.status==='rejected')?.reason;
  if(!error&&(!me?.user?.id||!['student','teacher','admin'].includes(me.user.role)||!Array.isArray(course?.quarters)))error=new Error('Сервер рұқсаттарының пішімі дұрыс емес.');
  return {status:error?'error':'ready',me,course,error,checkedAt:Date.now(),expiresAt:Date.now()+TTL};
 }catch(error){return {status:'error',me:null,course:null,error,checkedAt:Date.now(),expiresAt:0};}
 finally{clearTimeout(timeout);}
}
