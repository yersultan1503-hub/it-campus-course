export const gameNames={lab:'Сынақ зертханасы',quiz:'Білім аренасы',match:'Жұбын тап',order:'Код шебері',debug:'Қате детективі'};
export function missionSummary(raw,id){
 let p;try{p=JSON.parse(raw||'null');}catch{return {complete:false,names:[],lab:false,extras:0};}
 const m=p?.version===1&&p.missions&&typeof p.missions==='object'?p.missions[id]:null;
 const names=Object.keys(gameNames).filter(k=>m&&typeof m[k]==='object'&&m[k]!==null&&typeof m[k].completedAt==='string');
 const lab=names.includes('lab'),extras=names.filter(k=>k!=='lab').length;
 return {complete:lab&&extras>=2,names,lab,extras};
}
export function reflectionReady(d={}){return ['learned','challenge','next'].every(k=>typeof d[k]==='string'&&d[k].trim().length>0);}
export function completionCount(d,mission){return ['theory','slides','video'].filter(k=>d[k]===true).length+Number(mission.complete)+Number(reflectionReady(d));}
