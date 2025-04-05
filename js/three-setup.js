// Initialize the application
document.addEventListener('DOMContentLoaded', init);

function init() {
    initThreeJS();
    initChart();
    document.getElementById('start-button').addEventListener('click', startSendingPackets);
    
    // Start polling for data immediately
    startPolling();
}

function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d1a);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.z = 200;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('map-container').appendChild(renderer.domElement);
    
    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.minDistance = 100;
    controls.maxDistance = 500;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create Earth
    createEarth();
    
    // Add our server location marker
    addServerMarker();
    
    // Add legend
    createLegend();
    
    // Position camera to look at server location
    const serverPosition = latLongToVector3(OUR_COMPUTER.latitude, OUR_COMPUTER.longitude, 51);
    camera.position.copy(serverPosition.clone().multiplyScalar(2.5));
    controls.target.copy(serverPosition);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start animation loop
    animate();
}

function createEarth() {
    earthGroup = new THREE.Group();
    scene.add(earthGroup);
    
    // Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');
    const bumpMap = textureLoader.load('https://threejs.org/examples/textures/earth_bumpmap.jpg');
    const specularMap = textureLoader.load('https://threejs.org/examples/textures/earth_specular_2048.jpg');
    
    // Earth geometry and material
    const earthGeometry = new THREE.SphereGeometry(50, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpMap,
        bumpScale: 0.5,
        specularMap: specularMap,
        specular: new THREE.Color(0x333333),
        shininess: 5
    });
    
    earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);
}

function addServerMarker() {
    // Convert lat/long to 3D position
    const serverPosition = latLongToVector3(OUR_COMPUTER.latitude, OUR_COMPUTER.longitude, 51);
    
    // Create marker geometry - increased size for better visibility
    const markerGeometry = new THREE.SphereGeometry(2, 32, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x2196F3,
        emissive: 0x2196F3,
        emissiveIntensity: 1
    });
    
    const serverMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    serverMarker.position.copy(serverPosition);
    earthGroup.add(serverMarker);
    
    // Add text label for server
    const labelDiv = document.createElement('div');
    labelDiv.className = 'location-label server-label';
    labelDiv.textContent = OUR_COMPUTER.name;
    labelDiv.style.backgroundColor = 'rgba(33, 150, 243, 0.8)';
    labelDiv.style.display = 'block'; // Ensure it's visible by default
    document.getElementById('map-container').appendChild(labelDiv);
    
    // Store both marker and label for updates
    window.serverMarker = {
        mesh: serverMarker,
        label: labelDiv,
        worldPosition: serverPosition.clone()
    };
}

function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Slowly rotate the earth
    earthGroup.rotation.y += 0.0005;
    
    // Update controls
    controls.update();
    
    // Update server marker label position
    if (window.serverMarker) {
        // Get the current position of the marker in world space
        const worldPos = window.serverMarker.worldPosition.clone();
        // Apply the earth's rotation
        worldPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), earthGroup.rotation.y);
        
        // Project to screen space
        const vector = worldPos.clone();
        vector.project(camera);
        
        // Convert to screen coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(vector.y * 0.5) + 0.5) * window.innerHeight;
        
        // Check if the point is in front of the camera
        if (vector.z < 1) {
            window.serverMarker.label.style.transform = `translate(${x}px, ${y}px)`;
            window.serverMarker.label.style.display = 'block';
        } else {
            window.serverMarker.label.style.display = 'none';
        }
    }
    
    // Render scene
    renderer.render(scene, camera);
}

function createLegend() {
    const legend = document.createElement('div');
    legend.id = 'legend';
    
    const title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = 'Legend';
    legend.appendChild(title);
    
    const items = [
        { color: '#2196F3', label: 'Server Location' },
        { color: '#00FFFF', label: 'Normal Packet' },
        { color: '#FF0000', label: 'Suspicious Packet' }
    ];
    
    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'legend-item';
        
        const colorDiv = document.createElement('div');
        colorDiv.className = 'legend-color';
        colorDiv.style.backgroundColor = item.color;
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'legend-label';
        labelDiv.textContent = item.label;
        
        itemDiv.appendChild(colorDiv);
        itemDiv.appendChild(labelDiv);
        legend.appendChild(itemDiv);
    });
    
    document.getElementById('map-container').appendChild(legend);
} 