import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
// Geometry bevels catch daylight; keep large terrain and thin details inexpensive.
export function districtBoxGeometry(w,h,d){
 return Math.min(w,h,d)>.5&&Math.max(w,h,d)<20?new RoundedBoxGeometry(w,h,d,1,.045):new THREE.BoxGeometry(w,h,d);
}
export function pavingGeometry(w,h,d){
 const geometry=new THREE.BoxGeometry(w,h,d),uv=geometry.attributes.uv;
 const dimensions=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
 dimensions.forEach(([u,v],face)=>{for(let corner=0;corner<4;corner++){const i=face*4+corner;uv.setXY(i,uv.getX(i)*u/1.5,uv.getY(i)*v/1.5);}});
 return geometry;
}
export function districtMaterial(color,metalness=0,profile='paint',textures={}){
 if(profile==='glass')return new THREE.MeshPhysicalMaterial({color,metalness:0,roughness:.17,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.85});
 return new THREE.MeshStandardMaterial({color,metalness,roughness:profile==='paving'?.94:metalness?.4:.76,envMapIntensity:metalness?.65:.35,...(profile==='paving'?{normalMap:textures.normal||null,roughnessMap:textures.roughness||null,normalScale:new THREE.Vector2(.24,.24)}:{})});
}
