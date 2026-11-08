import { studentFootPose } from './studentGait';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { campusAudio } from './campusAudio';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LESSONS } from './content';
import { createCameraActions, wheelIntent } from './cameraControls';
import { movementKey, slideMove } from './movement';
import { animateWalk } from './walkAnimation';

export function World({ follow, artifacts, started, selected, completed, low, reduced, paused, onSelect, onNear, onReady, onStart, cameraRef }) {
 const host=useRef(null), engine=useRef(null), props=useRef({follow,artifacts,started,selected,completed,low,reduced,paused,onSelect,onNear,onReady,onStart});
 props.current={follow,artifacts,started,selected,completed,low,reduced,paused,onSelect,onNear,onReady,onStart};
 const [failure,setFailure]=useState(false);
 useEffect(()=>{
  const el=host.current;let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{setFailure(true);props.current.onReady();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(el.clientWidth,el.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Кейіпкерлері мен сегіз оқу аймағы бар 3D кампус');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#b7c8d5');scene.fog=new THREE.Fog('#b7c8d5',65,150);
  const camera=new THREE.PerspectiveCamera(55,el.clientWidth/el.clientHeight,.1,160);camera.position.set(25,24,31);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.6,1);controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.65;controls.panSpeed=.8;controls.zoomSpeed=.85;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.06;controls.minDistance=2.2;controls.maxDistance=80;controls.enablePan=true;controls.screenSpacePanning=false;controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};controls.update();
  const cameraActions=createCameraActions(camera,controls,()=>el.clientHeight);cameraRef.current=cameraActions;
  function wheel(e){if(props.current.paused)return;const intent=wheelIntent(e,el.clientHeight);if(intent.zoom)return;e.preventDefault();e.stopImmediatePropagation();cameraActions.pan(intent.x,intent.y);}
  renderer.domElement.addEventListener('wheel',wheel,{capture:true,passive:false});
  scene.add(new THREE.HemisphereLight('#edf5ff','#8b9183',2.0));
  const sun=new THREE.DirectionalLight('#ffdfb5',3.0);sun.position.set(-18,19,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=24;sun.shadow.camera.bottom=-24;sun.shadow.normalBias=.04;scene.add(sun);
  const back=new THREE.DirectionalLight('#b8d0eb',.65);back.position.set(12,10,-20);scene.add(back);
  let disposed=false;const textureLoader=new THREE.TextureLoader();
  function surface(name,color=false,repeat=1){const t=textureLoader.load('./assets/'+name+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;return t;}
  const pavingMaterial=new THREE.MeshStandardMaterial({color:'#ced5d5',normalMap:surface('paving-normal',false,2),roughnessMap:surface('paving-rough',false,2),normalScale:new THREE.Vector2(.45,.45),roughness:1});
  const facadeMaterial=new THREE.MeshStandardMaterial({color:'#d2c9b7',normalMap:surface('paving-normal',false,1),normalScale:new THREE.Vector2(.12,.12),roughness:.9});
  const glassMaterial=new THREE.MeshPhysicalMaterial({color:'#416373',metalness:.45,roughness:.12,clearcoat:1,clearcoatRoughness:.12});
  const mats={};function mat(color,metal=0,rough=.7){const k=color+metal+rough;return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough}));}
  function mesh(g,m,p,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
  function box(p,w,h,d,c,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),h<.3&&w>2&&d>2?pavingMaterial:c==='#e8d7b5'?facadeMaterial:c==='#49616b'?glassMaterial:mat(c),p,x,y,z);}
  function cylinder(p,r1,r2,h,c,x=0,y=0,z=0,n=16){return mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat(c),p,x,y,z);}
  function sphere(p,r,c,x=0,y=0,z=0){return mesh(new THREE.SphereGeometry(r,16,12),mat(c),p,x,y,z);}
  function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
  function sign(p,text,w=2.7,h=1.8,x=0,y=2,z=1.8,bg='#163047'){
   const can=document.createElement('canvas');can.width=512;can.height=256;const c=can.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,256);c.fillStyle='#f5f5e9';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${text.length>5?65:125}px Arial`;c.fillText(text,256,135,480);const t=new THREE.CanvasTexture(can);t.colorSpace=THREE.SRGBColorSpace;const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}),p,x,y,z);o.castShadow=false;return o;
  }
  // Actual geometric campus: limestone architecture, tiled walkways and water.
  box(scene,35,1.5,34,'#b5a898',0,-1.05,0);box(scene,34,.26,33,'#e4d9bf',0,-.2,0);
  const ground=box(scene,150,.2,150,'#b7ccba',0,-1.9,0);ground.material=mat('#65925c',0,1);ground.castShadow=false;
  box(scene,3.9,.11,32,'#f4e5c7',0,.015,0);box(scene,32,.11,3.8,'#f4e5c7',0,.015,0);
  const ring=new THREE.Mesh(new THREE.RingGeometry(4.3,6.5,64),mat('#eddfc5'));ring.rotation.x=-Math.PI/2;ring.position.y=.03;ring.receiveShadow=true;scene.add(ring);
  // Paving seams on the real walkway surface.
  for(let j=-15;j<=15;j++){box(scene,3.7,.015,.025,'#d8c6a9',0,.08,j);box(scene,.025,.015,3.7,'#d8c6a9',j,.08,0);}
  for(let a=0;a<8;a++){const theta=a*Math.PI/4;const path=box(scene,2.5,.09,9.5,'#ecddc1',Math.sin(theta)*8,.01,Math.cos(theta)*8);path.rotation.y=theta;}
  // Reflective side canals, stone parapets and bridges.
  const waterMat=new THREE.MeshPhysicalMaterial({color:'#42a9b2',metalness:.3,roughness:.17,transparent:true,opacity:.9});
  for(const x of [-15.2,15.2]){box(scene,1.8,.3,30,'#ab9f86',x,-.08,0);mesh(new THREE.BoxGeometry(1.55,.04,30),waterMat,scene,x,.1,0);for(const dx of [-1,1])box(scene,.2,.4,30,'#eee3cb',x+dx,.18,0);for(const z of [-7,0,7]){box(scene,2.7,.25,2.2,'#f6e9d0',x,.45,z);for(const dz of [-1.05,1.05]){box(scene,2.8,.12,.12,'#eee0bd',x,1.1,z+dz);for(let j=-1;j<=1;j++)box(scene,.12,.7,.12,'#e9dbc2',x+j,.72,z+dz);}}}
  // Central fountain with a rotating three-dimensional globe.
  cylinder(scene,4.4,4.5,.35,'#d2bea0',0,.16,0,64);cylinder(scene,4.03,4.03,.1,'#518e94',0,.38,0,64);
  const water=mesh(new THREE.CircleGeometry(3.95,64),waterMat,scene,0,.45,0);water.rotation.x=-Math.PI/2;
  cylinder(scene,1.15,1.5,.65,'#d4c4a2',0,.7,0,32);cylinder(scene,.46,.7,1.3,'#c2ad87',0,1.3,0,24);
  const globe=group(scene,0,2.55,0);const ball=sphere(globe,1.05,'#417d94');ball.material=mat('#417d94',.45,.25);
  const wire=new THREE.Mesh(new THREE.SphereGeometry(1.065,12,8),new THREE.MeshBasicMaterial({color:'#f5c870',wireframe:true,transparent:true,opacity:.8}));globe.add(wire);
  for(const ang of [0,.55,-.55]){const r=mesh(new THREE.TorusGeometry(1.6,.033,8,80),mat('#e6bb64',.6,.3),globe);r.rotation.x=Math.PI/2;r.rotation.z=ang;}
  const ripples=[];for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.RingGeometry(1.8+i*.55,1.825+i*.55,64),new THREE.MeshBasicMaterial({color:'#cdf6e9',transparent:true,opacity:.3,side:THREE.DoubleSide}));m.rotation.x=-Math.PI/2;m.position.y=.462;scene.add(m);ripples.push(m);}
  const stationGroups=[],markers=[],doors=[],trees=[],lamps=[];let clubSign=null,lastTitle=null;const colliders=[];
  function building(l,i){
   const [x,z]=l.position;const g=group(scene,x,0,z);g.userData.station=i;stationGroups.push(g);colliders.push({x,z,r:2.6});
   // Face the central plaza.
   g.rotation.y=Math.atan2(-x,-z);
   box(g,5.25,.3,4.6,'#d5c09d',0,.15,0);box(g,4.8,.35,4.25,'#eee1c5',0,.45,0);
   box(g,4.4,3.3,3.9,'#e8d7b5',0,2.15,0);box(g,4.6,.18,4.05,'#cdbb9b',0,3.9,0);box(g,4.85,.22,4.3,'#f0e4ca',0,4.1,0);
   box(g,4.1,.24,3.55,'#d4c4a7',0,4.32,0);box(g,3.85,.1,3.35,'#6e8791',0,4.48,0);
   for(const sx of [-1.96,1.96]){for(const sz of [-1.68,1.68]){cylinder(g,.17,.21,2.93,'#f7ebd2',sx,2.28,sz,12);box(g,.5,.15,.5,'#cbb792',sx,.77,sz);box(g,.5,.18,.5,'#f7ead0',sx,3.76,sz);}}
   for(const sx of [-1,1]){box(g,.55,1.6,.05,'#49616b',sx,2.1,1.98);box(g,.035,1.7,.09,'#dda952',sx,2.1,2.02);box(g,.6,.04,.09,'#d7b272',sx,2.15,2.02);}
   const hinge=group(g,-.475,1.6,1.99);box(hinge,.95,1.6,.06,'#162e3b',.475,0,0);doors.push({hinge,i});box(g,.88,.04,.08,'#ecc876',0,1.9,2.04);
   for(let k=0;k<3;k++)box(g,2.1,.18,1.1-k*.2,'#eddfc2',0,.09+k*.18,2.48-k*.1);
   const facadeSign=sign(g,l.short==='Сілтеме'?'LINK':l.short==='Кесте'?'TABLE':l.short==='Медиа'?'MEDIA':l.short==='Тест'?'TEST':l.short,2.75,1.42,0,3,2.06);
   if(i===0)clubSign=facadeSign;
   // Gold facade light strips.
   for(const sx of [-2.12,2.12]){const m=box(g,.055,3.1,.055,l.color,sx,2.24,2.01);m.material=new THREE.MeshStandardMaterial({color:l.color,emissive:l.color,emissiveIntensity:.5});}
   // Distinct roof sculptures communicate each lesson from all camera angles.
   const sculpture=group(g,0,4.65,0);
   if(i===0){const laptop=group(sculpture);box(laptop,2.4,.13,1.65,'#253e4e',0,.05,0);const screen=box(laptop,2.25,1.4,.12,'#1c364c',0,.75,-.65);screen.rotation.x=-.2;sign(laptop,'</>',1.8,.9,0,.78,-.55);}
   else if(i===1){for(let a=0;a<3;a++)for(let b=0;b<3;b++)box(sculpture,.52,.35,.52,a===0?'#3aa68e':'#b5e1d0',(a-1)*.66,.2+b*.4,0);}
   else if(i===2){for(const a of [-.5,.5]){const t=mesh(new THREE.TorusGeometry(.55,.12,12,28),mat('#6ca6d2',.45),sculpture,a,.7,0);t.rotation.y=.5;}}
   else if(i===3){box(sculpture,2,1.35,.15,'#273c50',-.2,.7,0);box(sculpture,.65,1,.18,'#8eb9c9',.75,.45,.4);}
   else if(i===4){const s=cylinder(sculpture,.7,.7,.16,'#c67554',0,.65,0,32);s.rotation.x=Math.PI/2;const tri=new THREE.Shape();tri.moveTo(-.23,-.33);tri.lineTo(.37,0);tri.lineTo(-.23,.33);tri.closePath();const m=mesh(new THREE.ShapeGeometry(tri),mat('#fff3df'),sculpture,0,.65,.13);}
   else if(i===5){const m=box(sculpture,1.6,1.45,.2,'#efbe4d',0,.7,0);sign(sculpture,'JS',1.2,.8,0,.72,.12,'#b47b23');}
   else if(i===6){box(sculpture,1.5,1.7,.18,'#498782',0,.75,0);for(let a=0;a<3;a++)box(sculpture,.9,.08,.06,'#cce8cf',.12,1.25-a*.4,.12);}
   else{for(let k=0;k<3;k++)cylinder(sculpture,.77,.77,.38,'#6485a2',0,.25+k*.43,0,24);}
   const marker=group(scene,x,7,z);const gem=mesh(new THREE.OctahedronGeometry(.31),new THREE.MeshStandardMaterial({color:l.color,emissive:l.color,emissiveIntensity:.4,metalness:.2}),marker);markers.push({g:marker,gem,i});
  }
  LESSONS.forEach(building);
  function tree(x,z,scale=1,type=0){const g=group(scene,x,0,z);trees.push(g);g.scale.setScalar(scale);cylinder(g,.1,.17,1.4,'#78674e',0,.7,0,7);if(type){for(let k=0;k<3;k++)cylinder(g,0,1-k*.15,1.65,'#3b6e59',0,1.65+k*.7,0,7);}else{for(const [a,b,c,r] of [[0,2.1,0,.9],[-.35,1.7,.3,.7],[.4,1.8,-.2,.65]]){const o=mesh(new THREE.IcosahedronGeometry(r,2),mat(type===2?'#d8b15c':'#496443'),g,a,b,c);}}}
  let seed=372;function rand(){seed=(seed*16807)%2147483647;return seed/2147483647;}
  for(let i=0;i<70;i++){let x=(rand()-.5)*31,z=(rand()-.5)*30;if(Math.abs(x)<3||Math.abs(z)<2.5||Math.hypot(x,z)<6.4||colliders.some(p=>Math.hypot(x-p.x,z-p.z)<3.5))continue;tree(x,z,.7+rand()*.6,i%3===0?1:0);}
  for(let i=0;i<35;i++){const a=rand()*Math.PI*2;tree(Math.cos(a)*(20+rand()*7),Math.sin(a)*(21+rand()*8),1+rand(),i%2);}
  const flowerColors=['#e76091','#f1be43','#af8add','#eaf0e8'];
  const gardens=[[-12,0],[12,0],[-12,-12],[12,12],[-12,12],[12,-12],[5,5],[-5,-5]];
  const bladeGeometry=new THREE.ConeGeometry(.045,.42,4);
  const bladeMat=mat('#477d3c',0,1);
  const grass=new THREE.InstancedMesh(bladeGeometry,bladeMat,gardens.length*70);grass.receiveShadow=true;scene.add(grass);
  const dummy=new THREE.Object3D();let bladeIndex=0;
  gardens.forEach(([x,z],bed)=>{
   const lawn=cylinder(scene,1.65,1.7,.09,'#689b50',x,.09,z,32);lawn.receiveShadow=true;
   const border=mesh(new THREE.TorusGeometry(1.69,.055,6,48),mat('#c9cfbf'),scene,x,.14,z);border.rotation.x=Math.PI/2;
   for(let i=0;i<70;i++){const angle=rand()*Math.PI*2,r=Math.sqrt(rand())*1.55;
    dummy.position.set(x+Math.cos(angle)*r,.22,z+Math.sin(angle)*r);dummy.rotation.set(0,rand()*Math.PI,.12*(rand()-.5));dummy.scale.setScalar(.55+rand()*.75);dummy.updateMatrix();grass.setMatrixAt(bladeIndex++,dummy.matrix);
   }
   for(let i=0;i<9;i++){const a=i*2.399,r=.4+rand()*.85,fx=x+Math.cos(a)*r,fz=z+Math.sin(a)*r;
    const stem=cylinder(scene,.018,.022,.34,'#397449',fx,.29,fz,5);
    const flower=group(scene,fx,.48,fz);
    for(let petal=0;petal<5;petal++){const t=petal*Math.PI*2/5;const pet=sphere(flower,.085,flowerColors[(bed+i)%4],Math.cos(t)*.09,0,Math.sin(t)*.09);pet.scale.y=.38;pet.castShadow=false;}
    sphere(flower,.047,'#f6d16a',0,.025,0);
   }
  });grass.instanceMatrix.needsUpdate=true;
  function lamp(x,z){const g=group(scene,x,0,z);lamps.push(g);cylinder(g,.055,.08,1.9,'#344842',0,.95,0,8);box(g,.25,.4,.25,'#e9bd60',0,2,0);const bulb=sphere(g,.13,'#fff4b8',0,2.06,0);bulb.material=new THREE.MeshStandardMaterial({color:'#fff3ae',emissive:'#ffd76d',emissiveIntensity:1.2});box(g,.38,.08,.38,'#334b43',0,2.27,0);}
  for(const z of [-12,-7,7,12])for(const x of [-2.35,2.35])lamp(x,z);for(const x of [-12,-7,7,12])for(const z of [-2.3,2.3])lamp(x,z);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;const g=group(scene,Math.sin(a)*6.7,0,Math.cos(a)*6.7);g.rotation.y=a;box(g,1.3,.1,.4,'#876d51',0,.55,0);box(g,1.3,.45,.08,'#876d51',0,.84,-.2);for(const x of [-.5,.5])box(g,.08,.5,.4,'#3d5046',x,.25,0);}
  // Articulated hips, knees, ankles, shoulders and elbows share a distance-driven gait.
  function person(x,z,color='#244c70',scale=1,variant=0){
   const g=group(scene,x,.1,z);g.scale.setScalar(scale);const rig=group(g),body=group(rig,0,.78,0);
   const skin=['#c7936b','#edbd98','#986549','#d4a57c'][variant%4],hairColor=['#292c2b','#624334','#b18a57','#382d35'][variant%4];
   const shirt=cylinder(body,.23,.25,.6,color,0,.12,0,12);shirt.scale.z=.7;
   if(variant%3!==1){box(body,.32,.36,.14,['#c99042','#344f64','#986f84'][variant%3],0,.12,-.23);for(const x of [-.13,.13])box(body,.045,.46,.04,'#d2c8b4',x,.14,.15);}
   const head=sphere(body,.205,skin,0,.73,0);head.scale.y=1.15;
   if(variant%4===0){cylinder(body,.23,.23,.10,color,0,.94,0,14);box(body,.28,.035,.24,color,0,.9,.18);}
   if(variant%4===1){const pony=sphere(body,.12,hairColor,0,.76,-.23);pony.scale.y=1.7;}
   if(variant%4===2){for(const x of [-.08,.08]){const lens=box(body,.13,.075,.035,'#26343f',x,.76,.196);}box(body,.05,.02,.035,'#26343f',0,.76,.2);}
   if(variant%4===3){const hairBack=sphere(body,.19,hairColor,0,.65,-.09);hairBack.scale.set(1,1.5,.8);}
   box(body,.09,.09,.02,'#f2ede0',.12,.23,.17);

   const hair=sphere(body,.211,hairColor,0,.83,-.04);hair.scale.set(1,.62,.95);for(const ex of [-.083,.083])sphere(body,.022,'#26353c',ex,.76,.224);
   const arms=[],elbows=[],legs=[],knees=[],feet=[];
   for(const side of [-1,1]){
    const arm=group(body,side*.34,.32,0);cylinder(arm,.075,.085,.27,color,0,-.135,0,10);const elbow=group(arm,0,-.27,0);cylinder(elbow,.065,.075,.23,variant%2?skin:color,0,-.115,0,10);sphere(elbow,.075,skin,0,-.27,0);arms.push(arm);elbows.push(elbow);
    const hip=group(rig,side*.13,.72,0);box(hip,.2,.32,.23,'#3c4655',0,-.16,0);const knee=group(hip,0,-.32,0);box(knee,.18,.32,.22,'#3c4655',0,-.16,0);const foot=group(knee,0,-.32,0);box(foot,.23,.12,.38,'#f7f4e7',0,-.02,.07);legs.push(hip);knees.push(knee);feet.push(foot);
   }
   return {g,rig,body,arms,elbows,legs,knees,feet,walkDistance:0,walkBlend:0};
  }
  const player=person(-1.8,13,'#264c6e',1.17);player.g.rotation.y=Math.PI;const target=new THREE.Vector3(-1.8,0,13);
  const shadowRing=mesh(new THREE.RingGeometry(.5,.6,32),new THREE.MeshBasicMaterial({color:'#4ee9ff',transparent:true,opacity:.8,side:THREE.DoubleSide}),scene,-1.8,.14,13);shadowRing.rotation.x=-Math.PI/2;
  const robot=group(scene,-.2,2.1,12.6);robot.scale.setScalar(.55);const rb=box(robot,.7,.5,.45,'#e9b441',0,0,0);rb.geometry=new THREE.BoxGeometry(.7,.5,.45);box(robot,.55,.31,.05,'#133c4d',0,.02,.26);for(const x of [-.15,.15]){const eye=sphere(robot,.055,'#66e2e3',x,.04,.3);eye.material=new THREE.MeshBasicMaterial({color:'#73ebed'});}for(const x of [-.45,.45])sphere(robot,.16,'#e0a641',x,-.05,0);cylinder(robot,.04,.04,.18,'#d5a647',0,.36,0,8);sphere(robot,.075,'#77d9d4',0,.49,0);
  const bots=[];for(let i=0;i<3;i++){const a=i/3*Math.PI*2;const p=person(Math.sin(a)*6,Math.cos(a)*6,['#397d91','#d78b52','#7968ae','#65925b','#bd627c','#e0bb58','#5479ab','#e2d9c5'][i], [.99,1.08,.94,1.12,1.02,.96,1.06,1][i],i);bots.push({...p,a,speed:.85+i*.065});}
  const actorMaterials=[];const actors=[];
  // Authored VRoid students: distinct faces, hairstyles and civilian outfits.
  const students=[];
  const studentLoader=new GLTFLoader();studentLoader.register(parser=>new VRMLoaderPlugin(parser));
  bots.forEach((person,index)=>{
   person.rig.visible=false;
   studentLoader.load('./assets/student-'+['A','B','C'][index]+'.vrm',gltf=>{
    const vrm=gltf.userData.vrm;
    if(disposed){VRMUtils.deepDispose(vrm.scene);return;}
    VRMUtils.rotateVRM0(vrm);
    VRMUtils.removeUnnecessaryVertices(vrm.scene);
    vrm.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    person.g.scale.setScalar([1.12,1.04,1.08][index]);person.g.add(vrm.scene);
    const bone=name=>vrm.humanoid.getNormalizedBoneNode(name);
    vrm.scene.updateMatrixWorld(true);
    const point=name=>bone(name).getWorldPosition(new THREE.Vector3());
    const thigh=point('leftUpperLeg').distanceTo(point('leftLowerLeg'))/person.g.scale.y;
    const shin=point('leftLowerLeg').distanceTo(point('leftFoot'))/person.g.scale.y;
    const hips=bone('hips'),restHipY=hips.position.y;
    students.push({vrm,person,bone,phase:index*2,distance:index*.3,blend:0,thigh,shin,hips,restHipY});
   },undefined,()=>{person.rig.visible=true;});
  });

  // Three additional authored characters, spaced between the students.
  const visitors=[];
  [
   {file:'campus-robot.glb',scale:.43,turn:0,idle:'Idle',walk:'Walking',speed:.7},
   {file:'campus-fox.glb',scale:.014,turn:0,idle:'Survey',walk:'Walk',speed:1.0},
   {file:'campus-guide.glb',scale:1,turn:Math.PI,idle:'Idle',walk:'Walk',speed:.8}
  ].forEach((config,index)=>{
   const a=(index+.5)/3*Math.PI*2,g=group(scene,Math.sin(a)*6.05,.1,Math.cos(a)*6.05);
   const visitor={g,a,speed:config.speed,actualSpeed:0};visitors.push(visitor);
   new GLTFLoader().load('./assets/'+config.file,gltf=>{
    if(disposed){VRMUtils.deepDispose(gltf.scene);return;}
    const model=gltf.scene;model.scale.setScalar(config.scale);model.rotation.y=config.turn;g.add(model);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    const mixer=new THREE.AnimationMixer(model),actions={};
    for(const [name,clipName] of Object.entries({Idle:config.idle,Walk:config.walk})){
     const clip=gltf.animations.find(c=>c.name===clipName);if(clip){const action=mixer.clipAction(clip);action.play();action.setEffectiveWeight(name==='Idle'?1:0);actions[name]=action;}
    }
    actors.push({person:visitor,mixer,actions,walkSpeed:config.speed});
   },undefined,()=>console.warn('Campus character could not load:',config.file));
  });
  new GLTFLoader().load('./assets/campus-guide.glb',gltf=>{
   if(disposed)return;
   [player].forEach((person,index)=>{
    const model=cloneSkeleton(gltf.scene);const palette=['#45c9e8','#c67352','#7799db','#8aa960','#bd80bb','#e4b85b','#59ad9c','#cf7378','#8995b4'];
    const sizes=[1.04,.92,1.08,.98,1.02,.88,1.12,.95,1.06];
    model.scale.set(sizes[index]*(index%3===0?1.07:.96),sizes[index],sizes[index]);model.position.y=0;model.rotation.y=Math.PI;
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;
     o.material=o.material.clone();actorMaterials.push(o.material);
     const visor=/visor/i.test(o.material.name);
     if(!visor){o.material.color.set(palette[index]);o.material.roughness=.65;o.material.metalness=.12;
      if(index===0){o.material.emissive.set('#126a84');o.material.emissiveIntensity=.24;}
     }else{o.material.color.set(index===0?'#4ce7ff':['#e7c477','#a8d0e4','#bde0c7'][index%3]);o.material.metalness=.65;o.material.roughness=.2;}
    }});
    person.rig.visible=false;person.g.add(model);
    const mixer=new THREE.AnimationMixer(model),actions={};
    for(const name of ['Idle','Walk','Run']){const clip=gltf.animations.find(c=>c.name===name);if(clip){actions[name]=mixer.clipAction(clip);actions[name].play();actions[name].setEffectiveWeight(name==='Idle'?1:0);}}
    actors.push({person,mixer,actions,blend:0,index});
   });
  },undefined,()=>{ /* Keep the existing articulated avatar if the model cannot load. */ });
  const keys=new Set(),tapUntil=new Map();let sprint=false,speed=0,stepDistance=0;let pointerStart=null,keyboardMove=false;const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.12);
  function keydown(e){if(e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')||props.current.paused)return;if(e.code==='ShiftLeft'||e.code==='ShiftRight')sprint=true;const key=movementKey(e);if(key){e.preventDefault();if(!keys.has(key))tapUntil.set(key,performance.now()+130);keys.add(key);if(!props.current.started)props.current.onStart();}}
  function keyup(e){if(e.code==='ShiftLeft'||e.code==='ShiftRight')sprint=false;const key=movementKey({...e,code:e.code,key:e.key,ctrlKey:false,metaKey:false,altKey:false});if(key)keys.delete(key);}
  function down(e){if(!e.isPrimary){if(pointerStart)pointerStart.dragged=true;return;}pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId,dragged:false};}
  function move(e){if(pointerStart&&Math.hypot(pointerStart.x-e.clientX,pointerStart.y-e.clientY)>7)pointerStart.dragged=true;}
  function cancel(){pointerStart=null;}
  function up(e){const start=pointerStart;pointerStart=null;if(!start||start.id!==e.pointerId||start.dragged||e.ctrlKey||e.shiftKey||e.metaKey||Math.hypot(start.x-e.clientX,start.y-e.clientY)>7||e.button!==0||props.current.paused)return;const r=el.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(stationGroups,true);if(hits.length){let o=hits[0].object;while(o&&o.userData.station===undefined)o=o.parent;if(o){props.current.onSelect(o.userData.station);const l=LESSONS[o.userData.station];target.set(l.position[0]*.64,0,l.position[1]*.64);}return;}const p=new THREE.Vector3();if(raycaster.ray.intersectPlane(plane,p)){target.set(THREE.MathUtils.clamp(p.x,-13.5,13.5),0,THREE.MathUtils.clamp(p.z,-13.5,14));}}
  addEventListener('keydown',keydown);addEventListener('keyup',keyup);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerup',up);const blur=()=>{sprint=false;keys.clear();tapUntil.clear();cancel();};addEventListener('blur',blur);
  let focusTarget=null,focusPosition=null,lastSelected=-1,lastFollow=null;const previousPlayer=new THREE.Vector3(),cameraRay=new THREE.Raycaster();const fadedMaterials=new Map();let faded=[];
  const cancelFocus=()=>{focusTarget=null;focusPosition=null;};controls.addEventListener('start',cancelFocus);
  let raf,previous=performance.now(),lastNear=-1,elapsed=0;const projected=new THREE.Vector3();
  function resize(){const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  const ro=new ResizeObserver(resize);ro.observe(el);
  engine.current={scene,renderer,camera,player,target};props.current.onReady();
  function animate(now){raf=requestAnimationFrame(animate);if(now-previous<(props.current.paused?200:1000/30))return;const dt=Math.min((now-previous)/1000,.05);previous=now;elapsed+=dt;const p=props.current;controls.enabled=!p.paused;renderer.shadowMap.enabled=!p.low;const ratio=Math.min(devicePixelRatio,p.low?1:1.6);if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
   if(p.paused){sprint=false;keys.clear();tapUntil.clear();if(keyboardMove){target.copy(player.g.position);keyboardMove=false;}}
   previousPlayer.copy(player.g.position);let movedDistance=0;
   if(p.started&&!p.paused){const pressed=key=>keys.has(key)||(tapUntil.get(key)||0)>now;let dx=Number(pressed('right'))-Number(pressed('left')),dz=Number(pressed('back'))-Number(pressed('forward'));
    if(dx||dz){const forward=camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize(),right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));const d=right.multiplyScalar(dx).addScaledVector(forward,-dz).normalize();target.copy(player.g.position).addScaledVector(d,1.2);target.y=0;keyboardMove=true;}else if(keyboardMove){target.copy(player.g.position);keyboardMove=false;}
    const diff=target.clone().sub(player.g.position);diff.y=0;const dist=diff.length();if(dist>.08){const d=diff.normalize(),step=d.clone().multiplyScalar(Math.min(dist,dt*(speed=THREE.MathUtils.damp(speed,sprint?5.1:2.1,9,dt)))),next=slideMove(player.g.position,step,colliders);movedDistance=Math.hypot(next.x-player.g.position.x,next.z-player.g.position.z);player.g.position.x=next.x;player.g.position.z=next.z;const turn=Math.atan2(d.x,d.z)-player.g.rotation.y;player.g.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*12));}
   }
   if(movedDistance<.0001)speed=0;
   player.actualSpeed=movedDistance/dt;
   if(p.started&&!p.paused){stepDistance+=movedDistance;if(stepDistance>(sprint?.85:.55)){campusAudio.step(sprint);stepDistance=0;}}
   campusAudio.ambience(Math.hypot(player.g.position.x,player.g.position.z),p.started&&!p.paused);
   animateWalk(player,movedDistance,dt,p.reduced);
   shadowRing.position.set(player.g.position.x,.14,player.g.position.z);if(!p.reduced&&!p.paused)shadowRing.rotation.z=elapsed*.3;
   robot.position.set(player.g.position.x+1.5,1.4+(p.reduced||p.paused?0:Math.sin(elapsed*2.5)*.14),player.g.position.z-.3);robot.rotation.y=player.g.rotation.y*.3;
   if(p.started&&p.selected!==lastSelected){
    const firstEntry=lastSelected===-1;lastSelected=p.selected;const [x,z]=LESSONS[p.selected].position;
    const front=new THREE.Vector3(-x,0,-z).normalize();
    const right=new THREE.Vector3(-front.z,0,front.x);
    focusTarget=new THREE.Vector3(x,1.5,z).addScaledVector(right,3);
    focusPosition=focusTarget.clone().addScaledVector(front,19);focusPosition.y=15;
    if(firstEntry){player.g.position.set(x+front.x*4,.1,z+front.z*4);target.copy(player.g.position);player.g.rotation.y=Math.atan2(-front.x,-front.z);}
   }
   if(focusTarget&&!p.paused&&!p.follow){const t=p.reduced?1:1-Math.exp(-dt*2);camera.position.lerp(focusPosition,t);controls.target.lerp(focusTarget,t);if(camera.position.distanceTo(focusPosition)<.05)cancelFocus();}
   const title=p.artifacts?.html?.title||'IT клубы';
   if(clubSign&&title!==lastTitle){lastTitle=title;const texture=clubSign.material.map,c=texture.image.getContext('2d');c.fillStyle='#163047';c.fillRect(0,0,512,256);c.fillStyle='#f5f5e9';c.textAlign='center';c.textBaseline='middle';c.font='700 58px Arial';c.fillText(title,256,128,480);texture.needsUpdate=true;}
   doors.forEach(door=>{const {hinge,i}=door;const l=LESSONS[i];const d=Math.hypot(player.g.position.x-l.position[0],player.g.position.z-l.position[1]);const open=p.started&&d<5;if(open&&!door.open&&!p.paused)campusAudio.door();door.open=open;const angle=open?-1.25:0;hinge.rotation.y=THREE.MathUtils.lerp(hinge.rotation.y,angle,p.reduced?1:.1);});
   const ambient=!p.reduced&&!p.paused;
   trees.forEach((tree,i)=>{tree.rotation.z=ambient?Math.sin(elapsed*.7+i)*.012:0;});
   if(ambient)globe.rotation.y+=dt*.13;
   bots.forEach(b=>{const old=b.g.position.clone();if(ambient){b.a+=dt*b.speed/6.05;b.g.position.set(Math.sin(b.a)*6.05,.1,Math.cos(b.a)*6.05);b.g.rotation.y=b.a+Math.PI/2;}b.actualSpeed=b.g.position.distanceTo(old)/dt;animateWalk(b,b.g.position.distanceTo(old),dt,p.reduced);});
   visitors.forEach(b=>{const old=b.g.position.clone();if(ambient){b.a+=dt*b.speed/6.05;b.g.position.set(Math.sin(b.a)*6.05,.1,Math.cos(b.a)*6.05);b.g.rotation.y=b.a+Math.PI/2;}b.actualSpeed=b.g.position.distanceTo(old)/dt;});
   students.forEach(student=>{
    const {vrm,person,bone}=student;
    const moving=p.paused?0:Math.min(1,(person.actualSpeed||0)/.7);
    student.blend=THREE.MathUtils.damp(student.blend,moving,8,dt);
    student.distance+=(p.paused?0:(person.actualSpeed||0))*dt/person.g.scale.y;
    const phase=student.distance/(student.thigh+student.shin)*Math.PI*2/1.12;
    const swing=Math.sin(phase)*.3*student.blend;
    for(const [side,sign,offset] of [['left',1,0],['right',-1,1]]){
     const pose=studentFootPose(student.distance,offset,student.thigh,student.shin);
     const leg=bone(side+'UpperLeg'),knee=bone(side+'LowerLeg'),foot=bone(side+'Foot'),arm=bone(side+'UpperArm'),elbow=bone(side+'LowerArm');
     if(leg)leg.rotation.x=pose.hip*student.blend;
     if(knee)knee.rotation.x=pose.knee*student.blend;
     if(foot)foot.rotation.x=pose.ankle*student.blend;
     if(arm)arm.rotation.set(-swing*sign*.65,0,sign*1.35);
     if(elbow)elbow.rotation.set(-.18,0,0);
     student.hips.position.y=student.restHipY-pose.hipDrop*student.blend;
    }
    const chest=bone('chest');if(chest)chest.rotation.y=Math.sin(phase)*.035*student.blend;
    const head=bone('head');if(head)head.rotation.y=p.reduced?0:Math.sin(elapsed*.55+phase*.05)*.09;
    vrm.expressionManager?.setValue('blink',p.reduced?0:Math.pow(Math.max(0,Math.sin(elapsed*1.2+phase*.03)),28));
    vrm.update(p.paused?0:dt);
   });
   actors.forEach(({person,mixer,actions,walkSpeed=1.7})=>{
    const v=p.paused?0:(person.actualSpeed||0);const moving=Math.min(v/(person===player?1.3:.3),1),running=THREE.MathUtils.clamp((v-2.4)/2.5,0,1);
    const weights={Idle:1-moving,Walk:moving*(1-running),Run:moving*running};
    for(const [name,action] of Object.entries(actions)){action.setEffectiveWeight(THREE.MathUtils.damp(action.getEffectiveWeight(),weights[name],10,dt));action.setEffectiveTimeScale(name==='Walk'?Math.max(.55,v/walkSpeed):name==='Run'?Math.max(.7,v/4.5):1);}
    mixer.update(dt);
   });
   faded.forEach(o=>{o.material=fadedMaterials.get(o).original;});faded=[];
   if(p.started&&!p.paused){
    if(lastFollow!==p.follow){lastFollow=p.follow;cancelFocus();if(p.follow){const heading=player.g.rotation.y;controls.target.copy(player.g.position).add(new THREE.Vector3(0,1.35,0));camera.position.copy(controls.target).add(new THREE.Vector3(-Math.sin(heading)*5.8,2.5,-Math.cos(heading)*5.8));}else{cameraActions.reset();}}
    if(p.follow){
     const movement=player.g.position.clone().sub(previousPlayer);if(movement.length()<2){camera.position.add(movement);controls.target.add(movement);}
     const desired=player.g.position.clone().add(new THREE.Vector3(0,1.35,0));const delta=desired.sub(controls.target);controls.target.addScaledVector(delta,.14);camera.position.addScaledVector(delta,.14);
     const direction=camera.position.clone().sub(controls.target),length=direction.length();cameraRay.set(controls.target,direction.normalize());cameraRay.far=length;const obstruction=cameraRay.intersectObjects(stationGroups,true)[0];if(obstruction&&obstruction.distance>.5)camera.position.copy(controls.target).addScaledVector(direction,Math.max(.6,obstruction.distance-.25));
     cameraRay.far=camera.position.distanceTo(controls.target);const blockers=cameraRay.intersectObjects([...lamps,...trees],true);
     for(const hit of blockers){const o=hit.object;if(!o.isMesh||faded.includes(o))continue;if(!fadedMaterials.has(o)){const material=o.material.clone();material.transparent=true;material.opacity=.12;material.depthWrite=false;fadedMaterials.set(o,{original:o.material,material});}o.material=fadedMaterials.get(o).material;faded.push(o);}
    }
   }
   let near=-1,nd=Infinity;
   markers.forEach(({g,gem,i})=>{g.position.y=6.65+(p.reduced?0:Math.sin(elapsed*2+i)*.18);gem.rotation.y+=p.reduced?0:dt*.45;const done=p.completed.includes(i);gem.material.color.set(done?'#4baf91':LESSONS[i].color);gem.material.emissive.set(done?'#318b6e':LESSONS[i].color);const scale=i===p.selected?1.4:1;gem.scale.lerp(new THREE.Vector3(scale,scale,scale),.08);const d=Math.hypot(player.g.position.x-LESSONS[i].position[0],player.g.position.z-LESSONS[i].position[1]);if(d<nd){nd=d;near=i;}
    const node=document.getElementById('station-label-'+i);if(node){projected.set(LESSONS[i].position[0],6.85,LESSONS[i].position[1]).project(camera);node.style.transform='translate(-50%, -100%) translate('+((projected.x*.5+.5)*el.clientWidth)+'px,'+((-projected.y*.5+.5)*el.clientHeight)+'px)';node.style.opacity=projected.z>1?'0':'1';}
   });
   if(nd>6.5)near=-1;if(near!==lastNear){lastNear=near;p.onNear(near);}
   controls.update();const badge=document.getElementById('player-label');if(badge){projected.copy(player.g.position).add(new THREE.Vector3(0,2.65,0)).project(camera);badge.style.transform='translate(-50%, -100%) translate('+((projected.x*.5+.5)*el.clientWidth)+'px,'+((-projected.y*.5+.5)*el.clientHeight)+'px)';badge.style.visibility=p.started&&projected.z<1&&projected.z>-1?'visible':'hidden';}renderer.render(scene,camera);
  }
  raf=requestAnimationFrame(animate);
  return()=>{disposed=true;students.forEach(({vrm})=>VRMUtils.deepDispose(vrm.scene));campusAudio.ambience(20,false);actorMaterials.forEach(m=>m.dispose());fadedMaterials.forEach(x=>x.material.dispose());actors.forEach(a=>a.mixer.stopAllAction());[pavingMaterial,facadeMaterial,glassMaterial].forEach(m=>{m.map?.dispose();m.normalMap?.dispose();m.roughnessMap?.dispose();m.dispose();});cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',keydown);removeEventListener('keyup',keyup);removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('wheel',wheel,true);cameraRef.current=null;controls.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();});Object.values(mats).forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div ref={host} className="world" role="img" aria-label="Интерактивті 3D кампус">{failure&&<div className="world-failure"><h2>Жеңіл режим іске қосылды</h2><p>Бұл браузерде WebGL ашылмады. Оқу аймағын мәзірден таңдаңыз — барлық ойын қолжетімді.</p></div>}</div>;
}
