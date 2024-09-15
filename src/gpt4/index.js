// GPT-4 

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Scene Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Helper function to add random spread
const randomSpread = (max) => Math.random() * max - max / 2;

// Cyclone Class
class Cyclone {
    constructor(complexity) {
        this.complexity = complexity;
        this.pathPoints = [];
        for (let i = 0; i <= complexity + 2; i++) {
            this.pathPoints.push(new THREE.Vector3(randomSpread(200), randomSpread(200), randomSpread(200)));
        }
        this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
        this.geometry = new THREE.TubeGeometry(this.curve, 100, 2, 8, false);
        this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        scene.add(this.mesh);
    }

    update() {
        // Randomly adjust points and regenerate the geometry
        this.pathPoints.forEach(point => {
            point.add(new THREE.Vector3(randomSpread(5), randomSpread(5), randomSpread(5)));
        });
        this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
        this.mesh.geometry = new THREE.TubeGeometry(this.curve, 100, 2, 8, false);
    }
}

// Create a cyclone
const cyclone = new Cyclone(3);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 500);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    cyclone.update(); // Update the cyclone path
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
