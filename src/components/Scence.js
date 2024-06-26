import * as THREE from "three";

export function createScene(width, height) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  // Ánh sáng
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(10, 20, 10);
  scene.add(pointLight);

  const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
  pointLight2.position.set(-10, -20, -10);
  scene.add(pointLight2);

  return { scene, camera, renderer,pointLight,pointLight2 };
}
