// Spatial hubs are presentation, never an official syllabus or authorization list.
export const Q4={id:'q4',title:'Деректер қоры · Деректер айлағы',view:{position:[36,30,36],target:[0,.6,0]},bounds:{x:21,z:18},
 stations:[
 {position:[-12,-9],entry:[-6,-9],rotation:Math.PI/2,width:8,depth:6,kind:'archive-silos'},
 {position:[11,-9],entry:[5,-9],rotation:-Math.PI/2,width:8,depth:6,kind:'relation-hall'},
 {position:[11,10],entry:[5,10],rotation:-Math.PI/2,width:8,depth:6,kind:'query-console'},
 {position:[-12,10],entry:[-6,10],rotation:Math.PI/2,width:8,depth:6,kind:'data-vault'}],
 routes:{research:[[-5,-5],[4,-5],[4,5],[-5,5]],service:[[-6,-9],[-6,10],[-4,10],[-4,-9]]},
 avatars:[{id:'researcher',label:'Деректер зерттеушісі',asset:'student-C.vrm'},{id:'engineer',label:'Деректер инженері',asset:'student-A.vrm'},{id:'robot',label:'Мұрағат роботы',asset:'campus-robot.glb'}],
 civilians:[{asset:'student-B.vrm',route:'research',offset:5,speed:.7,scale:1.05},{asset:'student-A.vrm',route:'research',offset:23,speed:.8,scale:1.08}],
 service:{asset:'campus-robot.glb',route:'service',offset:12,speed:.6,scale:.43,idle:'Idle',walk:'Walking'},infrastructureColliders:[]};
export const Q4_STATIONS=Q4.stations.map((s,i)=>({...s,id:'q4-hub-'+i,short:['Мұрағат','Байланыс','Сұраныс','Қойма'][i],name:['Деректер мұрағаты','Байланыстар залы','Сұраныстар орталығы','Деректер қоймасы'][i],color:['#55d6cb','#79b5e8','#e2b862','#8ac8aa'][i]}));
