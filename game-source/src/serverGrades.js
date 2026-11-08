// Never derive a grade from UI answers, passed, XP or localStorage.
export function serverAutomaticGrade(progress){
 const g=progress?.automaticGrade;
 if(g?.source!=='server'||g.maxScore!==10||!Number.isFinite(g.score)||g.score<0||g.score>10||!Number.isInteger(g.correct)||!Number.isInteger(g.total)||g.total<=0||g.correct<0||g.correct>g.total||typeof g.attemptId!=='string'||!g.attemptId)return null;
 return g;
}
