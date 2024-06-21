import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

const ThreeScene = () => {
  const canvasRef = useRef(null);
  const textMeshRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight2.position.set(-10, -20, -10);
    scene.add(pointLight2);

    let scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 400; // Tính toán tỉ lệ scale

    const sphereCount = 50;
    const sphereGeometry = new THREE.SphereGeometry(1 * scaleFactor, 32, 32); // Áp dụng scale cho hình cầu
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0xffcc99,
      specular: 0xffffff,
      shininess: 80,
    });

    const spheres = [];
    for (let i = 0; i < sphereCount; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
      sphere.material.color.setHex(Math.random() * 0xffffff);

      const radius = Math.random() * 2 + 1;
      sphere.scale.set(radius, radius, radius);

      sphere.position.set(
        (Math.random() - 0.5) * 40 * scaleFactor, // Áp dụng scale cho vị trí
        (Math.random() - 0.5) * 40 * scaleFactor,
        (Math.random() - 0.5) * 40 * scaleFactor
      );
      sphere.userData = { velocity: new THREE.Vector3() };
      spheres.push(sphere);
      scene.add(sphere);
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    const fontLoader = new FontLoader();
    const fontPromise = new Promise((resolve, reject) => {
      fontLoader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", // Đường dẫn đến font typeface.json
        (font) => resolve(font),
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"),
        (err) => reject(err)
      );
    });

    fontPromise
      .then((font) => {
        const textGeometry = new TextGeometry("Sev7n", {
          font: font,
          size: 5 * scaleFactor, // Áp dụng scale cho kích thước text
          height: 1 * scaleFactor, // Áp dụng scale cho độ dày text
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.5 * scaleFactor, // Áp dụng scale cho bevel
          bevelSize: 0.3 * scaleFactor,
          bevelOffset: 0,
          bevelSegments: 5,
        });

        const textMaterial = new THREE.MeshPhongMaterial({
          color: 0xffcc00,
          specular: 0xffffff,
          shininess: 100,
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.geometry.center();
        scene.add(textMesh);
        textMeshRef.current = textMesh;
      })
      .catch((err) => {
        console.error("Lỗi khi tải font:", err);
      });

    const animate = () => {
      requestAnimationFrame(animate);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spheres);

      intersects.forEach((intersect) => {
        const sphere = intersect.object;
        const mouseDirection = new THREE.Vector3(
          mouse.x,
          mouse.y,
          0
        ).normalize();
        const pushForce = mouseDirection.multiplyScalar(1);
        sphere.userData.velocity.add(pushForce);
      });

      spheres.forEach((sphere, i) => {
        // Lực hút về trung tâm (Đã sửa)
        if (textMeshRef.current) {
          const directionToCenter = textMeshRef.current.position
            .clone()
            .sub(sphere.position)
            .normalize();
          const distanceToCenter = sphere.position.distanceTo(
            textMeshRef.current.position // Sử dụng textMeshRef.current.position
          );
          const maxDistance = 16 + sphere.scale.x; // Điều chỉnh khoảng cách tối đa tại đây

          if (distanceToCenter > maxDistance) {
            const attractionForce = directionToCenter.multiplyScalar(
              0.002 * (distanceToCenter - maxDistance)
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
              // Bước tách biệt:
              const overlap = minDistance - distance;
              const separationVector = normal.clone().multiplyScalar(overlap / 4);
              sphere.position.add(separationVector);
              otherSphere.position.sub(separationVector);
  
              sphere.userData.velocity.add(
                impulse.clone().multiplyScalar(otherSphere.scale.x)
              );
              otherSphere.userData.velocity.add(
                impulse.clone().multiplyScalar(-sphere.scale.x)
              );
            }
          }
        }

        sphere.userData.velocity.multiplyScalar(0.98);
        sphere.position.add(sphere.userData.velocity);
        //khi vật thể không được tác động thêm chuyển động nhẹ
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

    // Hàm xử lý resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      scaleFactor = Math.min(width, height) / 300; // Cập nhật tỉ lệ scale khi resize

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", handleResize); // Lắng nghe sự kiện resize

    const renderLoop = animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize); // Loại bỏ lắng nghe khi component unmount
      renderer.dispose();
      cancelAnimationFrame(renderLoop);
    };
  }, []);
  return <canvas ref={canvasRef} />;
};

export default ThreeScene;
