// ThreeScene.js
import { useRef, useEffect } from "react";
import { createSphere } from "./Sphere";
import { createText } from "./Text";
import * as THREE from "three";
import { createScene } from "./Scence";
import { createEnvironment } from "./Environment";

const ThreeScene = ({ widthView, heightView }) => {
  const canvasRef = useRef(null);
  const textMeshRef = useRef(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  useEffect(() => {
    const { scene, camera, renderer,pointLight,pointLight2 } = createScene(widthView, heightView);
    canvasRef.current.appendChild(renderer.domElement);

    const environmentMesh = createEnvironment();
    scene.add(environmentMesh);

    let scaleFactor = Math.min(widthView, heightView) / 400;
    const sphereGeometry = new THREE.SphereGeometry(1 * scaleFactor, 32, 32);
    const texture = new THREE.TextureLoader().load("/public/texture.jpg");
    const sphereMaterial = new THREE.MeshPhongMaterial({
      map: texture,
      specular: 0xffffff,
      shininess: 3000,
    });

    const spheres = [];
    const sphereCount = 50;
    for (let i = 0; i < sphereCount; i++) {
      const sphere = createSphere(sphereGeometry, sphereMaterial, scaleFactor);
      spheres.push(sphere);
      scene.add(sphere);
    }

    const handleMouseMove = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const animate = () => {
      requestAnimationFrame(animate);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(spheres);

      intersects.forEach((intersect) => {
        const sphere = intersect.object;
        const mouseDirection = new THREE.Vector3(mouse.x, mouse.y, 0).normalize();
        const pushForce = mouseDirection.multiplyScalar(1);
        sphere.userData.velocity.add(pushForce);
      });

      // Hiệu ứng đảo mắt
      const targetRotationX = mouse.y * 0.2;
      const targetRotationY = mouse.x * 0.2;
     if(textMeshRef.current){
        textMeshRef.current.rotation.x += (targetRotationX - textMeshRef.current.rotation.x) * 0.1;
        textMeshRef.current.rotation.y += (targetRotationY - textMeshRef.current.rotation.y) * 0.1;
     }
      environmentMesh.rotation.x += (targetRotationX - environmentMesh.rotation.x) * 0.05;
      environmentMesh.rotation.y += (targetRotationY - environmentMesh.rotation.y) * 0.05;
      pointLight.position.x = 20 * Math.sin(targetRotationY);
      pointLight.position.z = 20 * Math.cos(targetRotationY);
      pointLight2.position.x = -20 * Math.sin(targetRotationY);
      pointLight2.position.z = -20 * Math.cos(targetRotationY);

      // Các xử lý khác (vận tốc, va chạm,...)
      spheres.forEach((sphere, i) => {
           // Lực hút về phía trung tâm
           if (textMeshRef.current) {
            // Kiểm tra xem đối tượng văn bản 3D đã được tạo chưa
            const directionToCenter = textMeshRef.current.position // Lấy vị trí của văn bản
              .clone()
              .sub(sphere.position) // Tính vector hướng từ quả cầu đến văn bản
              .normalize(); // Chuẩn hóa vector (độ dài bằng 1)
  
            const distanceToCenter = sphere.position.distanceTo(
              textMeshRef.current.position
            ); // Khoảng cách từ quả cầu đến văn bản
            const maxDistance = 10 + sphere.scale.x; // Khoảng cách tối đa mà lực hút có tác dụng
  
            if (distanceToCenter > maxDistance) {
              // Nếu quả cầu ở xa hơn khoảng cách tối đa
              const attractionForce = directionToCenter.multiplyScalar(
                0.0014 * (distanceToCenter - maxDistance)
              ); // Tính lực hút (tỷ lệ thuận với khoảng cách)
              sphere.userData.velocity.add(attractionForce); // Thêm lực hút vào vận tốc của quả cầu
            }
          }
  
          // Xử lý va chạm giữa các quả cầu
          for (let j = 0; j < spheres.length; j++) {
            if (i !== j) {
              // Không xét va chạm với chính nó
              const otherSphere = spheres[j]; // Quả cầu khác
              const distance = sphere.position.distanceTo(otherSphere.position); // Khoảng cách giữa hai quả cầu
              const minDistance = sphere.scale.x + otherSphere.scale.x; // Khoảng cách tối thiểu (tổng bán kính)
  
              if (distance < minDistance) {
                // Nếu hai quả cầu va chạm
                // Tính toán pháp tuyến và vận tốc tương đối
                const normal = sphere.position
                  .clone()
                  .sub(otherSphere.position)
                  .normalize();
                const relativeVelocity = sphere.userData.velocity
                  .clone()
                  .sub(otherSphere.userData.velocity);
  
                // Tính xung lực để tách hai quả cầu ra
                const impulse = normal.multiplyScalar(
                  (-2 * relativeVelocity.dot(normal)) /
                    (sphere.scale.x + otherSphere.scale.x)
                );
  
                // Tách hai quả cầu ra
                const overlap = minDistance - distance; // Độ chồng lấn
                const separationVector = normal
                  .clone()
                  .multiplyScalar(overlap / 2); // Vector tách
                sphere.position.add(separationVector);
                otherSphere.position.sub(separationVector);
  
                // Điều chỉnh vận tốc của hai quả cầu sau va chạm
                sphere.userData.velocity.add(
                  impulse.clone().multiplyScalar(otherSphere.scale.x)
                );
                otherSphere.userData.velocity.add(
                  impulse.clone().multiplyScalar(-sphere.scale.x)
                );
  
                // Điều chỉnh vận tốc góc của hai quả cầu sau va chạm
                const angularImpulse = normal.multiplyScalar(0.01);
                sphere.userData.angularVelocity.add(angularImpulse);
                otherSphere.userData.angularVelocity.sub(angularImpulse);
              }
            }
          }
          // Xử lý va chạm với khung hình (webview)
          const sphereBox = new THREE.Box3().setFromObject(sphere); // Tạo bounding box cho quả cầu
          // Điều chỉnh giới hạn khung hình
          const canvasBounds = {
            minX: -widthView / 2,
            maxX: widthView / 2,
            minY: -heightView / 2,
            maxY: heightView / 2,
            minZ: -40 * scaleFactor,
            maxZ: 40 * scaleFactor,
          };
          // Chuyển đổi tọa độ của bounding box về hệ tọa độ của khung nhìn (viewport)
          const sphereBoxMin = sphereBox.min.clone().project(camera);
          const sphereBoxMax = sphereBox.max.clone().project(camera);
          // Kiểm tra va chạm với từng cạnh của khung hình
          if (sphereBoxMin.x < -1 || sphereBoxMax.x > 1) {
            sphere.userData.velocity.x *= -1;
            sphere.position.x += sphere.userData.velocity.x * 0.5; // Điều chỉnh vị trí
          }
          if (sphereBoxMin.y < -1 || sphereBoxMax.y > 1) {
            sphere.userData.velocity.y *= -1;
            sphere.position.y += sphere.userData.velocity.y * 0.5; // Điều chỉnh vị trí
          }
          if (
            sphereBox.min.z < canvasBounds.minZ ||
            sphereBox.max.z > canvasBounds.maxZ
          ) {
            sphere.userData.velocity.z *= -1;
            sphere.position.z += sphere.userData.velocity.z * 0.5; // Điều chỉnh vị trí
          }
  
          // Giới hạn vận tốc tối đa (ví dụ: 5)
          const maxVelocity = 4;
          sphere.userData.velocity.clampLength(-maxVelocity, maxVelocity);
          // Cập nhật vị trí và góc quay của quả cầu
          sphere.userData.velocity.multiplyScalar(1); // Giảm vận tốc dần (ma sát)
          sphere.position.add(sphere.userData.velocity); // Cập nhật vị trí
  
          sphere.rotation.x += sphere.userData.angularVelocity.x; // Cập nhật góc quay
          sphere.rotation.y += sphere.userData.angularVelocity.y;
          sphere.rotation.z += sphere.userData.angularVelocity.z;
  
          // Thêm một lực ngẫu nhiên nhỏ để tạo chuyển động tự nhiên hơn
          const randomForce = new THREE.Vector3(
            (Math.random() - 0.5) * 0.035,
            (Math.random() - 0.5) * 0.035,
            (Math.random() - 0.5) * 0.035
          );
          sphere.userData.velocity.add(randomForce);
  
          sphere.userData.velocity.multiplyScalar(0.98); // Giảm vận tốc dần (ma sát)
          sphere.position.add(sphere.userData.velocity); // Cập nhật vị trí
      });

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      scaleFactor = Math.min(widthView, heightView) / 300;
      camera.aspect = widthView / heightView;
      camera.updateProjectionMatrix();
      renderer.setSize(widthView, heightView);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    createText(scaleFactor).then((textMesh) => {
      scene.add(textMesh);
      textMeshRef.current = textMesh;
    });

    const renderLoop = animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      cancelAnimationFrame(renderLoop);
    };
  }, [widthView, heightView]);

  return <canvas ref={canvasRef} style={{ width: widthView, height: heightView }} />;
};

export default ThreeScene;
