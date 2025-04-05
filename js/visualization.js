function visualizePacket(packet) {
  const packetPosition = latLongToVector3(
    packet.latitude,
    packet.longitude,
    51
  );
  const serverPosition = latLongToVector3(
    OUR_COMPUTER.latitude,
    OUR_COMPUTER.longitude,
    51
  );

  const packetGeometry = new THREE.SphereGeometry(1.2, 16, 16);
  const packetColor = packet.suspicious_mask ? 0xff0000 : 0x00ffff;
  const packetMaterial = new THREE.MeshPhongMaterial({
    color: packetColor,
    emissive: packetColor,
    emissiveIntensity: 0.7,
    shininess: 100,
    transparent: true,
    opacity: 0.9,
  });

  const packetMesh = new THREE.Mesh(packetGeometry, packetMaterial);
  packetMesh.position.copy(packetPosition);
  earthGroup.add(packetMesh);

  const packetGlowGeometry = new THREE.SphereGeometry(1.8, 16, 16);
  const packetGlowMaterial = new THREE.MeshBasicMaterial({
    color: packetColor,
    transparent: true,
    opacity: 0.4,
  });

  const packetGlow = new THREE.Mesh(packetGlowGeometry, packetGlowMaterial);
  packetGlow.position.copy(packetPosition);
  earthGroup.add(packetGlow);

  const markerGeometry = new THREE.CylinderGeometry(0, 0.8, 2, 0);
  const markerMaterial = new THREE.MeshPhongMaterial({
    color: packetColor,
    emissive: packetColor,
    emissiveIntensity: 0.5,
  });

  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  marker.position.copy(packetPosition);

  marker.lookAt(new THREE.Vector3(0, 0, -5));
  marker.rotateX(Math.PI / 2);
  earthGroup.add(marker);

  const distance = packetPosition.distanceTo(serverPosition);
  const midPoint = new THREE.Vector3().lerpVectors(
    packetPosition,
    serverPosition,
    0.5
  );

  const arcHeightFactor = Math.min(0.35, 0.25 + (distance / 200) * 0.1);
  const arcHeight = distance * arcHeightFactor;

  const controlPoint = midPoint
    .clone()
    .normalize()
    .multiplyScalar(51 + arcHeight);

  const curve = new THREE.QuadraticBezierCurve3(
    packetPosition,
    controlPoint,
    serverPosition
  );

  const points = curve.getPoints(50);
  const trailGeometry = new THREE.BufferGeometry().setFromPoints(points);

  const trailMaterial = new THREE.LineBasicMaterial({
    color: packetColor,
    transparent: true,
    opacity: 0.8,
    linewidth: 3,
  });

  const trail = new THREE.Line(trailGeometry, trailMaterial);

  earthGroup.add(trail);

  const particlesGeometry = new THREE.BufferGeometry();
  const particlePositions = [];
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    const t = i / (particleCount - 1);
    const pos = curve.getPointAt(t);
    particlePositions.push(pos.x, pos.y, pos.z);
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(particlePositions, 3)
  );

  const particlesMaterial = new THREE.PointsMaterial({
    color: packetColor,
    size: 1.5,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  earthGroup.add(particles);

  const labelDiv = document.createElement("div");
  labelDiv.className = "location-label";
  labelDiv.textContent = `${packet.ip_address}\n${
    packet.suspicious_mask ? "Suspicious" : "Normal"
  }`;
  document.getElementById("map-container").appendChild(labelDiv);

  const updateLabelPosition = () => {
    const vector = packetPosition.clone();
    vector.project(camera);
    if (vector.z < 1) {
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
      labelDiv.style.transform = `translate(${x}px, ${y}px)`;
      labelDiv.style.display = "block";
    } else {
      labelDiv.style.display = "none";
    }
  };

  const packetObject = {
    mesh: packetMesh,
    glow: packetGlow,
    marker: marker,
    trail: trail,
    particles: particles,
    curve: curve,
    startTime: Date.now(),
    duration: 3000,
    suspicious: packet.suspicious_mask,
    points: points,
    label: labelDiv,
    updateLabelPosition: updateLabelPosition,
  };

  packetObjects.push(packetObject);

  animatePacket(packetObject);
}

function animatePacket(packetObject) {
  const animate = () => {
    const elapsed = Date.now() - packetObject.startTime;
    const progress = Math.min(elapsed / packetObject.duration, 1);

    if (progress < 1) {
      const position = packetObject.curve.getPointAt(progress);
      packetObject.mesh.position.copy(position);
      packetObject.glow.position.copy(position);

      const remainingPoints = packetObject.points.slice(
        Math.floor(progress * packetObject.points.length)
      );

      if (remainingPoints.length > 1) {
        packetObject.trail.geometry.setFromPoints(remainingPoints);
      }

      const particlePositions = [];
      const particleCount = 15;

      for (let i = 0; i < particleCount; i++) {
        const t = i / (particleCount - 1);
        if (t >= progress) {
          const pos = packetObject.curve.getPointAt(t);
          particlePositions.push(pos.x, pos.y, pos.z);
        }
      }

      if (particlePositions.length > 0) {
        packetObject.particles.geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(particlePositions, 3)
        );
      }

      packetObject.updateLabelPosition();

      requestAnimationFrame(animate);
    } else {
      earthGroup.remove(packetObject.mesh);
      earthGroup.remove(packetObject.glow);
      earthGroup.remove(packetObject.marker);
      earthGroup.remove(packetObject.trail);
      earthGroup.remove(packetObject.particles);

      packetObject.label.remove();
      const index = packetObjects.indexOf(packetObject);
      if (index > -1) {
        packetObjects.splice(index, 1);
      }
    }
  };

  animate();
}
