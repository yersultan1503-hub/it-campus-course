import * as THREE from 'three';
import {Q4} from './districts/q4.js';
import {stationCollider} from './districts/q1.js';
export function buildDatabaseDistrict(scene,lessons,sign){
 const meshes=[],materials=[],stationGroups=[],markers=[],doors=[],trees=[],lamps=[],signals=[];
 const material=color=>{const m=new THREE.MeshStandardMaterial({color,metalness:.25,roughness:.65});materials.push({m,color:m.color.clone()});return m;};
 const steel=material('#385768'),stone=material('#d8d4c3'),copper=material('#ba8e50'),water=material('#276e80'),glass=new THREE.MeshStandardMaterial({color:'#85dfd6',emissive:'#40bbaa',emissiveIntensity:.6,metalness:.3,roughness:.2});
 const group=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;};
 const mesh=(parent,geometry,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);meshes.push(o);return o;};
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,r,h,m,x=0,y=0,z=0)=>mesh(p,new THREE.CylinderGeometry(r,r,h,24),m,x,y,z);
 box(scene,130,.2,130,water,0,-.75,0);box(scene,44,.5,38,steel,0,-.35,0);box(scene,43,.15,37,stone,0,-.04,0);
 // Open water channels and raised rectilinear piers replace forest and observatory.
 for(const x of [-20,20])box(scene,1,.08,34,water,x,.08,0);
 for(const z of [-16,0,16]){box(scene,39,.08,1.2,water,0,.08,z);box(scene,4,.14,1.6,steel,-1,.12,z);}
 for(const x of [-5,4])box(scene,2,.12,31,steel,x,.1,0);
 const forum=group(scene,-.5,0,0);forum.name='database-index-plaza';
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){box(forum,1,.15,1,col===row?copper:glass,(col-1)*1.3,.23,(row-1)*1.3);}
 Q4.stations.forEach((s,i)=>{const l=lessons[i],g=group(scene,...[s.position[0],0,s.position[1]]);g.rotation.y=s.rotation;g.userData.station=i;g.userData.kind=s.kind;stationGroups.push(g);box(g,8.4,.3,6.4,steel,0,.15,0);
  if(i===0){for(const x of [-2.4,0,2.4]){cyl(g,1.05,4.6,stone,x,2.6,0);for(const y of [1,2.4,3.8,5])cyl(g,1.12,.18,copper,x,y,0);}}
  if(i===1){for(const x of [-2.4,2.4])box(g,2.4,4.2,5,steel,x,2.4,0);box(g,5,1.1,3,glass,0,3.8,0);for(let k=0;k<4;k++)box(g,7.8,.14,5.4,copper,0,1+k,0);}
  if(i===2){box(g,7,2.7,5,stone,0,1.65,0);const screen=box(g,6,2.5,.3,steel,0,4,0);screen.rotation.x=-.18;for(let row=0;row<3;row++)box(g,4-row,.12,.12,glass,-.6,3.4+row*.55,.25);sign(g,'SELECT',3,.65,0,5.6,0,'#284958');}
  if(i===3){box(g,7,4.6,5,steel,0,2.6,0);for(const x of [-2.5,0,2.5])for(const y of [1.3,2.6,3.9])box(g,1.5,.7,.12,glass,x,y,2.6);box(g,7.6,.35,5.6,copper,0,5.1,0);}
  sign(g,l.short,4,.65,0,3.1,3.2,'#284958');
  const hinge=group(g,-.5,1.3,3.25);box(hinge,1,2,.08,steel,.5,0,0);doors.push({hinge,i});
  const height=7,gMarker=group(scene,s.position[0],height,s.position[1]);const gem=mesh(gMarker,new THREE.OctahedronGeometry(.28),glass);markers.push({g:gMarker,gem,i,height});
 });
 // Harbor masts, cargo stacks and luminous data conduits form a separate skyline.
 const lights=[];for(const x of [-18,18])for(const z of [-13,13]){const g=group(scene,x,0,z);lamps.push(g);box(g,.18,5,.18,steel,0,2.5,0);box(g,2,.2,.2,copper,.8,5,0);const light=new THREE.PointLight('#7fe1d2',20,14,2);light.position.set(x,4.8,z);scene.add(light);lights.push(light);}
 for(let k=0;k<8;k++)box(scene,2,1+(k%3)*.5,1.5,k%2?copper:steel,-16+k*4.5,.7,-17.3);
 for(const z of [-5,5]){const curve=new THREE.LineCurve3(new THREE.Vector3(-6,.3,z),new THREE.Vector3(5,.3,z));mesh(scene,new THREE.TubeGeometry(curve,1,.045,5,false),glass);for(let i=0;i<2;i++){const packet=mesh(scene,new THREE.SphereGeometry(.12,8,6),glass);signals.push({packet,curve,offset:i/2});}}
 const skyGeo=new THREE.BufferGeometry(),stars=[];for(let i=0;i<280;i++)stars.push(Math.cos(i*2.4)*110,10+i%80,Math.sin(i*2.4)*110);skyGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));const sky=new THREE.Points(skyGeo,new THREE.PointsMaterial({color:'#9edbd7',size:.25}));scene.add(sky);
 scene.updateMatrixWorld(true);const bounds=new THREE.Box3(),excluded=new Set([...markers.map(m=>m.gem),...signals.map(s=>s.packet)]),cameraOccluders=meshes.filter(m=>!excluded.has(m)&&bounds.setFromObject(m).max.y>.3);
 let previous='';function setTheme(theme,low){const key=theme+low;if(key===previous)return;previous=key;const night=theme!=='light';materials.forEach(({m,color})=>{m.color.copy(color);if(night)m.color.lerp(new THREE.Color('#173845'),.5);});glass.emissiveIntensity=night?1.3:.12;lights.forEach((l,i)=>l.visible=night&&(!low||i<2));sky.visible=night;sky.geometry.setDrawRange(0,low?100:280);}
 return {stationGroups,markers,doors,trees,lamps,signals,colliders:Q4.stations.map(stationCollider),cameraOccluders,setTheme};
}
