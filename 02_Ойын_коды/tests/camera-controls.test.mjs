import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCameraActions, wheelIntent } from '../src/cameraControls.js';

function rig() {
  const camera = new PerspectiveCamera(43, 1.5, .1, 160);
  camera.position.set(25, 24, 31);
  const controls = new OrbitControls(camera);
  controls.target.set(0, .6, 1);
  controls.minDistance = 6; controls.maxDistance = 80;
  controls.minPolarAngle = .06; controls.maxPolarAngle = Math.PI * .485;
  controls.enableDamping = true; controls.update();
  return { camera, controls, actions:createCameraActions(camera, controls, () => 720) };
}

test('two-finger wheel pans; pinch stays zoom; wheel units normalize', () => {
  assert.deepEqual(wheelIntent({deltaX:30,deltaY:80,deltaMode:0,ctrlKey:false,metaKey:false},720), {zoom:false,x:30,y:80});
  assert.equal(wheelIntent({deltaX:0,deltaY:2,deltaMode:1,ctrlKey:false,metaKey:false},720).y, 32);
  assert.equal(wheelIntent({deltaX:0,deltaY:2,deltaMode:0,ctrlKey:true,metaKey:false},720).zoom, true);
});
test('pan moves the view across the campus without changing zoom or ground plane', () => {
  const {camera,controls,actions} = rig();
  const before = camera.position.clone(), offset = camera.position.clone().sub(controls.target);
  actions.pan(100, 70);
  assert.ok(camera.position.distanceTo(before) > 1);
  assert.ok(camera.position.clone().sub(controls.target).distanceTo(offset) < 1e-8);
  assert.ok(Math.abs(controls.target.y - .6) < 1e-8);
  actions.pan(100000,100000);
  assert.ok(Math.abs(controls.target.x) <= 35 + 1e-8 && Math.abs(controls.target.z) <= 35 + 1e-8);
});
test('camera reaches the opposite side, zoom stays bounded, and reset restores view', () => {
  const {camera,controls,actions} = rig();
  const initial = camera.position.clone().sub(controls.target).setY(0).normalize();
  actions.rotate(Math.PI);
  assert.ok(camera.position.clone().sub(controls.target).setY(0).normalize().dot(initial) < -.999);
  actions.zoom(.00001);
  assert.ok(Math.abs(camera.position.distanceTo(controls.target) - 6) < 1e-8);
  actions.zoom(100000);
  assert.ok(Math.abs(camera.position.distanceTo(controls.target) - 80) < 1e-8);
  actions.pan(200,-100); actions.rotate(.5,.2); actions.reset();
  assert.ok(camera.position.distanceTo(new Vector3(25,24,31)) < 1e-8);
  assert.ok(controls.target.distanceTo(new Vector3(0,.6,1)) < 1e-8);
  assert.equal(controls.enableDamping, true);
});
