export const LESSON_ID='q1-network-01';
export const MISSION_ID='network-connect-01';
export const RETURN_URL='/?lesson=q1-network-01#result';
export async function api(path,body,fetcher=fetch){
 const response=await fetcher(path,{credentials:'same-origin',...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Campus-Request':'1'},body:JSON.stringify(body)})});
 let data;try{data=await response.json();}catch{throw new Error('Сервер жауабы түсініксіз. Кейін қайта көріңіз.');}
 if(!response.ok){const error=new Error(data.error||'Сұрау орындалмады.');error.status=response.status;error.code=data.code;throw error;}
 return data;
}
export function evidence(roles,chosenLinks,fault){return {roles:{...roles},links:chosenLinks.map(link=>[...link]),fault};}
export async function createAttempt(fetcher=fetch){return api('/api/attempts',{lessonId:LESSON_ID,missionId:MISSION_ID},fetcher);}
export async function submitAttempt(id,body,fetcher=fetch){return api('/api/attempts/'+encodeURIComponent(id)+'/submit',body,fetcher);}
