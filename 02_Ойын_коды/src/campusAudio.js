// Synthesized locally: no remote audio, microphone or autoplay.
let ctx,master,water,waterGain,enabled=false;
function noise(seconds){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*seconds),ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;return b;}
function ready(){return enabled&&ctx?.state==='running'&&!document.hidden;}
function tone(hz,at=0,duration=.12,volume=.04){if(!ready())return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+at;o.type='sine';o.frequency.setValueAtTime(hz,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
export const campusAudio={
 enable(value){enabled=value;try{if(value){ctx??=new (window.AudioContext||window.webkitAudioContext)();if(!master){master=ctx.createGain();master.gain.value=.5;master.connect(ctx.destination);waterGain=ctx.createGain();waterGain.gain.value=0;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1200;water=ctx.createBufferSource();water.buffer=noise(3);water.loop=true;water.connect(filter).connect(waterGain).connect(master);water.start();}ctx.resume().then(()=>this.click()).catch(()=>{});master.gain.setTargetAtTime(.5,ctx.currentTime,.03);}else if(ctx){master.gain.setTargetAtTime(0,ctx.currentTime,.02);waterGain.gain.setTargetAtTime(0,ctx.currentTime,.02);}}catch{enabled=false;}},
 click(){tone(600,0,.07,.025);},
 success(){[523,659,784].forEach((f,i)=>tone(f,i*.12,.3,.045));},
 step(running=false){if(!ready())return;const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),t=ctx.currentTime;n.buffer=noise(.10);f.type='lowpass';f.frequency.value=running?850:600;g.gain.setValueAtTime(running?.15:.10,t);g.gain.exponentialRampToValueAtTime(.0001,t+.10);n.connect(f).connect(g).connect(master);n.start();n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();};tone(running?100:125,0,.07,.025);},
 door(){tone(180,0,.20,.018);tone(260,.08,.2,.012);},
 ambience(distance,active){if(!ctx||!waterGain)return;const gain=ready()&&active?Math.max(0,1-distance/18)*.035:0;waterGain.gain.setTargetAtTime(gain,ctx.currentTime,.3);},
 silence(){if(ctx&&master)master.gain.setTargetAtTime(0,ctx.currentTime,.02);},
 restore(){if(enabled&&ctx&&master)master.gain.setTargetAtTime(.5,ctx.currentTime,.02);}
};
