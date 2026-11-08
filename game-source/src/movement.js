const physical = {KeyW:'forward',KeyS:'back',KeyA:'left',KeyD:'right',ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'left',ArrowRight:'right'};
const letters = {w:'forward',ц:'forward',s:'back',ы:'back',a:'left',ф:'left',d:'right',в:'right',arrowup:'forward',arrowdown:'back',arrowleft:'left',arrowright:'right'};
export function movementKey(event) {
  if(event.ctrlKey || event.metaKey || event.altKey) return null;
  return physical[event.code] || letters[event.key?.toLowerCase()] || null;
}

// Shared movement: circle obstacles for retained worlds, box footprints and bounds for Q1.
export function slideMove(position, delta, buildings, {bounds={x:14,z:14.7},plaza=true}={}) {
  const obstacles = [...buildings, ...(plaza?[{x:0,z:0,r:4.6}]:[])];
  const allowed = p => Math.abs(p.x)<bounds.x && Math.abs(p.z)<bounds.z && obstacles.every(c => {
    if(c.hx!==undefined){const clearance=q=>Math.max(Math.abs(q.x-c.x)-c.hx,Math.abs(q.z-c.z)-c.hz);return clearance(p)>=0||clearance(p)>clearance(position)+1e-8;}
    const distance = Math.hypot(p.x-c.x,p.z-c.z);
    return distance >= c.r || distance > Math.hypot(position.x-c.x,position.z-c.z) + 1e-8;
  });
  const full = {x:position.x+delta.x,z:position.z+delta.z};
  if(allowed(full)) return full;
  const alternatives = [{x:full.x,z:position.z},{x:position.x,z:full.z}];
  alternatives.sort((a,b)=>Math.hypot(b.x-position.x,b.z-position.z)-Math.hypot(a.x-position.x,a.z-position.z));
  return alternatives.find(allowed) || {x:position.x,z:position.z};
}
