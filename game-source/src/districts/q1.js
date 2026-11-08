// Only Q1 is implemented. Future quarters must provide their own plan and roster.
export const Q1={
 id:'q1',title:'Байланыс зерттеу ауданы',
 view:{position:[34,21,42],target:[0,.6,0]},bounds:{x:21,z:18},
 stations:[
  {position:[-13,-10],entry:[-7,-10],rotation:Math.PI/2,width:8,depth:6,kind:'network-lab'},
  {position:[0,-12],entry:[0,-7],rotation:0,width:7,depth:5,kind:'relay-workshop'},
  {position:[13,-10],entry:[7,-10],rotation:-Math.PI/2,width:6,depth:6,kind:'address-tower'},
  {position:[-13,1],entry:[-7,1],rotation:Math.PI/2,width:7,depth:6,kind:'directory-dome'},
  {position:[13,1],entry:[7,1],rotation:-Math.PI/2,width:7,depth:6,kind:'security-gate'},
  {position:[-13,12],entry:[-7,12],rotation:Math.PI/2,width:6,depth:5,kind:'crypto-vault'},
  {position:[1,12],entry:[1,7],rotation:Math.PI,width:6,depth:5,kind:'identity-portal'},
  {position:[13,12],entry:[7,12],rotation:-Math.PI/2,width:6,depth:5,kind:'logic-observatory'}
 ],
 routes:{research:[[-6,-6],[6,-6],[6,6],[-6,6]],service:[[-7,-10],[-7,1],[-7,12],[-5,12],[-5,1],[-5,-10]]},
 avatars:[{id:'naruto',label:'Naruto',asset:'naruto.glb',kind:'naruto',height:1.8},{id:'jerry',label:'Jerry',asset:'jerry.glb',kind:'jerry',height:1.15},{id:'engineer',label:'Желі инженері',asset:'student-B.vrm'}, {id:'researcher',label:'Зерттеуші',asset:'student-A.vrm'}, {id:'robot',label:'Сервис роботы',asset:'campus-robot.glb'}],
 civilians:[{asset:'naruto.glb',kind:'naruto',height:1.8,route:'research',offset:4,speed:2.4,scale:1},{asset:'jerry.glb',kind:'jerry',height:1.05,route:'research',offset:27,speed:1.1,scale:1}],
 service:{asset:'campus-robot.glb',route:'service',offset:8,speed:.75,scale:.43,idle:'Idle',walk:'Walking'},
 infrastructureColliders:[{x:0,z:0,hx:1.55,hz:2.15},{x:-13,z:-5.35,hx:.75,hz:.95},{x:19,z:-16,hx:.9,hz:.9}]
};
// Never silently render Q1 scenery for another quarter.
export function districtFor(id){if(id!=='q1')throw new Error('Бұл тоқсанның ауданы әлі дайын емес');return Q1;}
export function stationCollider(s){const sideways=Math.abs(Math.sin(s.rotation))>.5;return {x:s.position[0],z:s.position[1],hx:(sideways?s.depth:s.width)/2+.35,hz:(sideways?s.width:s.depth)/2+.35};}
export function routePose(route,distance){
 if(route.length<2)throw new Error('A route needs two points');
 const lengths=route.map((p,i)=>Math.hypot(route[(i+1)%route.length][0]-p[0],route[(i+1)%route.length][1]-p[1]));
 const total=lengths.reduce((a,b)=>a+b,0);if(!total)throw new Error('A route needs nonzero length');
 let remaining=((distance%total)+total)%total;
 for(let i=0;i<route.length;i++){if(remaining<lengths[i]||i===route.length-1){const a=route[i],b=route[(i+1)%route.length],t=lengths[i]?remaining/lengths[i]:0;return {x:a[0]+(b[0]-a[0])*t,z:a[1]+(b[1]-a[1])*t,heading:Math.atan2(b[0]-a[0],b[1]-a[1])};}remaining-=lengths[i];}
}
// Fillet patrol corners without altering player movement or lesson entrances.
export function roundedPatrol(route,radius=.65){
 return route.flatMap((p,i)=>{
  const prev=route[(i+route.length-1)%route.length],next=route[(i+1)%route.length];
  const a=Math.hypot(prev[0]-p[0],prev[1]-p[1]),b=Math.hypot(next[0]-p[0],next[1]-p[1]);
  if(!a||!b)return [p];
  const r=Math.min(radius,a*.25,b*.25),entry=[p[0]+(prev[0]-p[0])*r/a,p[1]+(prev[1]-p[1])*r/a],exit=[p[0]+(next[0]-p[0])*r/b,p[1]+(next[1]-p[1])*r/b];
  return Array.from({length:9},(_,step)=>{const t=step/8,u=1-t;return [u*u*entry[0]+2*u*t*p[0]+t*t*exit[0],u*u*entry[1]+2*u*t*p[1]+t*t*exit[1]];});
 });
}
