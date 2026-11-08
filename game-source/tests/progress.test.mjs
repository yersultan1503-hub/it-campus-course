import test from 'node:test';
import assert from 'node:assert/strict';
import {missionComplete,selectedLesson} from '../src/progress.js';
test('lab cannot be skipped with three other games',()=>{assert.equal(missionComplete({quiz:{},match:{},order:{}}),false);assert.equal(missionComplete({lab:{},quiz:{}}),false);assert.equal(missionComplete({lab:{},quiz:{},debug:{}}),true);});
test('lesson links default safely',()=>{const lessons=[{id:'html'},{id:'css'}];assert.equal(selectedLesson('?lesson=css',lessons),1);assert.equal(selectedLesson('?lesson=unknown',lessons),0);});
