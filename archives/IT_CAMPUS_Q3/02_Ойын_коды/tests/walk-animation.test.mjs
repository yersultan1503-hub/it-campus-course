import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from 'three';
import { footPose, animateWalk, STRIDE } from '../src/walkAnimation.js';

function rig() {
  const pair=()=>[new Group(),new Group()];
  return {g:new Group(),rig:new Group(),body:new Group(),legs:pair(),knees:pair(),feet:pair(),arms:pair(),elbows:pair()};
}
test('stance foot stays planted as the body advances; the opposite foot lifts', () => {
  const a=footPose(.08),b=footPose(.18);
  assert.ok(Math.abs((.18+b.z)-(.08+a.z))<1e-9);
  assert.equal(a.lift,0);
  assert.ok(footPose(.18,1).lift>.1);
});
test('hip/knee solve the foot path and keep the shoe level across the cycle', () => {
  for(let d=0;d<STRIDE;d+=.03){
    const p=footPose(d),z=-.32*Math.sin(p.hip)-.32*Math.sin(p.hip+p.knee),y=-.32*Math.cos(p.hip)-.32*Math.cos(p.hip+p.knee);
    assert.ok(Math.abs(z-p.z)<1e-8 && Math.abs(y-p.y)<1e-8);
    assert.ok(Math.abs(p.hip+p.knee+p.ankle)<1e-8);
  }
});
test('reduced motion retains essential walking; blocked/idle travel settles to rest', () => {
  const p=rig();
  for(let i=0;i<12;i++)animateWalk(p,.035,1/30,true);
  assert.ok(p.legs.some(l=>Math.abs(l.rotation.x)>.1));
  assert.ok(p.knees.some(k=>k.rotation.x>.3));
  const phase=p.walkDistance;
  for(let i=0;i<30;i++)animateWalk(p,0,1/30,true);
  assert.equal(p.walkDistance,phase);
  assert.equal(p.walkBlend,0);
  assert.ok(Math.abs(p.legs[0].rotation.x)<1e-9);
});
