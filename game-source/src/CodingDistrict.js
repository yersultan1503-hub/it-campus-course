import * as THREE from 'three';
import {Q2} from './districts/q2.js';
import {stationCollider} from './districts/q1.js';
import {districtBoxGeometry} from './districtMaterials.js';
export function buildCodingDistrict(scene,lessons,sign){
 const meshes=[],materials=new Map(),stationGroups=[],markers=[],doors=[],trees=[],lamps=[],signals=[],lights=[];
 const mat=(color,metalness=0)=>{const key=color+metalness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.3:.75}));return materials.get(key);};
 const glass=new THREE.MeshStandardMaterial({color:'#326875',metalness:.6,roughness:.18,emissive:'#c59051',emissiveIntensity:.35});
 const glow=new THREE.MeshBasicMaterial({color:'#8aedef',toneMapped:false});
 function mesh(geo,m,parent,x=0,y=0,z=0){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);meshes.push(o);return o;}
 const box=(p,w,h,d,c,x=0,y=0,z=0)=>mesh(districtBoxGeometry(w,h,d),typeof c==='string'?mat(c):c,p,x,y,z);
 const group=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
 const cylinder=(p,r,h,c,x,y,z)=>mesh(new THREE.CylinderGeometry(r,r,h,24),mat(c),p,x,y,z);
 // Two genuinely separate waterfronts; bridges are the only central crossings.
 box(scene,180,.2,170,'#436a60',0,-1,0);
 for(const side of [-1,1]){box(scene,80,.7,24,'#8eaaad',0,-.35,side*15);box(scene,79,.08,23.6,'#d2d9d2',0,.035,side*15);box(scene,77,.06,4.6,'#ece4d2',0,.09,side*7);box(scene,78,.12,.35,'#5e7a7e',0,.1,side*3.15);}
 const water=mesh(new THREE.PlaneGeometry(79,6),new THREE.MeshStandardMaterial({color:'#217e91',metalness:.5,roughness:.22}),scene,0,-.12,0);water.rotation.x=-Math.PI/2;water.name='canal-water';
 for(const x of [-34,-20,0,20,34]){box(scene,5.5,.18,6.8,'#e1d6bf',x,.12,0);for(const side of [-1,1]){box(scene,.09,.09,7,glow,x+side*2.55,.85,0);for(let z=-3;z<=3;z+=1.5)box(scene,.1,.8,.1,'#66858d',x+side*2.55,.4,z);}}
 // A lit, raised tram line frames the city without blocking walking routes.
 for(const z of [-25,25]){box(scene,77,.3,1.1,'#8faaa9',0,4.6,z);for(let x=-35;x<=35;x+=10){box(scene,.35,4.6,.35,'#aabfb8',x,2.3,z);}}
 const tram=group(scene);tram.name='canal-tram';box(tram,4,1.1,1,'#f2c179',0,.6,0);box(tram,3.5,.55,1.03,glass,0,.75,0);box(tram,4.1,.12,1.1,'#f1f2d9',0,1.23,0);
 const boat=group(scene);boat.name='canal-ferry';box(boat,2.6,.3,1.1,'#f7e8ca',0,0,0);box(boat,1.4,.6,.8,glass,0,.45,0);
 Q2.stations.forEach((s,i)=>{const lesson=lessons[i],g=group(scene,...[s.position[0],0,s.position[1]]);g.rotation.y=s.rotation;g.userData.station=i;g.userData.kind=s.kind;stationGroups.push(g);const style=i%7,h=3.5+(i%3)*.7,color=i<7?'#ece7d6':'#c88266';
  box(g,7.8,.24,6.8,'#8ba7a6',0,.12,0);
  if(style===0){box(g,7,h,5.8,color,0,h/2+.25,0);box(g,7.5,.3,6.2,'#edba7a',0,h+.4,0);for(let x=-3;x<=3;x+=1.5)box(g,.14,h,6.1,'#a26348',x,h/2+.4,0);}
  if(style===1){for(const x of [-2.1,2.1])box(g,2.5,h+1,5.8,color,x,(h+1)/2+.25,0);box(g,7,.75,3,'#ebbc7d',0,h+.3,0);box(g,2.7,1.5,3,glass,0,h-.8,0);}
  if(style===2){cylinder(g,3,h,color,0,h/2+.25,0);for(let k=0;k<3;k++)cylinder(g,3.3,.2,'#5b929a',0,1.1+k*1.3,0);box(g,5,.8,3,glass,0,h+.6,0);}
  if(style===3){for(let k=0;k<4;k++)box(g,7-k*1.3,1.1,6-k*.9,k%2?'#9ac8bd':color,-k*.35,.8+k*1.1,-k*.3);}
  if(style===4){box(g,7,2.7,6,color,0,1.6,0);const roof=mesh(new THREE.CylinderGeometry(3.6,3.6,6,24,1,false,0,Math.PI),mat('#69a4ae',.4),g,0,2.9,0);roof.rotation.x=Math.PI/2;roof.rotation.z=Math.PI/2;}
  if(style===5){for(const x of [-2.3,0,2.3]){box(g,2.1,3.2+Math.abs(x)*.45,5.8,color,x,1.8+Math.abs(x)*.225,0);box(g,2.2,.18,6,'#a5cbb4',x,3.5+Math.abs(x)*.45,0);}}
  if(style===6){box(g,6,h,5,color,0,h/2+.3,0);const crown=mesh(new THREE.TorusGeometry(2.2,.17,8,32),glow,g,0,h+1.3,0);crown.rotation.y=.5;box(g,6.5,.2,5.8,'#7b9698',0,h+.4,0);}
  for(const side of [-1,1])for(let z=-1.7;z<=1.7;z+=1.7){const pane=mesh(new THREE.PlaneGeometry(1.2,1.4),glass,g,side*3.51,1.8,z);pane.rotation.y=side*Math.PI/2;}
  for(const x of [-2,2])box(g,1.6,1.6,.07,glass,x,1.9,3.04);
  sign(g,lesson.short,5,.75,0,3.2,3.12,'#214b5b');sign(g,String(i+1).padStart(2,'0'),1,.65,2.8,.65,3.15,'#b57548');
  const hinge=group(g,-.55,1.35,3.09);box(hinge,1.1,2.25,.09,glass,.55,0,0);doors.push({hinge,i});
  // Roof equipment and planted terraces give each lab a lived-in scale.
  box(g,1.1,.5,1,'#658d92',-1,h+.65,-1);for(let k=0;k<3;k++)box(g,1.3,.07,.75,'#244d69',k*1.5-1.5,h+.95,-1.5);
  const height=8.1,marker=group(scene,s.position[0],height,s.position[1]);const gem=mesh(new THREE.OctahedronGeometry(.32),new THREE.MeshStandardMaterial({color:lesson.color,emissive:lesson.color,emissiveIntensity:.65}),marker);markers.push({g:marker,gem,i,height});
 });
 // Jacaranda trees, flower planters, benches and wayfinding along both promenades.
 for(const side of [-1,1])for(let x=-35;x<=35;x+=10){const z=side*21.5,g=group(scene,x,0,z);trees.push(g);cylinder(g,.16,2.5,'#7a6751',0,1.25,0);for(let k=0;k<4;k++){const crown=mesh(new THREE.IcosahedronGeometry(1.25,1),mat(k%2?'#9e8ac0':'#86af9d'),g,Math.cos(k*2)*.65,3+Math.sin(k)*.35,Math.sin(k*2)*.6);crown.scale.y=.8;}box(scene,3,.5,1,'#d9c7ad',x,.25,side*5.1);box(scene,2.8,.08,.8,'#739b7a',x,.54,side*5.1);for(let k=0;k<5;k++)mesh(new THREE.IcosahedronGeometry(.13,0),mat(k%2?'#e8af7d':'#ceb4e2'),scene,x-1+k*.5,.68,side*5.1);box(scene,1.8,.12,.5,'#ac7957',x+2,.55,side*5.3);for(const dx of [-.7,.7])box(scene,.12,.55,.45,'#56757a',x+2+dx,.27,side*5.3);}
 for(const side of [-1,1])for(let x=-30;x<=30;x+=10){const z=side*4.1,g=group(scene,x,0,z);lamps.push(g);box(g,.12,2.6,.12,'#567b87',0,1.3,0);box(g,.7,.1,.4,glow,.2,2.65,0);if(x%20===0){const light=new THREE.PointLight('#ffd49b',13,10,2);light.position.set(x,2.5,z);scene.add(light);lights.push(light);}}
 const forum=group(scene,0,0,8);forum.name='code-forum';sign(forum,'IT / CODE',4,.9,0,2.8,0,'#254d62');
 const bases=[...materials.values()].map(m=>({m,color:m.color.clone()}));let last='';
 function setTheme(theme,low){const key=theme+low;if(last===key)return;last=key;const night=theme!=='light';for(const {m,color} of bases){m.color.copy(color);if(night)m.color.lerp(new THREE.Color('#214258'),.32);}glass.emissiveIntensity=night?.65:.04;lights.forEach((l,i)=>l.visible=night&&(!low||i<2));}
 function update(t,ambient,low){const time=ambient?t:0;tram.position.set(Math.sin(time*.09)*34,4.8,-25);tram.rotation.y=Math.cos(time*.09)<0?Math.PI:0;boat.position.set(Math.sin(time*.065)*28,.13,0);boat.rotation.y=Math.cos(time*.065)<0?Math.PI:0;water.material.roughness=low?.3:.22+Math.sin(time)*.035;}
 scene.updateMatrixWorld(true);const bounds=new THREE.Box3();const cameraOccluders=meshes.filter(m=>m!==water&&!markers.some(k=>k.gem===m)&&bounds.setFromObject(m).max.y>.3);
 return {stationGroups,markers,doors,trees,lamps,signals,colliders:[...Q2.stations.map(stationCollider),...Q2.infrastructureColliders],cameraOccluders,setTheme,update};
}
