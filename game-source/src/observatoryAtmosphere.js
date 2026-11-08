import * as THREE from 'three';

// Repo-native sky and vegetation: no remote image, extra renderer or postprocessing.
export function createObservatoryAtmosphere(scene){
 const root=new THREE.Group();root.name='observatory-atmosphere';scene.add(root);
 let seed=2011;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 const positions=[],colors=[];
 for(let i=0;i<1050;i++){const angle=random()*Math.PI*2,height=.015+random()*.85,r=140,radial=Math.sqrt(1-height*height);positions.push(Math.cos(angle)*r*radial,height*r,Math.sin(angle)*r*radial);const c=new THREE.Color().setHSL(.55+random()*.13,.25,.65+random()*.3);colors.push(c.r,c.g,c.b);}
 const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));starGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const stars=new THREE.Points(starGeometry,new THREE.PointsMaterial({size:.5,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,toneMapped:false}));stars.name='night-stars';root.add(stars);
 const moon=new THREE.Mesh(new THREE.SphereGeometry(2.8,20,12),new THREE.MeshBasicMaterial({color:'#d4e5f4',toneMapped:false}));moon.position.set(-66,91,-87);root.add(moon);
 const mountainMaterial=new THREE.MeshStandardMaterial({color:'#132f43',roughness:1});
 for(let i=0;i<13;i++){const mountain=new THREE.Mesh(new THREE.IcosahedronGeometry(11+random()*7,1),mountainMaterial);mountain.position.set((i-6)*15,-4,-58-random()*12);mountain.scale.set(1.4,.8+random()*.65,1);root.add(mountain);}
 // Trunks and tiered pine crowns are instanced to keep a richer perimeter cheap.
 const locations=[];
 for(let i=0;i<72;i++){const side=i%4,t=(i/4|0)/17;locations.push(side===0?[-25-random()*6,-21+t*43]:side===1?[25+random()*6,-21+t*43]:side===2?[-25+t*50,-24-random()*7]:[-25+t*50,23+random()*7]);}
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.11,.19,2.5,6),new THREE.MeshStandardMaterial({color:'#657568',roughness:1}),locations.length);
 const crowns=new THREE.InstancedMesh(new THREE.ConeGeometry(1.2,2.9,7),new THREE.MeshStandardMaterial({color:'#2b635a',roughness:.92}),locations.length*3);
 const transform=new THREE.Object3D(),tint=new THREE.Color();
 locations.forEach(([x,z],i)=>{const size=.8+random()*.65;transform.position.set(x,1.25*size-.2,z);transform.scale.setScalar(size);transform.updateMatrix();trunks.setMatrixAt(i,transform.matrix);for(let j=0;j<3;j++){transform.position.set(x,2.7*size+j*.9*size-.2,z);transform.scale.setScalar(size*(1-j*.2));transform.updateMatrix();crowns.setMatrixAt(i*3+j,transform.matrix);tint.setHSL(.41+random()*.06,.3,.18+random()*.1);crowns.setColorAt(i*3+j,tint);}});
 trunks.castShadow=crowns.castShadow=true;trunks.receiveShadow=crowns.receiveShadow=true;root.add(trunks,crowns);
 // Four shadowless pools illuminate paths and characters. Emissive windows supply detail.
 const lightLocations=[[-7,2.8,-8],[6,3,1],[-6,3,9],[2,3,7]],lights=[];
 const poolMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{strength:{value:.26}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUv; uniform float strength; void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*3.)*strength;gl_FragColor=vec4(1.,.62,.25,a);}',toneMapped:false});
 const pools=[];
 for(const [x,y,z] of lightLocations){const light=new THREE.PointLight('#ffc276',26,12,2);light.position.set(x,y,z);lights.push(light);root.add(light);const pool=new THREE.Mesh(new THREE.PlaneGeometry(6,6),poolMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(x,.094,z);pools.push(pool);root.add(pool);}
 for(const x of [-4,4])for(const z of [-13,-5,5,15]){const pool=new THREE.Mesh(new THREE.PlaneGeometry(3.2,3.2),poolMaterial);pool.rotation.x=-Math.PI/2;pool.position.set(x,.095,z);pools.push(pool);root.add(pool);}
 let previous='';
 function update(theme,low){const key=theme+low;if(key===previous)return;previous=key;const night=theme!=='light';stars.visible=moon.visible=night;stars.geometry.setDrawRange(0,low?350:1050);trunks.count=low?36:72;crowns.count=low?108:216;trunks.castShadow=crowns.castShadow=!low;lights.forEach((light,i)=>{light.visible=night&&(!low||i<2);light.intensity=night?(low?(i<2?18:0):26):0;});pools.forEach(pool=>{pool.visible=night&&!low;});mountainMaterial.color.set(night?'#102a3d':'#698e88');}
 return {root,stars,trunks,crowns,lights,pools,update};
}
