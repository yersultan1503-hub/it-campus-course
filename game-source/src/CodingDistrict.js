import * as THREE from 'three';
import {Q2} from './districts/q2.js';
import {stationCollider} from './districts/q1.js';
import {districtBoxGeometry} from './districtMaterials.js';
export function buildCodingDistrict(scene,lessons,sign){
 const meshes=[],materials=new Map(),stationGroups=[],markers=[],doors=[],trees=[],lamps=[],signals=[];
 const mat=(color,metalness=0)=>{const key=color+metalness;if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.4:.85}));return materials.get(key);};
 function mesh(geometry,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);meshes.push(m);return m;}
 const box=(parent,w,h,d,color,x=0,y=0,z=0)=>mesh(districtBoxGeometry(w,h,d),mat(color),parent,x,y,z);
 function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
 const windowMaterial=new THREE.MeshStandardMaterial({color:'#b8a898',emissive:'#d8b7ff',emissiveIntensity:1.2,roughness:.3}),flowMaterial=new THREE.MeshBasicMaterial({color:'#e7ab55',toneMapped:false});
 box(scene,45,.5,39,'#635d72',0,-.35,0);box(scene,44,.1,38,'#b0a7a5',0,-.05,0);
 box(scene,130,.15,130,'#929779',0,-.8,0);
 // A zigzag boulevard and circular code forum, unlike Q1's fibre grid.
 for(const [x,z,w,d] of [[-5,0,3,29],[5,0,3,26],[0,-3,14,3],[0,6,14,3]])box(scene,w,.08,d,'#dad4c7',x,.04,z);
 const forum=mesh(new THREE.CylinderGeometry(3.2,3.2,.15,40),mat('#b9ad9e'),scene,0,.075,1);forum.name='code-forum';
 const ring=mesh(new THREE.TorusGeometry(2.8,.06,6,48),flowMaterial,scene,0,.17,1);ring.rotation.x=Math.PI/2;
 for(const x of [-2,2]){const gate=group(scene,x,0,1);box(gate,.3,2.8,.3,'#69566e',0,1.4,0);sign(gate,x<0?'{':'}',1.5,2,0,1.7,.2,'#4b3d59');}
 const path=new THREE.CurvePath();for(const [a,b] of [[[-6,.15,-7],[-5,.15,-3]],[[-5,.15,-3],[5,.15,-3]],[[5,.15,-3],[5,.15,6]],[[5,.15,6],[-5,.15,6]]])path.add(new THREE.LineCurve3(new THREE.Vector3(...a),new THREE.Vector3(...b)));
 mesh(new THREE.TubeGeometry(path,50,.055,6,false),flowMaterial,scene);for(let i=0;i<4;i++){const packet=mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshBasicMaterial({color:'#f6e5bd'}),scene);signals.push({packet,curve:path,offset:i/4});}
 Q2.stations.forEach((s,i)=>{const lesson=lessons[i],g=group(scene,s.position[0],0,s.position[1]);g.rotation.y=s.rotation;g.userData.station=i;g.userData.kind=s.kind;stationGroups.push(g);box(g,s.width+.4,.2,s.depth+.4,'#776f7e',0,.1,0);
  if(i===0){box(g,7,3.2,5,'#c3b9a8',0,1.8,0);const roof=box(g,7.4,.2,5.6,'#68536a',0,3.6,0);roof.rotation.z=.12;sign(g,'f(x)',2,1.2,0,4.4,0,'#68536a');}
  if(i===1){for(const x of [-2.1,2.1])box(g,2.8,3.4,5,'#a69baf',x,1.9,0);box(g,4,1.2,2,'#6f5c88',0,3.5,0);for(const x of [-1.2,0,1.2])mesh(new THREE.CylinderGeometry(.18,.18,.45,12),mat('#d9af66'),g,x,4.2,0);}
  if(i===2){box(g,4.8,4.5,4.5,'#b6aaa1',0,2.5,0);for(let j=0;j<3;j++)box(g,5.4,.2,5,'#587a73',0,1.4+j*1.5,0);sign(g,'return',3.8,.8,0,5.5,0,'#587a73');}
  if(i===3){box(g,7,2.8,5,'#aa9b91',0,1.6,0);for(const x of [-2.3,0,2.3]){box(g,1.5,1.4,.25,'#545663',x,3.6,0);sign(g,x===0?'✓':'test',1.2,.8,x,3.6,.15,'#4c5e57');}}
  if(i===4){for(let level=0;level<4;level++)box(g,6-level*.9,1.1,4.5-level*.6,level%2?'#8c799f':'#b7a7b8',-.25*level,.8+level*1.1,-.25*level);sign(g,'↻',2.2,1.5,0,5.4,0,'#695475');}
  for(const side of [-1,1])for(let z=-1.4;z<=1.4;z+=1.4){const pane=mesh(new THREE.PlaneGeometry(1,1.15),windowMaterial,g,side*(s.width/2+.06),1.9,z);pane.rotation.y=side*Math.PI/2;}
  for(let x=-2.4;x<=2.4;x+=1.2)mesh(new THREE.PlaneGeometry(.85,1.15),windowMaterial,g,x,1.9,s.depth/2+.1);
  sign(g,lesson.short,Math.min(4,s.width-1),.65,0,3.05,s.depth/2+.2,'#514157');
  const hinge=group(g,-.5,1.2,s.depth/2+.18);box(hinge,1,2,.08,'#655c67',.5,0,0);doors.push({hinge,i});
  const height=i===4?7.1:6.6,marker=group(scene,s.position[0],height,s.position[1]);const gem=mesh(new THREE.OctahedronGeometry(.25),new THREE.MeshStandardMaterial({color:lesson.color,emissive:lesson.color,emissiveIntensity:.3}),marker);markers.push({g:marker,gem,i,height});
 });
 // Rounded broadleaf canopies and pale rock gardens replace Q1's pine forest.
 for(const side of [-1,1])for(let i=0;i<8;i++){const x=side*(23+(i%2)*2),z=-16+i*4.5,g=group(scene,x,0,z);trees.push(g);mesh(new THREE.CylinderGeometry(.13,.2,2.6,7),mat('#87775f'),g,0,1.2,0);for(const dx of [-.6,.5]){const crown=mesh(new THREE.IcosahedronGeometry(1.2,2),mat(i%2?'#a4a06c':'#69866e'),g,dx,3.1,0);crown.scale.set(1,1.25,.85);}for(const dx of [-1,1]){const rock=mesh(new THREE.IcosahedronGeometry(.6,0),mat('#c0b8a8'),scene,x+dx,.1,z+1);rock.scale.y=.6;}}
 const lights=[];for(const [x,z] of [[-6,-7],[6,-5],[-5,7],[5,7]]){const lamp=group(scene,x,0,z);lamps.push(lamp);box(lamp,.12,2.2,.12,'#625568',0,1.1,0);mesh(new THREE.SphereGeometry(.19,8,6),flowMaterial,lamp,0,2.4,0);const light=new THREE.PointLight('#d9b7ff',16,11,2);light.position.set(x,2.5,z);scene.add(light);lights.push(light);}
 const skyGeometry=new THREE.BufferGeometry(),stars=[];for(let i=0;i<400;i++){const a=i*2.39996,y=.03+(i%89)/100;stars.push(Math.cos(a)*110,y*100,Math.sin(a)*110);}skyGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));const sky=new THREE.Points(skyGeometry,new THREE.PointsMaterial({color:'#d0b8f1',size:.3,transparent:true,opacity:.8,toneMapped:false}));scene.add(sky);
 scene.updateMatrixWorld(true);const decoration=new Set([...signals.map(s=>s.packet),...markers.map(m=>m.gem)]),bounds=new THREE.Box3(),cameraOccluders=meshes.filter(m=>!decoration.has(m)&&bounds.setFromObject(m).max.y>.3);
 const bases=[...materials.values()].map(m=>({m,color:m.color.clone()}));let last='';
 function setTheme(theme,low){const key=theme+low;if(key===last)return;last=key;const night=theme!=='light';bases.forEach(({m,color})=>{m.color.copy(color);if(night)m.color.lerp(new THREE.Color('#30263f'),.6);});windowMaterial.emissiveIntensity=night?1.5:.1;flowMaterial.color.set(night?'#e9b560':'#a7753f');lights.forEach((l,i)=>{l.visible=night&&(!low||i<2);});sky.visible=night;sky.geometry.setDrawRange(0,low?150:400);}
 return {stationGroups,markers,doors,trees,lamps,signals,colliders:Q2.stations.map(stationCollider),cameraOccluders,setTheme};
}
