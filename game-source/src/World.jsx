import {loadGuest} from './guestCharacters';
import { studentFootPose } from './studentGait';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { campusAudio } from './campusAudio';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createOcclusionFade} from './cameraOcclusion';
import { LESSONS } from './content';
import { createCameraActions, wheelIntent } from './cameraControls';
import { movementKey, slideMove } from './movement';
import { animateWalk } from './walkAnimation';
import {Q1,routePose,roundedPatrol} from './districts/q1';
const PATROLS=Object.fromEntries(Object.entries(Q1.routes).map(([id,route])=>[id,roundedPatrol(route)]));
import {buildNetworkDistrict} from './NetworkDistrict';

export function World({ avatar='engineer', follow, artifacts, started, selected, completed, low, reduced, paused, onSelect, onNear, onReady, onStart, cameraRef }) {
 const host=useRef(null), engine=useRef(null), props=useRef({avatar,follow,artifacts,started,selected,completed,low,reduced,paused,onSelect,onNear,onReady,onStart});
 props.current={avatar,follow,artifacts,started,selected,completed,low,reduced,paused,onSelect,onNear,onReady,onStart};
 const [failure,setFailure]=useState(false);
 useEffect(()=>{
  const el=host.current;let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{setFailure(true);props.current.onReady();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.85));renderer.setSize(el.clientWidth,el.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.92;
  el.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Байланыс зерттеу ауданы: талшықты желі, зертхана және жоспарланған аймақтар');
  const scene=new THREE.Scene();scene.background=new THREE.Color('#dce9f2');scene.fog=new THREE.Fog('#dce9f2',110,190);
  const camera=new THREE.PerspectiveCamera(55,el.clientWidth/el.clientHeight,.1,210);camera.position.set(...Q1.view.position);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(...Q1.view.target);controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.65;controls.panSpeed=.8;controls.zoomSpeed=.85;controls.maxPolarAngle=Math.PI*.485;controls.minPolarAngle=.06;controls.minDistance=2.2;controls.maxDistance=80;controls.enablePan=true;controls.screenSpacePanning=false;controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};controls.touches={ONE:THREE.TOUCH.ROTATE,TWO:THREE.TOUCH.DOLLY_PAN};controls.update();
  const cameraActions=createCameraActions(camera,controls,()=>el.clientHeight,Q1.view);cameraRef.current=cameraActions;
  function wheel(e){if(props.current.paused)return;const intent=wheelIntent(e,el.clientHeight);if(intent.zoom)return;e.preventDefault();e.stopImmediatePropagation();cameraActions.pan(intent.x,intent.y);}
  renderer.domElement.addEventListener('wheel',wheel,{capture:true,passive:false});
  scene.add(new THREE.HemisphereLight('#e4f0ff','#7b887c',1.1));
  const sun=new THREE.DirectionalLight('#fff1dc',3.1);sun.position.set(-18,19,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-30;sun.shadow.camera.right=30;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
  const back=new THREE.DirectionalLight('#c2ddf3',.4);back.position.set(12,10,-20);scene.add(back);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
  let disposed=false;
  const surfaceLoader=new THREE.TextureLoader();
  function surfaceTexture(name){const t=surfaceLoader.load('./assets/'+name+'.jpg');t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
  const surfaceTextures={normal:surfaceTexture('paving-normal'),roughness:surfaceTexture('paving-rough')};
  const mats={};function mat(color,metal=0,rough=.7){const k=color+metal+rough;return mats[k]||(mats[k]=new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough}));}
  function mesh(g,m,p,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
  function box(p,w,h,d,c,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),mat(c),p,x,y,z);}
  function cylinder(p,r1,r2,h,c,x=0,y=0,z=0,n=16){return mesh(new THREE.CylinderGeometry(r1,r2,h,n),mat(c),p,x,y,z);}
  function sphere(p,r,c,x=0,y=0,z=0){return mesh(new THREE.SphereGeometry(r,16,12),mat(c),p,x,y,z);}
  function group(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;}
  function sign(p,text,w=2.7,h=1.8,x=0,y=2,z=1.8,bg='#163047'){
   const can=document.createElement('canvas');can.width=512;can.height=256;const c=can.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,256);c.fillStyle='#f5f5e9';c.textAlign='center';c.textBaseline='middle';c.font=`700 ${text.length>5?65:125}px Arial`;c.fillText(text,256,135,480);const t=new THREE.CanvasTexture(can);t.colorSpace=THREE.SRGBColorSpace;const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}),p,x,y,z);o.castShadow=false;return o;
  }
  const {stationGroups,markers,doors,trees,lamps,signals,colliders,cameraOccluders}=buildNetworkDistrict(scene,LESSONS,sign,{surfaceTextures});
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
  const player=person(-2,16,'#496c79',1.08,2);player.rig.visible=false;player.g.rotation.y=Math.PI;
  const target=new THREE.Vector3(-2,0,16);
  const shadowRing=mesh(new THREE.RingGeometry(.42,.5,32),new THREE.MeshBasicMaterial({color:'#f4c66a',transparent:true,opacity:.85,side:THREE.DoubleSide}),scene,-2,.14,16);shadowRing.rotation.x=-Math.PI/2;
  // Small radial contact shadows ground the cast without a screen-space AO pass.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const shadowContext=shadowCanvas.getContext('2d'),gradient=shadowContext.createRadialGradient(32,32,2,32,32,31);
  gradient.addColorStop(0,'rgba(20,40,48,.3)');gradient.addColorStop(.45,'rgba(20,40,48,.14)');gradient.addColorStop(1,'rgba(20,40,48,0)');shadowContext.fillStyle=gradient;shadowContext.fillRect(0,0,64,64);
  const contactTexture=new THREE.CanvasTexture(shadowCanvas),contactMaterial=new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,toneMapped:false});
  const contactShadows=[];
  function groundShadow(person){const shadow=mesh(new THREE.PlaneGeometry(1.5,1.5),contactMaterial,scene);shadow.castShadow=false;shadow.rotation.x=-Math.PI/2;contactShadows.push({person,shadow});}
  groundShadow(player);
  const guests=[];
  const actors=[],students=[],playerModels=new Map(),failedAvatars=new Set();
  const bots=Q1.civilians.map((config,index)=>{const pose=routePose(PATROLS[config.route],config.offset);const b=person(pose.x,pose.z,['#497785','#72987c'][index],config.scale,index+1);return {...b,...config,distance:config.offset};});
  bots.forEach(groundShadow);
  const visitors=[];
  const studentLoader=new GLTFLoader();studentLoader.register(parser=>new VRMLoaderPlugin(parser));
  function loadStudent(person,asset,phase=0,variant=null){
   if(!variant)person.rig.visible=false;
   studentLoader.load('./assets/'+asset,gltf=>{
    const vrm=gltf.userData.vrm;
    if(disposed){VRMUtils.deepDispose(vrm.scene);return;}
    VRMUtils.rotateVRM0(vrm);VRMUtils.removeUnnecessaryVertices(vrm.scene);
    vrm.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    person.g.add(vrm.scene);
    if(variant){playerModels.set(variant,vrm.scene);vrm.scene.visible=props.current.avatar===variant;}
    const bone=name=>vrm.humanoid.getNormalizedBoneNode(name);
    vrm.scene.updateMatrixWorld(true);
    const point=name=>bone(name).getWorldPosition(new THREE.Vector3());
    const thigh=point('leftUpperLeg').distanceTo(point('leftLowerLeg'))/person.g.scale.y;
    const shin=point('leftLowerLeg').distanceTo(point('leftFoot'))/person.g.scale.y;
    const hips=bone('hips'),restHipY=hips.position.y;
    students.push({vrm,person,bone,phase,distance:phase*.3,blend:0,thigh,shin,hips,restHipY,variant});
   },undefined,()=>{if(variant)failedAvatars.add(variant);else person.rig.visible=true;});
  }
  function guest(person,config,variant=null){
   if(person.rig)person.rig.visible=false;
   loadGuest({parent:person.g,asset:config.asset,kind:config.kind,height:config.height,isDisposed:()=>disposed,
    onLoad:actor=>{if(variant){playerModels.set(variant,actor.root);actor.root.visible=props.current.avatar===variant;}guests.push({...actor,person,variant});},
    onError:()=>{if(variant)failedAvatars.add(variant);else if(person.rig)person.rig.visible=true;console.warn('Character could not load:',config.asset);}});
  }
  bots.forEach(b=>guest(b,b));
  Q1.avatars.filter(a=>a.kind).forEach(a=>guest(player,a,a.id));
  const tom={g:group(scene,-5,.1,-11),actualSpeed:0};tom.g.rotation.y=Math.PI/2;guest(tom,{asset:'tom.glb',kind:'tom',height:1.8});groundShadow(tom);sign(tom.g,'TOM',1,.35,0,2.2,0);
  const optimus={g:group(scene,8,.1,5),actualSpeed:0};guest(optimus,{asset:'optimus.glb',kind:'optimus',height:3.8});groundShadow(optimus);sign(optimus.g,'OPTIMUS',2,.4,0,4.2,0);

  Q1.avatars.filter(a=>a.asset.endsWith('.vrm')).forEach((a,i)=>loadStudent(player,a.asset,i*2,a.id));
  function loadRobot(person,config,variant=null){
   new GLTFLoader().load('./assets/'+config.asset,gltf=>{
    if(disposed){VRMUtils.deepDispose(gltf.scene);return;}
    const model=gltf.scene;model.scale.setScalar(config.scale);person.g.add(model);
    if(variant){playerModels.set(variant,model);model.visible=props.current.avatar===variant;}
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    const mixer=new THREE.AnimationMixer(model),actions={};
    for(const [name,clipName] of Object.entries({Idle:config.idle,Walk:config.walk})){const clip=gltf.animations.find(c=>c.name===clipName);if(clip){const action=mixer.clipAction(clip);action.play();action.setEffectiveWeight(name==='Idle'?1:0);actions[name]=action;}}
    actors.push({person,mixer,actions,walkSpeed:config.speed||1.7,variant});
   },undefined,()=>{if(variant)failedAvatars.add(variant);console.warn('Q1 robot model could not load');});
  }
  const service=Q1.service,servicePose=routePose(PATROLS[service.route],service.offset);
  const technician={g:group(scene,servicePose.x,.1,servicePose.z),route:service.route,distance:service.offset,speed:service.speed,actualSpeed:0};visitors.push(technician);groundShadow(technician);loadRobot(technician,service);
  loadRobot(player,{asset:'campus-robot.glb',scale:.43,idle:'Idle',walk:'Walking',speed:1.7},'robot');
  const keys=new Set(),tapUntil=new Map();let sprint=false,speed=0,stepDistance=0;let pointerStart=null,keyboardMove=false;const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.12);
  function keydown(e){if(e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')||props.current.paused)return;if(e.code==='ShiftLeft'||e.code==='ShiftRight')sprint=true;const key=movementKey(e);if(key){e.preventDefault();if(!keys.has(key))tapUntil.set(key,performance.now()+130);keys.add(key);if(!props.current.started)props.current.onStart();}}
  function keyup(e){if(e.code==='ShiftLeft'||e.code==='ShiftRight')sprint=false;const key=movementKey({...e,code:e.code,key:e.key,ctrlKey:false,metaKey:false,altKey:false});if(key)keys.delete(key);}
  function down(e){if(!e.isPrimary){if(pointerStart)pointerStart.dragged=true;return;}pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId,dragged:false};}
  function move(e){if(pointerStart&&Math.hypot(pointerStart.x-e.clientX,pointerStart.y-e.clientY)>7)pointerStart.dragged=true;}
  function cancel(){pointerStart=null;}
  function up(e){const start=pointerStart;pointerStart=null;if(!start||start.id!==e.pointerId||start.dragged||e.ctrlKey||e.shiftKey||e.metaKey||Math.hypot(start.x-e.clientX,start.y-e.clientY)>7||e.button!==0||props.current.paused)return;const r=el.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(stationGroups,true);if(hits.length){let o=hits[0].object;while(o&&o.userData.station===undefined)o=o.parent;if(o){props.current.onSelect(o.userData.station);const l=LESSONS[o.userData.station];target.set(l.entry[0],0,l.entry[1]);}return;}const p=new THREE.Vector3();if(raycaster.ray.intersectPlane(plane,p)){target.set(THREE.MathUtils.clamp(p.x,-Q1.bounds.x+.5,Q1.bounds.x-.5),0,THREE.MathUtils.clamp(p.z,-Q1.bounds.z+.5,Q1.bounds.z-.5));}}
  addEventListener('keydown',keydown);addEventListener('keyup',keyup);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointercancel',cancel);renderer.domElement.addEventListener('pointerup',up);const blur=()=>{sprint=false;keys.clear();tapUntil.clear();cancel();};addEventListener('blur',blur);
  let focusTarget=null,focusPosition=null,lastSelected=-1,lastFollow=null;const previousPlayer=new THREE.Vector3(),occlusion=createOcclusionFade();
  const cancelFocus=()=>{focusTarget=null;focusPosition=null;};controls.addEventListener('start',cancelFocus);
  let raf,previous=performance.now(),lastNear=-1,elapsed=0;const projected=new THREE.Vector3();
  function resize(){const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
  const ro=new ResizeObserver(resize);ro.observe(el);
  engine.current={scene,renderer,camera,player,target};props.current.onReady();
  function animate(now){raf=requestAnimationFrame(animate);if(now-previous<(props.current.paused?200:1000/(props.current.low?30:60)))return;const dt=Math.min((now-previous)/1000,.05);previous=now;elapsed+=dt;const p=props.current;controls.enabled=!p.paused;renderer.shadowMap.enabled=!p.low;const ratio=Math.min(devicePixelRatio,p.low?1:1.85);if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);
   if(p.paused){sprint=false;keys.clear();tapUntil.clear();if(keyboardMove){target.copy(player.g.position);keyboardMove=false;}}
   previousPlayer.copy(player.g.position);let movedDistance=0;
   if(p.started&&!p.paused){const pressed=key=>keys.has(key)||(tapUntil.get(key)||0)>now;let dx=Number(pressed('right'))-Number(pressed('left')),dz=Number(pressed('back'))-Number(pressed('forward'));
    if(dx||dz){const forward=camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize(),right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));const d=right.multiplyScalar(dx).addScaledVector(forward,-dz).normalize();target.copy(player.g.position).addScaledVector(d,1.2);target.y=0;keyboardMove=true;}else if(keyboardMove){target.copy(player.g.position);keyboardMove=false;}
    const diff=target.clone().sub(player.g.position);diff.y=0;const dist=diff.length();if(dist>.08){const d=diff.normalize(),step=d.clone().multiplyScalar(Math.min(dist,dt*(speed=THREE.MathUtils.damp(speed,sprint?5.1:2.1,9,dt)))),next=slideMove(player.g.position,step,colliders,{bounds:Q1.bounds,plaza:false});movedDistance=Math.hypot(next.x-player.g.position.x,next.z-player.g.position.z);player.g.position.x=next.x;player.g.position.z=next.z;const turn=Math.atan2(d.x,d.z)-player.g.rotation.y;player.g.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*12));}
   }
   if(movedDistance<.0001)speed=0;
   player.actualSpeed=movedDistance/dt;
   if(p.started&&!p.paused){stepDistance+=movedDistance;if(stepDistance>(sprint?.85:.55)){campusAudio.step(sprint);stepDistance=0;}}
   campusAudio.ambience(Math.hypot(player.g.position.x,player.g.position.z),p.started&&!p.paused);
   animateWalk(player,movedDistance,dt,p.reduced);
   contactShadows.forEach(({person,shadow})=>{shadow.position.set(person.g.position.x,.096,person.g.position.z);});
   shadowRing.position.set(player.g.position.x,.14,player.g.position.z);if(!p.reduced&&!p.paused)shadowRing.rotation.z=elapsed*.3;
   playerModels.forEach((model,id)=>{model.visible=id===p.avatar;});player.rig.visible=failedAvatars.has(p.avatar);
   if(p.started&&p.selected!==lastSelected){
    const firstEntry=lastSelected===-1;lastSelected=p.selected;const [x,z]=LESSONS[p.selected].position;
    const front=new THREE.Vector3(-x,0,-z).normalize();
    const right=new THREE.Vector3(-front.z,0,front.x);
    focusTarget=new THREE.Vector3(x,1.5,z).addScaledVector(right,3);
    focusPosition=focusTarget.clone().addScaledVector(front,19);focusPosition.y=15;
    if(firstEntry){player.g.position.set(LESSONS[p.selected].entry[0],.1,LESSONS[p.selected].entry[1]);target.copy(player.g.position);player.g.rotation.y=Math.atan2(-front.x,-front.z);}
   }
   if(focusTarget&&!p.paused&&!p.follow){const t=p.reduced?1:1-Math.exp(-dt*2);camera.position.lerp(focusPosition,t);controls.target.lerp(focusTarget,t);if(camera.position.distanceTo(focusPosition)<.05)cancelFocus();}
   doors.forEach(door=>{const {hinge,i}=door;const l=LESSONS[i];const d=Math.hypot(player.g.position.x-l.entry[0],player.g.position.z-l.entry[1]);const open=p.started&&d<3.5;if(open&&!door.open&&!p.paused)campusAudio.door();door.open=open;const angle=open?-1.25:0;hinge.rotation.y=THREE.MathUtils.lerp(hinge.rotation.y,angle,p.reduced?1:1-Math.exp(-dt*6));});
   const ambient=!p.reduced&&!p.paused;
   trees.forEach((tree,i)=>{tree.rotation.z=ambient?Math.sin(elapsed*.7+i)*.012:0;});
   signals.forEach(({packet,curve,offset})=>{packet.visible=!p.low;packet.position.copy(curve.getPointAt((ambient?elapsed*.055+offset:offset)%1));});
   function advance(person){const old=person.g.position.clone();if(ambient){person.distance+=dt*person.speed;const pose=routePose(PATROLS[person.route],person.distance);person.g.position.set(pose.x,.1,pose.z);const turn=pose.heading-person.g.rotation.y;person.g.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-dt*12));}person.actualSpeed=person.g.position.distanceTo(old)/dt;return person.g.position.distanceTo(old);}
   bots.forEach(b=>animateWalk(b,advance(b),dt,p.reduced));visitors.forEach(advance);
   students.forEach(student=>{
    const {vrm,person,bone}=student;
    if(student.variant&&student.variant!==p.avatar)return;
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
   guests.forEach(g=>{if(!g.variant||g.variant===p.avatar)g.update(dt,g.person.actualSpeed||0,{paused:p.paused,reduced:p.reduced});});
   actors.forEach(({person,mixer,actions,walkSpeed=1.7,variant})=>{
    if(variant&&variant!==p.avatar)return;
    const v=p.paused?0:(person.actualSpeed||0);const moving=Math.min(v/(person===player?1.3:.3),1),running=THREE.MathUtils.clamp((v-2.4)/2.5,0,1);
    const weights={Idle:1-moving,Walk:actions.Run?moving*(1-running):moving,Run:moving*running};
    for(const [name,action] of Object.entries(actions)){action.setEffectiveWeight(THREE.MathUtils.damp(action.getEffectiveWeight(),weights[name],10,dt));action.setEffectiveTimeScale(name==='Walk'?Math.max(.55,v/walkSpeed):name==='Run'?Math.max(.7,v/4.5):1);}
    mixer.update(dt);
   });
   if(p.started&&!p.paused){
    if(lastFollow!==p.follow){lastFollow=p.follow;cancelFocus();if(p.follow){const heading=player.g.rotation.y;controls.target.copy(player.g.position).add(new THREE.Vector3(0,1.35,0));camera.position.copy(controls.target).add(new THREE.Vector3(-Math.sin(heading)*5.8,2.5,-Math.cos(heading)*5.8));}else{cameraActions.reset();}}
    if(p.follow){
     const movement=player.g.position.clone().sub(previousPlayer);if(movement.length()<2){camera.position.add(movement);controls.target.add(movement);}
     const desired=player.g.position.clone().add(new THREE.Vector3(0,1.35,0));const delta=desired.sub(controls.target);const followBlend=1-Math.exp(-dt*4.5);controls.target.addScaledVector(delta,followBlend);camera.position.addScaledVector(delta,followBlend);

    }
   }
   // Let OrbitControls finish its damping/clamps before inspecting the final view.
   // Include infrastructure, gantries, rack canopies and facade details, not just labs.
   controls.update();scene.updateMatrixWorld(true);
   if(p.started&&p.follow)occlusion.update(camera,player.g.position,cameraOccluders);else occlusion.clear();
   let near=-1,nd=Infinity;
   markers.forEach(({g,gem,i,height})=>{g.position.y=height+(p.reduced?0:Math.sin(elapsed*2+i)*.18);gem.rotation.y+=p.reduced?0:dt*.45;const done=p.completed.includes(i);gem.material.color.set(done?'#4baf91':LESSONS[i].color);gem.material.emissive.set(done?'#318b6e':LESSONS[i].color);const scale=i===p.selected?1.4:1;gem.scale.lerp(new THREE.Vector3(scale,scale,scale),1-Math.exp(-dt*5));const d=Math.hypot(player.g.position.x-LESSONS[i].position[0],player.g.position.z-LESSONS[i].position[1]);if(d<nd){nd=d;near=i;}
    const node=document.getElementById('station-label-'+i);if(node){projected.set(LESSONS[i].position[0],height+.2,LESSONS[i].position[1]).project(camera);node.style.transform='translate(-50%, -100%) translate('+((projected.x*.5+.5)*el.clientWidth)+'px,'+((-projected.y*.5+.5)*el.clientHeight)+'px)';node.style.opacity=projected.z>1?'0':'1';}
   });
   if(nd>6.5)near=-1;if(near!==lastNear){lastNear=near;p.onNear(near);}
   const badge=document.getElementById('player-label');if(badge){badge.textContent=playerModels.has(p.avatar)?'СЕН · '+(Q1.avatars.find(a=>a.id===p.avatar)?.label||'Зерттеуші').toLocaleUpperCase('kk'):failedAvatars.has(p.avatar)?'СЕН · ЖЕҢІЛ АВАТАР':'КЕЙІПКЕР ЖҮКТЕЛУДЕ…';projected.copy(player.g.position).add(new THREE.Vector3(0,2.65,0)).project(camera);badge.style.transform='translate(-50%, -100%) translate('+((projected.x*.5+.5)*el.clientWidth)+'px,'+((-projected.y*.5+.5)*el.clientHeight)+'px)';badge.style.visibility=p.started&&projected.z<1&&projected.z>-1?'visible':'hidden';}renderer.render(scene,camera);
  }
  raf=requestAnimationFrame(animate);
  return()=>{disposed=true;guests.forEach(g=>g.dispose());environment.dispose();surfaceTextures.normal.dispose();surfaceTextures.roughness.dispose();students.forEach(({vrm})=>VRMUtils.deepDispose(vrm.scene));campusAudio.ambience(20,false);occlusion.dispose();actors.forEach(a=>a.mixer.stopAllAction());cancelAnimationFrame(raf);ro.disconnect();removeEventListener('keydown',keydown);removeEventListener('keyup',keyup);removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('wheel',wheel,true);cameraRef.current=null;controls.dispose();const allMaterials=new Set();scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>allMaterials.add(m));});allMaterials.forEach(m=>{for(const value of Object.values(m))if(value?.isTexture)value.dispose();m.dispose();});Object.values(mats).forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <div ref={host} className="world" role="img" aria-label="Бірінші тоқсанның байланыс зерттеу ауданы">{failure&&<div className="world-failure"><h2>Жеңіл режим іске қосылды</h2><p>Бұл браузерде WebGL ашылмады. Мәтіндік балама батырмасын таңдаңыз — бірінші желі тапсырмасын орындауға болады.</p></div>}</div>;
}
