import { useRef, useEffect } from "react";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

const ThreeScene2 = ({ widthView = window.innerWidth, heightView  = window.innerHeight}) => {
  // Refs để lưu trữ các phần tử DOM và đối tượng Three.js
  const canvasRef = useRef(null); // Tham chiếu tới canvas HTML
  const textMeshRef = useRef(null); // Tham chiếu tới đối tượng văn bản 3D

  useEffect(() => {
    // Thiết lập cảnh 3D
    const scene = new THREE.Scene(); // Tạo scene (khung cảnh)
    const camera = new THREE.PerspectiveCamera(
      75,
      widthView / heightView,
      0.1,
      1000
    ); // Tạo camera với góc nhìn phối cảnh
    camera.position.z = 50; // Đặt vị trí camera cách xa vật thể 50 đơn vị

    // Thiết lập renderer (bộ render)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current, // Render vào phần tử canvas đã tham chiếu
      antialias: true, // Bật khử răng cưa để hình ảnh mịn hơn
      alpha: true, // Cho phép nền trong suốt
    });
    renderer.setSize(widthView, heightView);  // Đặt kích thước renderer bằng kích thước cửa sổ
    renderer.setPixelRatio(window.devicePixelRatio); // Đảm bảo chất lượng hình ảnh tốt trên màn hình độ phân giải cao
    renderer.setClearColor(0x000000, 0); // Đặt màu nền trong suốt

    // Tạo môi trường (environment)
    const environmentGeometry = new THREE.SphereGeometry(80, 64, 64);
    const environmentMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide, // Render mặt trong của hình cầu
      map: new THREE.TextureLoader().load("/public/enviromnet.jpg"), // Sử dụng texture cho môi trường
    });
    const environmentMesh = new THREE.Mesh(
      environmentGeometry,
      environmentMaterial
    );
    scene.add(environmentMesh);

    // Ánh sáng
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight2.position.set(-10, -20, -10);
    scene.add(pointLight2);

    // Tạo các quả cầu
    let scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 400; // Tính toán hệ số scale dựa trên kích thước cửa sổ

    const sphereCount = 50; // Số lượng quả cầu
    const sphereGeometry = new THREE.SphereGeometry(1 * scaleFactor, 32, 32); // Tạo hình học cho quả cầu (có áp dụng scale)
    const textureLoader = new THREE.TextureLoader(); // Tạo bộ tải texture (hình ảnh)
    const texture = textureLoader.load("/public/texture.jpg"); // Tải texture từ file

    const sphereMaterial = new THREE.MeshPhongMaterial({
      // Tạo vật liệu cho quả cầu
      map: texture, // Ánh xạ texture lên quả cầu
      specular: 0xffffff, // Màu phản chiếu
      shininess: 3000, // Độ bóng
    });

    const spheres = []; // Mảng lưu trữ các quả cầu
    for (let i = 0; i < sphereCount; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone()); // Tạo một quả cầu mới

      // Đặt kích thước, vị trí và vận tốc ban đầu ngẫu nhiên cho quả cầu
      const radius = Math.random() * 2 + 1;
      sphere.scale.set(radius, radius, radius);
      sphere.position.set(
        (Math.random() - 0.5) * 40 * scaleFactor, // Nhân scaleFactor để điều chỉnh kích thước
        (Math.random() - 0.5) * 40 * scaleFactor,
        (Math.random() - 0.5) * 40 * scaleFactor
      );
      sphere.userData = {
        // Lưu trữ thông tin riêng của quả cầu (vận tốc, vận tốc góc)
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
      };

      spheres.push(sphere); // Thêm quả cầu vào mảng
      scene.add(sphere); // Thêm quả cầu vào scene
    }

    // Tạo chữ 3D "Sev7n"
    const raycaster = new THREE.Raycaster(); // Tạo tia chiếu để phát hiện tương tác chuột
    const mouse = new THREE.Vector2(); // Lưu trữ vị trí chuột

    const onMouseMove = (event) => {
      // Hàm xử lý sự kiện di chuyển chuột
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1; // Chuẩn hóa tọa độ chuột
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const fontLoader = new FontLoader(); // Tạo bộ tải font
    const fontPromise = new Promise((resolve, reject) => {
      // Tải font chữ từ file
      fontLoader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        (font) => resolve(font), // Khi tải thành công, truyền font vào resolve
        (xhr) => console.log((xhr.loaded / xhr.total) * 100 + "% loaded"), // Hiển thị tiến trình tải
        (err) => reject(err) // Khi tải thất bại, truyền lỗi vào reject
      );
    });

    fontPromise // Sau khi tải font thành công...
      .then((font) => {
        const textGeometry = new TextGeometry("Sev7n", {
          // Tạo hình học cho văn bản 3D
          font: font,
          size: 5 * scaleFactor, // Kích thước chữ
          height: 1 * scaleFactor, // Độ dày chữ
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.5 * scaleFactor,
          bevelSize: 0.3 * scaleFactor,
          bevelOffset: 0,
          bevelSegments: 5,
        });

        const textMaterial = new THREE.MeshPhongMaterial({
          // Tạo vật liệu cho văn bản 3D
          color: 0xffcc00, // Màu vàng
          specular: 0xffffff, // Màu phản chiếu
          shininess: 1000, // Độ bóng
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial); // Tạo đối tượng văn bản 3D
        textMesh.geometry.center(); // Căn giữa đối tượng trong scene
        scene.add(textMesh); // Thêm văn bản vào scene
        textMeshRef.current = textMesh; // Lưu trữ tham chiếu tới đối tượng văn bản
      })
      .catch((err) => {
        console.error("Error loading font:", err); // Xử lý lỗi nếu tải font thất bại
      });

    // Vòng lặp animation (hoạt ảnh)
    const animate = () => {
      requestAnimationFrame(animate); // Yêu cầu trình duyệt gọi lại hàm này ở frame tiếp theo

      // Tương tác chuột
      raycaster.setFromCamera(mouse, camera); // Thiết lập tia chiếu từ camera dựa trên vị trí chuột
      const intersects = raycaster.intersectObjects(spheres); // Tìm các quả cầu bị tia chiếu cắt qua

      intersects.forEach((intersect) => {
        // Duyệt qua các quả cầu bị cắt
        const sphere = intersect.object;
        const mouseDirection = new THREE.Vector3(
          mouse.x,
          mouse.y,
          0
        ).normalize(); // Vector hướng từ chuột
        const pushForce = mouseDirection.multiplyScalar(1); // Tính lực đẩy
        sphere.userData.velocity.add(pushForce); // Thêm lực đẩy vào vận tốc của quả cầu
      });
      // Hiệu ứng đảo mắt khi di chuyển chuột
      if (textMeshRef.current) {
        const targetRotationX = mouse.y * 0.2; // Điều chỉnh độ nhạy theo trục X
        const targetRotationY = mouse.x * 0.2; // Điều chỉnh độ nhạy theo trục Y

        // Xoay textMesh
        textMeshRef.current.rotation.x +=
          (targetRotationX - textMeshRef.current.rotation.x) * 0.1; // Dần dần xoay về vị trí mục tiêu
        textMeshRef.current.rotation.y +=
          (targetRotationY - textMeshRef.current.rotation.y) * 0.1;

        // Xoay môi trường (environment)
        environmentMesh.rotation.x +=
          (targetRotationX - environmentMesh.rotation.x) * 0.05; // Xoay chậm hơn textMesh
        environmentMesh.rotation.y +=
          (targetRotationY - environmentMesh.rotation.y) * 0.05;

        // Xoay ánh sáng
        pointLight.position.x = 20 * Math.sin(targetRotationY);
        pointLight.position.z = 20 * Math.cos(targetRotationY);
        pointLight2.position.x = -20 * Math.sin(targetRotationY);
        pointLight2.position.z = -20 * Math.cos(targetRotationY);
      }
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

      renderer.render(scene, camera); // Render (vẽ) lại scene
    };

    // Xử lý sự kiện thay đổi kích thước cửa sổ
    const handleResize = () => {
      const width = widthView;
      const height = heightView;

      scaleFactor = Math.min(width, height) / 300; // Cập nhật hệ số scale

      camera.aspect = width / height; // Điều chỉnh tỷ lệ khung hình của camera
      camera.updateProjectionMatrix(); // Cập nhật ma trận chiếu của camera

      renderer.setSize(width, height); // Cập nhật kích thước renderer
      renderer.setPixelRatio(window.devicePixelRatio); // Đảm bảo chất lượng hình ảnh
    };

    // Đăng ký các sự kiện
    window.addEventListener("mousemove", onMouseMove); // Sự kiện di chuyển chuột
    window.addEventListener("resize", handleResize); // Sự kiện thay đổi kích thước cửa sổ

    const renderLoop = animate(); // Bắt đầu vòng lặp animation

    // Dọn dẹp khi component bị unmount
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose(); // Giải phóng tài nguyên của renderer
      cancelAnimationFrame(renderLoop); // Dừng vòng lặp animation
    };
  }, [widthView,heightView]); // useEffect chỉ chạy một lần khi component được mount

  return <canvas ref={canvasRef} style={{ widthView, heightView }}/>; // Trả về phần tử canvas để Three.js render vào
};

export default ThreeScene2;

