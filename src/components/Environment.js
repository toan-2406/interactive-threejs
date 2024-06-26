import * as THREE from "three";

export function createEnvironment() {
  const environmentGeometry = new THREE.SphereGeometry(80, 64, 64);
  const environmentMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    map: new THREE.TextureLoader().load("/public/enviromnet.jpg"),
  });
  const environmentMesh = new THREE.Mesh(environmentGeometry, environmentMaterial);
  return environmentMesh;
}
