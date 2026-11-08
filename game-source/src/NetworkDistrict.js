import * as THREE from 'three';
import {Q1,stationCollider} from './districts/q1.js';
import {districtBoxGeometry,pavingGeometry,districtMaterial} from './districtMaterials.js';
// Q1-specific architecture. Other quarters need separate scene factories.
export function buildNetworkDistrict(scene,lessons,sign,{surfaceTextures={}}={}){
 const stationGroups=[],markers=[],doors=[],trees=[],lamps=[],signals=[],traces=[];
 const colliders=[...Q1.stations.map(stationCollider),...Q1.infrastructureColliders];
 scene.userData.district='q1';
 const materials=new Map();
 const metalColors=new Set(['#365564','#314d60','#315e74','#354f5d','#2d687d','#718b98','#536d7e','#43606c','#243d4a']);
 const material=(color,metalness=metalColors.has(color)?.4:0,profile='paint')=>{const key=color+metalness+profile;if(!materials.has(key))materials.set(key,districtMaterial(color,metalness,profile,surfaceTextures));return materials.get(key);};
 function mesh(geo,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(p,w,h,d,c,x=0,y=0,z=0)=>mesh(districtBoxGeometry(w,h,d),material(c),p,x,y,z);
 const cylinder=(p,r,h,c,x=0,y=0,z=0)=>mesh(new THREE.CylinderGeometry(r,r,h,16),material(c,.3),p,x,y,z);
 function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
 function beam(p,a,b,r,color){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),material(color,.35),p);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
 const glass=material('#3b647a',0,'glass');
 const pave=(w,d,c,x=0,z=0)=>mesh(pavingGeometry(w,.08,d),material(c,0,'paving'),scene,x,.045,z);
 const led=new THREE.MeshBasicMaterial({color:'#51d8da'});
 // Linear fibre boulevard and staggered service blocks replace the radial fountain plan.
 box(scene,46,.65,40,'#8b9da6',0,-.43,0);mesh(pavingGeometry(45,.12,39),material('#aebbc2',0,'paving'),scene,0,-.05,0);box(scene,160,.15,160,'#a7bdad',0,-.85,0);
 pave(4,35,'#d6dddc');
 for(const x of [-6,6])pave(2.8,32,'#d6dddc',x,0);
 for(const z of [-6,6])pave(16,2.8,'#d6dddc',0,z);
 for(const s of Q1.stations){const [x,z]=s.entry;pave(6,2,'#d6dddc',x<0?-9:x>5?9:x,z);}
 const fibreMaterial=new THREE.MeshBasicMaterial({color:'#278b9f'});
 function conduit(points){const curve=new THREE.CurvePath();for(let i=1;i<points.length;i++)curve.add(new THREE.LineCurve3(new THREE.Vector3(...points[i-1]),new THREE.Vector3(...points[i])));mesh(new THREE.TubeGeometry(curve,Math.max(4,points.length*8),.085,6,false),fibreMaterial,scene);traces.push(curve);}
 conduit([[0,.14,17],[0,.14,6],[3,.14,6],[3,.14,-6],[0,.14,-6],[0,.14,-9]]);
 for(const z of [-10,1,12])for(const side of [-1,1])conduit([[3,.14,z],[side*7,.14,z],[side*10,.14,z]]);
 const packetMaterial=new THREE.MeshBasicMaterial({color:'#d0ffff'});
 traces.forEach((curve,i)=>{const packet=mesh(new THREE.SphereGeometry(.12,8,6),packetMaterial,scene);signals.push({packet,curve,offset:i*.13});});
 // Outdoor patch racks and a utility bridge replace the ornamental globe.
 const hub=group(scene,0,0,0);box(hub,3,.2,4,'#5e747f',0,.1,0);
 for(const x of [-.8,.8]){box(hub,.95,2.4,1.25,'#243d4a',x,1.4,0);for(let row=0;row<8;row++){box(hub,.78,.17,.06,'#526f7c',x,.5+row*.26,.66);for(let col=0;col<3;col++)mesh(new THREE.BoxGeometry(.035,.045,.02),led,hub,x-.25+col*.1,.5+row*.26,.7);}}
 for(const x of [-1.25,1.25])cylinder(hub,.055,3.7,'#486574',x,1.85,-.8);
 box(hub,3.2,.12,2.6,'#f0f5f2',0,3.75,-.1);sign(hub,'FIBRE HUB',2.1,.45,0,3.35,1.21,'#1e5263');
 for(const z of [-7,-3]){for(const x of [-3.3,3.3])box(scene,.14,4.2,.14,'#718b98',x,2.1,z);box(scene,6.8,.18,.65,'#718b98',0,4.2,z);for(const x of [-2,-1,0,1,2])box(scene,.07,.09,.7,'#263f4f',x,4.34,z);}
 const mast=group(scene,19,0,-16);for(const x of [-.65,.65])for(const z of [-.65,.65])beam(mast,[x,0,z],[x*.22,10,z*.22],.07,'#536d7e');
 for(let h=1;h<9;h+=2)for(const side of [-1,1])beam(mast,[-.6,h,side*.55],[.5,h+2,side*.4],.04,'#7b929d');
 for(const h of [6,8]){box(mast,2.3,.12,.13,'#dce6e8',0,h,0);for(const x of [-1.1,1.1])box(mast,.35,1.1,.17,'#eff4ef',x,h,0);}
 const dish=mesh(new THREE.SphereGeometry(.85,20,12,0,Math.PI*2,0,Math.PI/2),material('#e5edef',.4),mast,0,9,0);dish.rotation.x=.8;
 Q1.stations.forEach((s,i)=>{
  const lesson=lessons[i],g=group(scene,s.position[0],0,s.position[1]);g.rotation.y=s.rotation;g.userData.station=i;g.userData.kind=s.kind;stationGroups.push(g);
  const {width:w,depth:d}=s;box(g,w+.5,.18,d+.5,'#728b95',0,.1,0);
  if(i===0){
   // Sawtooth engineering hall, glass facade, loading canopy and patch cabinet.
   box(g,w,3.1,d,'#dce7e8',0,1.7,0);mesh(new THREE.BoxGeometry(w-.4,1.55,.09),glass,g,0,1.85,d/2+.06);
   for(const x of [-2.8,-1.4,0,1.4,2.8])box(g,.075,1.6,.12,'#234758',x,1.85,d/2+.14);
   for(let n=0;n<3;n++){const roof=box(g,w+.25,.16,2.2,'#365564',0,3.52+n*.07,-2.1+n*2.05);roof.rotation.x=-.18;mesh(new THREE.BoxGeometry(w-.5,.45,.07),glass,g,0,3.46+n*.07,-2.9+n*2.05);}
   box(g,w+.5,.18,1.4,'#1c7991',0,2.95,d/2+.48);for(const x of [-w/2+.3,w/2-.3])box(g,.1,2.9,.1,'#537e8d',x,1.5,d/2+.9);
   box(g,1.2,1.8,.7,'#314d60',-w/2-.65,1,0);for(let k=0;k<5;k++)mesh(new THREE.BoxGeometry(.8,.045,.03),led,g,-w/2-.65,.5+k*.22,.37);
  }else if(i===1){
   box(g,w,2.5,d,'#b9c9ce',0,1.4,0);const roof=box(g,w+.4,.18,d+.6,'#326979',0,2.95,0);roof.rotation.z=.08;
   for(const x of [-2.2,0,2.2])box(g,1.5,1.6,.1,'#334e5c',x,1.25,d/2+.08);for(const x of [-2,0,2])box(g,1.3,.14,1.5,'#263f63',x,3.24,-.3);
  }else if(i===2){
   box(g,4.3,6.1,4.3,'#d4e0e3',0,3.2,-.5);for(let floor=0;floor<4;floor++)mesh(new THREE.BoxGeometry(4.5,.7,4.5),glass,g,0,1.4+floor*1.2,-.5);
   box(g,6,.18,5.8,'#315e74',0,6.4,-.4);cylinder(g,.055,2,'#719bab',0,7.4,-.5);
  }else if(i===3){
   cylinder(g,2.8,2.9,'#d4e2e2',0,1.6,0);const dome=mesh(new THREE.SphereGeometry(2.9,24,12,0,Math.PI*2,0,Math.PI/2),material('#497783',.5),g,0,3,0);dome.scale.y=.65;
   for(const x of [-1.7,0,1.7])mesh(new THREE.BoxGeometry(1,.9,.1),glass,g,x,2,d/2-.38);
  }else if(i===4){
   for(const x of [-2.3,2.3]){box(g,1.8,3.8,d,'#43606c',x,2,0);mesh(new THREE.BoxGeometry(1.5,1.2,.1),glass,g,x,2,d/2+.08);}
   box(g,w,1,1.4,'#b8d5d6',0,4.3,1.6);for(let x=-1;x<=1;x++)box(g,.08,2.7,.08,'#69bec4',x,1.5,1.6);
  }else if(i===5){
   box(g,w,2.4,d,'#6c8893',0,1.35,0);for(const x of [-2,-1,0,1,2])box(g,.14,3,d+.3,'#d2dfdf',x,1.7,0);box(g,w+.5,.2,d+.5,'#354f5d',0,3.3,0);
  }else if(i===6){
   for(const x of [-2.3,2.3])box(g,.65,4,.65,'#6b8b97',x,2,0);box(g,w,1,2,'#2d687d',0,4.2,0);mesh(new THREE.BoxGeometry(3.7,2,.1),glass,g,0,1.3,-.7);box(g,1,1.4,.8,'#d2e3e4',-1.8,.8,1.2);
  }else{
   for(const x of [-w/2,w/2])box(g,.12,1.1,d,'#81969c',x,.65,0);for(const z of [-d/2,d/2])box(g,w,1.1,.12,'#81969c',0,.65,z);
   for(const x of [-2,0,2]){box(g,.35,.7,.35,'#e1ad59',x,.4,0);box(g,.6,.12,.6,'#f1d28c',x,.75,0);}
  }
  if(i<7){for(let x=-w/2+.9;x<w/2;x+=1.4)box(g,.025,1.9,.025,'#78939e',x,1.55,d/2+.075);box(g,w-.3,.09,.19,'#e4edef',0,.36,d/2+.1);}
  const signY=i===2?5.9:i===4?4.3:i===6?4.2:2.8;
  sign(g,i===0?'ЖЕЛІ ЗЕРТХАНАСЫ':lesson.short,Math.min(w-1,4),.72,0,signY,d/2+.2,'#19465a');
  if(i>0)sign(g,'КЕЙІН',1.8,.43,0,.72,d/2+.27,'#526777');
  if(i===0){const hinge=group(g,-.55,1.15,d/2+.18);box(hinge,1.1,2,.08,'#244a5f',.55,0,0);doors.push({hinge,i});}
  const height=i===2?8.7:i===6?5.6:5.4;
  const marker=group(scene,s.position[0],height,s.position[1]);const gem=mesh(new THREE.OctahedronGeometry(i===0?.3:.19),new THREE.MeshStandardMaterial({color:lesson.color,emissive:lesson.color,emissiveIntensity:.3}),marker);markers.push({g:marker,gem,i,height});
 });
 const beds=[[-19,-6],[-19,4],[-19,13],[19,-4],[19,6],[19,14],[-3,4],[3,-3]];
 beds.forEach(([x,z],index)=>{box(scene,2.1,.15,3.3,'#587e6e',x,.1,z);for(let j=0;j<5;j++){const shrub=mesh(new THREE.IcosahedronGeometry(.38,1),material(index%2?'#72988a':'#4e877a'),scene,x+(j%2-.5)*.7,.6,z+(j-2)*.5);shrub.scale.y=.85;}
  const tree=group(scene,x,0,z);trees.push(tree);cylinder(tree,.09,2.7,'#7f8b7a',0,1.4,0);const crown=mesh(new THREE.IcosahedronGeometry(.9,1),material('#5d8b79'),tree,0,3.1,0);crown.scale.set(.7,1.6,.7);
 });
 for(const x of [-22,22])for(const z of [-17,-9,0,9,17]){const hill=mesh(new THREE.IcosahedronGeometry(3.5,1),material('#86a697'),scene,x*1.5,-.3,z*1.8);hill.scale.set(2,.7,1.3);}
 for(const x of [-4,4])for(const z of [-13,-5,5,15]){const g=group(scene,x,0,z);lamps.push(g);box(g,.07,3.2,.07,'#607d8b',0,1.6,0);box(g,.7,.08,.25,'#d8f6ed',.28,3.2,0);}
 for(const [x,z] of [[-3,7],[3,7],[-3,-7],[3,-7]]){const g=group(scene,x,0,z);box(g,1.6,.12,.55,'#b8c9c8',0,.6,0);for(const dx of [-.6,.6])box(g,.12,.5,.45,'#496b7d',dx,.3,0);}
 for(const x of [-3,3])box(scene,.3,4.5,.3,'#456b7b',x,2.25,17);
 box(scene,6.7,1,.4,'#1c536b',0,4.4,17);sign(scene,'БАЙЛАНЫС АУДАНЫ',5.8,.65,0,4.4,17.24,'#1c536b');
 return {stationGroups,markers,doors,trees,lamps,signals,colliders};
}
