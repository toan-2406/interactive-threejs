import * as THREE from "three";

export function createSphere(geometry, material, scaleFactor) {
  const sphere = new THREE.Mesh(geometry, material.clone());
  const radius = Math.random() * 2 + 1;
  sphere.scale.set(radius, radius, radius);
  sphere.position.set(
    (Math.random() - 0.5) * 40 * scaleFactor,
    (Math.random() - 0.5) * 40 * scaleFactor,
    (Math.random() - 0.5) * 40 * scaleFactor
  );
  sphere.userData = {
    velocity: new THREE.Vector3(),
    angularVelocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    ),
  };
  return sphere;
}
