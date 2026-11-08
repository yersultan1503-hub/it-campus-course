import test from 'node:test';
import assert from 'node:assert/strict';
import { movementKey, slideMove } from '../src/movement.js';

test('physical movement keys work independently of keyboard language', () => {
  for(const [code,key,want] of [['KeyW','ц','forward'],['KeyA','ф','left'],['KeyS','ы','back'],['KeyD','в','right'],['KeyW','z','forward'],['ArrowLeft','ArrowLeft','left']]) {
    assert.equal(movementKey({code,key}),want);
  }
  assert.equal(movementKey({key:'Ц'}),'forward');
  assert.equal(movementKey({key:'Ф'}),'left');
  assert.equal(movementKey({code:'KeyW',key:'w',ctrlKey:true}),null);
});
test('a diagonal approach slides along a building instead of freezing both axes', () => {
  const from={x:2.3,z:6};
  const next=slideMove(from,{x:.2,z:.2},[{x:5,z:6,r:2.6}]);
  assert.equal(next.x,from.x);
  assert.ok(next.z>from.z);
  assert.ok(Math.hypot(next.x-5,next.z-6)>=2.6);
});
test('the plaza blocks inward movement but lets an overlapping player escape', () => {
  assert.deepEqual(slideMove({x:0,z:4.65},{x:0,z:-.2},[]),{x:0,z:4.65});
  assert.deepEqual(slideMove({x:0,z:4},{x:0,z:.2},[]),{x:0,z:4.2});
  assert.deepEqual(slideMove({x:13.9,z:10},{x:.3,z:0},[]),{x:13.9,z:10});
});
