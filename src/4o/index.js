// 4o

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Initialize the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Set up camera position
camera.position.set(0, 0, 100);

// Cyclone parameters
const numCyclones = 1;
const numParticles = 400;
const cycloneComplexity = 5;  // Similar to dComplexity in original code
const wide = 200;
const high = 200;

// Create an array to hold particles
const particles = [];
const particleMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

// Helper functions for randomness
function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

// Create cyclone logic
class Cyclone {
    constructor() {
        this.points = [];
        for (let i = 0; i < cycloneComplexity + 3; i++) {
            this.points.push(new THREE.Vector3(
                randomRange(-wide, wide),
                randomRange(-high, high),
                randomRange(-wide, wide)
            ));
        }
    }

    update() {
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].x += randomRange(-1, 1);
            this.points[i].y += randomRange(-1, 1);
            this.points[i].z += randomRange(-1, 1);
        }
    }
}

// Create particle logic
class Particle {
    constructor(cyclone) {
        this.geometry = new THREE.SphereGeometry(0.5, 16, 16);
        this.mesh = new THREE.Mesh(this.geometry, particleMaterial);
        this.cyclone = cyclone;
        this.step = Math.random();
        this.update();
        scene.add(this.mesh);
    }

    update() {
        // Update particle position using cyclone points
        const pos = new THREE.Vector3(0, 0, 0);
        const complexity = cycloneComplexity + 2;
        for (let i = 0; i <= complexity; i++) {
            const blend = this.bernstein(i, complexity, this.step);
            pos.add(this.cyclone.points[i].clone().multiplyScalar(blend));
        }
        this.mesh.position.copy(pos);
        this.step += 0.005;
        if (this.step > 1) this.step = 0;
    }

    // Bernstein polynomial for interpolation
    bernstein(i, n, t) {
        return this.factorial(n) / (this.factorial(i) * this.factorial(n - i)) * Math.pow(t, i) * Math.pow(1 - t, n - i);
    }

    factorial(n) {
        if (n === 0) return 1;
        let result = 1;
        for (let i = 1; i <= n; i++) result *= i;
        return result;
    }
}

// Initialize cyclones and particles
const cyclones = [];
for (let i = 0; i < numCyclones; i++) {
    const cyclone = new Cyclone();
    cyclones.push(cyclone);
    for (let j = 0; j < numParticles; j++) {
        particles.push(new Particle(cyclone));
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update cyclones and particles
    cyclones.forEach(cyclone => cyclone.update());
    particles.forEach(particle => particle.update());

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
