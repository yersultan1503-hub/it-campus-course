export const Q2={id:'q2',title:'Бағдарламалау және алгоритмдер · Код ауданы',view:{position:[32,24,40],target:[0,.6,0]},bounds:{x:21,z:18},
 stations:[
 {position:[-12,-7],entry:[-7,-7],rotation:Math.PI/2,width:7,depth:5,kind:'function-workshop'},
 {position:[-1,-10],entry:[-1,-5.5],rotation:0,width:7,depth:5,kind:'argument-bridge'},
 {position:[12,-5],entry:[6.5,-5],rotation:-Math.PI/2,width:6,depth:5,kind:'return-tower'},
 {position:[9,10],entry:[5,8],rotation:-Math.PI/2,width:7,depth:5,kind:'test-foundry'},
 {position:[-9,10],entry:[-4.5,8],rotation:Math.PI/2,width:7,depth:5,kind:'recursion-stack'}],
 routes:{research:[[-5,-3],[5,-3],[5,4],[-5,4]],service:[[-6,-7],[-6,8],[4.5,8],[4.5,-4]]},
 avatars:[{id:'engineer',label:'Программист',asset:'student-B.vrm'},{id:'researcher',label:'Тестілеуші',asset:'student-A.vrm'},{id:'robot',label:'Debug роботы',asset:'campus-robot.glb'}],
 civilians:[{asset:'student-A.vrm',route:'research',offset:2,speed:.85,scale:1.05},{asset:'student-C.vrm',route:'research',offset:20,speed:.8,scale:1.08}],
 service:{asset:'campus-robot.glb',route:'service',offset:9,speed:.65,scale:.43,idle:'Idle',walk:'Walking'},infrastructureColliders:[]};
export const Q2_STATIONS=[
 {id:'q2-01',short:'f(x)',name:'Функциялар мен процедуралар',goal:'Қайталанатын әрекетті функцияға бөл.'},
 {id:'q2-02',short:'Жолдар',name:'Жолдарды өңдеу шеберханасы',goal:'Индекстер, кесінділер және жол әдістерін зертте.'},
 {id:'q2-03',short:'Файлдар',name:'Файлдар мұнарасы',goal:'Файлдан оқу және файлға жазуды зертте.'},
 {id:'q2-04',short:'Сұрыптау',name:'Сұрыптау зертханасы',goal:'Сұрыптау алгоритмдерінің қадамдарын зертте.'},
 {id:'q2-05',short:'Графтар',name:'Графтар зертханасы',goal:'Граф, іздеу және қысқа жолды зертте.'}
].map((lesson,i)=>({...lesson,...Q2.stations[i],color:['#d7a458','#a18add','#68c4ae','#df8870','#b894df'][i]}));
