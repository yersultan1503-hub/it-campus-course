import { Vector3, Spherical, MathUtils } from 'three';

// Trackpads send ordinary two-finger scrolling as wheel events and pinch as Ctrl+wheel.
export function wheelIntent(event, height) {
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
  return { zoom: event.ctrlKey || event.metaKey, x: event.deltaX * unit, y: event.deltaY * unit };
}

export function createCameraActions(camera, controls, viewportHeight, view = {target:[0,.6,1],position:[25,24,31]}) {
  function change(update) {
    // Flush old orbit inertia so a reset or button press has a predictable result.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    update();
    controls.update();
    controls.enableDamping = damping;
  }
  return {
    pan(dx, dy) {
      change(() => {
        const scale = 2 * camera.position.distanceTo(controls.target) * Math.tan(MathUtils.degToRad(camera.fov / 2)) / Math.max(viewportHeight(), 1);
        camera.updateMatrixWorld();
        const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
        const down = camera.position.clone().sub(controls.target).setY(0).normalize();
        const offset = right.multiplyScalar(dx * scale).addScaledVector(down, dy * scale);
        const next = controls.target.clone().add(offset);
        next.x = MathUtils.clamp(next.x, -35, 35);
        next.z = MathUtils.clamp(next.z, -35, 35);
        offset.copy(next).sub(controls.target);
        camera.position.add(offset);
        controls.target.copy(next);
      });
    },
    rotate(azimuth, polar = 0) {
      change(() => {
        const sphere = new Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        sphere.theta += azimuth;
        sphere.phi = MathUtils.clamp(sphere.phi + polar, controls.minPolarAngle, controls.maxPolarAngle);
        camera.position.copy(controls.target).add(new Vector3().setFromSpherical(sphere));
      });
    },
    zoom(factor) {
      change(() => {
        const offset = camera.position.clone().sub(controls.target);
        const distance = MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
        camera.position.copy(controls.target).add(offset.setLength(distance));
      });
    },
    reset() {
      change(() => { const current=typeof view==='function'?view():view;controls.target.set(...current.target); camera.position.set(...current.position); });
    },
  };
}

// Keep the complete district readable on portrait screens; follow view stays unchanged.
export function districtOverview(view,aspect){
 const target=new Vector3(...view.target),offset=new Vector3(...view.position).sub(target);
 const factor=Math.max(1,.95/Math.max(.25,aspect));
 return {target:[view.target[0],view.target[1]-Math.max(0,factor-1)*7,view.target[2]],position:offset.multiplyScalar(factor).add(target).toArray()};
}
