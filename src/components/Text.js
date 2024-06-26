import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

export async function createText(scaleFactor) {
    const fontLoader = new FontLoader();
    const font = await new Promise((resolve, reject) => {
      fontLoader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        resolve,
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
        reject
      );
    });

    const textGeometry = new TextGeometry("Sev7n", {
      font: font,
      size: 5 * scaleFactor, 
      depth: 1 * scaleFactor, 
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.5 * scaleFactor, 
      bevelSize: 0.3 * scaleFactor,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    const textMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc00, 
      specular: 0xffffff, 
      shininess: 1000, 
    });

    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.geometry.center(); 
    return textMesh;
  }
