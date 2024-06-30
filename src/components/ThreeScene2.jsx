import { useRef, useEffect } from "react";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

const ThreeScene2 = ({ widthView = window.innerWidth, heightView = window.innerHeight }) => {
  const canvasRef = useRef(null);
  const textMeshRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, widthView / heightView, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(widthView, heightView);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);

    // Environment
    const environmentGeometry = new THREE.SphereGeometry(80, 64, 64);
    const environmentMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      map: new THREE.TextureLoader().load("/public/enviromnet.jpg"),
    });
    const environmentMesh = new THREE.Mesh(environmentGeometry, environmentMaterial);
    scene.add(environmentMesh);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight2.position.set(-10, -20, -10);
    scene.add(pointLight2);

    // Spheres
    let scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 400;
    const sphereCount = 100;
    const sphereGeometry = new THREE.SphereGeometry(1 * scaleFactor, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("/public/texture.jpg");

    const sphereMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      specular: 0xffffff,
      shininess: 3000,
    });

    const spheres = [];
    for (let i = 0; i < sphereCount; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());

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

      spheres.push(sphere);
      scene.add(sphere);
    }

    // Text 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const fontLoader = new FontLoader();
    const fontPromise = new Promise((resolve, reject) => {
      fontLoader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        (font) => resolve(font),
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
        (err) => reject(err)
      );
    });

    fontPromise
      .then((font) => {
        const textGeometry = new TextGeometry("Sev7n", {
          font: font,
          size: 5 * scaleFactor,
          height: 1 * scaleFactor,
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
        scene.add(textMesh);
        textMeshRef.current = textMesh;
      })
      .catch((err) => console.error("Error loading font:", err));

    const animate = () => {
      requestAnimationFrame(animate);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spheres);

      intersects.forEach((intersect) => {
        const sphere = intersect.object;
        const mouseDirection = new THREE.Vector3(mouse.x, mouse.y, 0).normalize();
        const pushForce = mouseDirection.multiplyScalar(0.4);
        sphere.userData.velocity.add(pushForce);
      });

      if (textMeshRef.current) {
        const targetRotationX = mouse.y * 0.2;
        const targetRotationY = mouse.x * 0.2;

        textMeshRef.current.rotation.x +=
          (targetRotationX - textMeshRef.current.rotation.x) * 0.1;
        textMeshRef.current.rotation.y +=
          (targetRotationY - textMeshRef.current.rotation.y) * 0.1;

        environmentMesh.rotation.x +=
          (targetRotationX - environmentMesh.rotation.x) * 0.05;
        environmentMesh.rotation.y +=
          (targetRotationY - environmentMesh.rotation.y) * 0.05;

        pointLight.position.x = 20 * Math.sin(targetRotationY);
        pointLight.position.z = 20 * Math.cos(targetRotationY);
        pointLight2.position.x = -20 * Math.sin(targetRotationY);
        pointLight2.position.z = -20 * Math.cos(targetRotationY);
      }
      const mouseDirection = new THREE.Vector3(mouse.x, mouse.y, 0).normalize();
      spheres.forEach((sphere,i) => {
        if (textMeshRef.current) {
          const directionToCenter = textMeshRef.current.position
            .clone()
            .sub(sphere.position)
            .normalize();

          const distanceToCenter = sphere.position.distanceTo(
            textMeshRef.current.position
          );
          const maxDistance = 14 + sphere.scale.x;

          if (distanceToCenter > maxDistance) {
            const attractionForce = directionToCenter.multiplyScalar(
              0.0014 * (distanceToCenter - maxDistance)
            );
            sphere.userData.velocity.add(attractionForce);
          }
        }

        for (let j = 0; j < spheres.length; j++) {
          if (i !== j) {
            const otherSphere = spheres[j];
            const distance = sphere.position.distanceTo(otherSphere.position);
            const minDistance = sphere.scale.x + otherSphere.scale.x;

            if (distance < minDistance) {
              const normal = sphere.position
                .clone()
                .sub(otherSphere.position)
                .normalize();
              const relativeVelocity = sphere.userData.velocity
                .clone()
                .sub(otherSphere.userData.velocity);

              const impulse = normal.multiplyScalar(
                (-2 * relativeVelocity.dot(normal)) /
                  (sphere.scale.x + otherSphere.scale.x)
              );

              const overlap = minDistance - distance;
              const separationVector = normal.clone().multiplyScalar(overlap / 2);
              sphere.position.add(separationVector);
              otherSphere.position.sub(separationVector);

              sphere.userData.velocity.add(
                impulse.clone().multiplyScalar(otherSphere.scale.x)
              );
              otherSphere.userData.velocity.add(
                impulse.clone().multiplyScalar(-sphere.scale.x)
              );

              const angularImpulse = normal.multiplyScalar(0.01);
              sphere.userData.angularVelocity.add(angularImpulse);
              otherSphere.userData.angularVelocity.sub(angularImpulse);
            }
          }
        }

        const maxVelocity = 4;
        sphere.userData.velocity.clampLength(-maxVelocity, maxVelocity);
        sphere.position.add(sphere.userData.velocity);

        sphere.rotation.x += sphere.userData.angularVelocity.x;
        sphere.rotation.y += sphere.userData.angularVelocity.y;
        sphere.rotation.z += sphere.userData.angularVelocity.z;

        const randomForce = new THREE.Vector3(
          (Math.random() - 0.5) * 0.035,
          (Math.random() - 0.5) * 0.035,
          (Math.random() - 0.5) * 0.035
        );
        sphere.userData.velocity.add(randomForce);

        sphere.userData.velocity.multiplyScalar(0.98);
        sphere.position.add(sphere.userData.velocity);
      });

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      const width = widthView;
      const height = heightView;

      // Corrected line:
      scaleFactor = Math.min(width, height) / 300; // Now a variable

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", handleResize);

    const renderLoop = animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      cancelAnimationFrame(renderLoop);
    };
  }, [widthView, heightView]);

  return <canvas ref={canvasRef} style={{ width: widthView, height: heightView }} />;
};

export default ThreeScene2;