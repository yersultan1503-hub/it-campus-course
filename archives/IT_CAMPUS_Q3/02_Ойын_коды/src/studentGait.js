// VRM normalized humanoid faces -Z: knees flex toward +Z (negative X).
// Each planted foot moves backward by the same distance as the body moves forward.
export function studentFootPose(distance, side=0, thigh=.42, shin=.42) {
 const stride=(thigh+shin)*1.12;
 const cycle=((distance/stride+side*.5)%1+1)%1;
 const half=stride/4;
 let z,lift;
 if(cycle<.5){z=-half+cycle*stride;lift=0;}
 else{const t=(cycle-.5)*2;z=half*Math.cos(Math.PI*t);lift=(thigh+shin)*.105*Math.sin(Math.PI*t);}
 const restHeight=Math.sqrt((thigh+shin)**2-half**2)-.008;
 const y=-restHeight+lift;
 const knee=-Math.acos(Math.max(-1,Math.min(1,(y*y+z*z-thigh*thigh-shin*shin)/(2*thigh*shin))));
 const hip=Math.atan2(-z,-y)-Math.atan2(shin*Math.sin(knee),thigh+shin*Math.cos(knee));
 return {hip,knee,ankle:-hip-knee,z,y,lift,cycle,hipDrop:thigh+shin-restHeight};
}
