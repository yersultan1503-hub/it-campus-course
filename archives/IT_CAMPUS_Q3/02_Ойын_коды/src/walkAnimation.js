const TAU = Math.PI * 2;
export const STRIDE = 1.15;

// A planted foot travels backward by exactly the body's forward distance.
export function footPose(distance, side = 0) {
  const cycle = ((distance / STRIDE + side * .5) % 1 + 1) % 1;
  const halfStride = STRIDE / 4;
  let z, lift;
  if(cycle < .5) {
    z = halfStride - cycle * STRIDE;
    lift = 0;
  } else {
    const swing = (cycle - .5) * 2;
    z = -halfStride * Math.cos(Math.PI * swing);
    lift = .15 * Math.sin(Math.PI * swing);
  }
  const y = -.56 + lift, thigh = .32, shin = .32;
  const cosine = Math.max(-1, Math.min(1, (y*y+z*z-thigh*thigh-shin*shin)/(2*thigh*shin)));
  const knee = Math.acos(cosine);
  const hip = Math.atan2(-z,-y) - Math.atan2(shin*Math.sin(knee),thigh+shin*Math.cos(knee));
  return {hip,knee,ankle:-hip-knee,z,y,lift,cycle};
}

export function animateWalk(person, distanceMoved, dt, reduced = false) {
  person.walkDistance ??= 0;
  person.walkBlend ??= 0;
  person.walkDistance += distanceMoved / person.g.scale.x;
  const walking = distanceMoved > 1e-6;
  person.walkBlend += ((walking?1:0)-person.walkBlend) * (1-Math.exp(-dt*18));
  if(person.walkBlend < .001) person.walkBlend = 0;
  const blend = person.walkBlend, phase = person.walkDistance / STRIDE * TAU;
  person.legs.forEach((hip,i) => {
    const pose = footPose(person.walkDistance,i);
    hip.rotation.x = pose.hip * blend;
    person.knees[i].rotation.x = pose.knee * blend;
    person.feet[i].rotation.x = pose.ankle * blend;
    person.arms[i].rotation.x = -Math.sin(phase+i*Math.PI) * .65 * blend;
    person.elbows[i].rotation.x = -.12 - (.15+.18*Math.max(0,Math.sin(phase+i*Math.PI))) * blend;
  });
  person.rig.position.y = -.08*blend + (reduced?0:Math.cos(phase*2)*.012*blend);
  person.body.rotation.x = .06*blend;
  person.body.rotation.z = reduced?0:Math.sin(phase)*.025*blend;
}
