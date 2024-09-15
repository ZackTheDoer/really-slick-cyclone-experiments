//o1

// index.js
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Parameters
const wide = 200;
const high = 200;
const PIx2 = Math.PI * 2;
const PI = Math.PI;

// User-defined parameters
const dCyclones = 1;
const dParticles = 400;
const dSize = 7;
const dComplexity = 3;
const dSpeed = 10;
const dStretch = true;
const dShowCurves = false;

// Useful random functions
function rsRandf(x) {
    return x * Math.random();
}

// Factorials for Bezier calculations
const fact = [];
for (let i = 0; i <= 12; i++) {
    fact[i] = factorial(i);
}

function factorial(x) {
    if (x === 0) return 1;
    let returnval = 1;
    while (x > 0) {
        returnval *= x;
        x--;
    }
    return returnval;
}

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 50, 3000);
camera.position.z = -(wide * 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Light setup
const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(wide * 2, -high, wide * 2).normalize();
scene.add(directionalLight);

// Particle geometry and material
const particleGeometry = new THREE.SphereGeometry(dSize / 4.0, 8, 6);
const particleMaterial = new THREE.MeshPhongMaterial({ color: 0x777777 });

// Cyclone class
class Cyclone {
    constructor() {
        const complexityPlus3 = dComplexity + 3;

        this.targetxyz = [];
        this.xyz = [];
        this.oldxyz = [];

        for (let i = 0; i < complexityPlus3; i++) {
            this.targetxyz.push(new THREE.Vector3());
            this.xyz.push(new THREE.Vector3());
            this.oldxyz.push(new THREE.Vector3());
        }

        this.xyz[dComplexity + 2].x = rsRandf(wide * 2) - wide;
        this.xyz[dComplexity + 2].y = high;
        this.xyz[dComplexity + 2].z = rsRandf(wide * 2) - wide;

        this.xyz[dComplexity + 1].x = this.xyz[dComplexity + 2].x;
        this.xyz[dComplexity + 1].y = rsRandf(high / 3) + high / 4;
        this.xyz[dComplexity + 1].z = this.xyz[dComplexity + 2].z;

        for (let i = dComplexity; i > 1; i--) {
            this.xyz[i].x = this.xyz[i + 1].x + rsRandf(wide) - wide / 2;
            this.xyz[i].y = rsRandf(high * 2) - high;
            this.xyz[i].z = this.xyz[i + 1].z + rsRandf(wide) - wide / 2;
        }

        this.xyz[1].x = this.xyz[2].x + rsRandf(wide / 2) - wide / 4;
        this.xyz[1].y = -rsRandf(high / 2) - high / 4;
        this.xyz[1].z = this.xyz[2].z + rsRandf(wide / 2) - wide / 4;

        this.xyz[0].x = this.xyz[1].x + rsRandf(wide / 8) - wide / 16;
        this.xyz[0].y = -high;
        this.xyz[0].z = this.xyz[1].z + rsRandf(wide / 8) - wide / 16;

        // Initialize width arrays
        this.targetWidth = [];
        this.width = [];
        this.oldWidth = [];

        this.width[dComplexity + 2] = rsRandf(175.0) + 75.0;
        this.width[dComplexity + 1] = rsRandf(60.0) + 15.0;
        for (let i = dComplexity; i > 1; i--) {
            this.width[i] = rsRandf(25.0) + 15.0;
        }
        this.width[1] = rsRandf(25.0) + 5.0;
        this.width[0] = rsRandf(15.0) + 5.0;

        // Initialize transition stuff
        this.xyzChange = [];
        this.widthChange = [];
        for (let i = 0; i < complexityPlus3; i++) {
            this.xyzChange.push([0.0, 0.0]); // step, total steps
            this.widthChange.push([0.0, 0.0]);
        }

        // Initialize color stuff
        this.hsl = [rsRandf(1.0), rsRandf(1.0), 0.0];
        this.oldhsl = [...this.hsl];
        this.targethsl = [rsRandf(1.0), rsRandf(1.0), 1.0];
        this.hslChange = [0.0, 10.0];
    }

    update(frameTime) {
        let temp, between, diff, direction;
        const point = new THREE.Vector3();
        let step, blend;

        // Update cyclone's path
        temp = dComplexity + 2;
        if (this.xyzChange[temp][0] >= this.xyzChange[temp][1]) {
            this.oldxyz[temp].copy(this.xyz[temp]);
            this.targetxyz[temp].x = rsRandf(wide * 2) - wide;
            this.targetxyz[temp].y = high;
            this.targetxyz[temp].z = rsRandf(wide * 2) - wide;
            this.xyzChange[temp][0] = 0.0;
            this.xyzChange[temp][1] = rsRandf(150.0 / dSpeed) + 75.0 / dSpeed;
        }
        temp = dComplexity + 1;
        if (this.xyzChange[temp][0] >= this.xyzChange[temp][1]) {
            this.oldxyz[temp].copy(this.xyz[temp]);
            this.targetxyz[temp].x = this.xyz[temp + 1].x;
            this.targetxyz[temp].y = rsRandf(high / 3) + high / 4;
            this.targetxyz[temp].z = this.xyz[temp + 1].z;
            this.xyzChange[temp][0] = 0.0;
            this.xyzChange[temp][1] = rsRandf(100.0 / dSpeed) + 75.0 / dSpeed;
        }
        for (let i = dComplexity; i > 1; i--) {
            if (this.xyzChange[i][0] >= this.xyzChange[i][1]) {
                this.oldxyz[i].copy(this.xyz[i]);
                this.targetxyz[i].x = this.targetxyz[i + 1].x + (this.targetxyz[i + 1].x - this.targetxyz[i + 2].x) / 2.0 + rsRandf(wide / 2) - wide / 4;
                this.targetxyz[i].y = (this.targetxyz[i + 1].y + this.targetxyz[i - 1].y) / 2.0 + rsRandf(high / 8) - high / 16;
                this.targetxyz[i].z = this.targetxyz[i + 1].z + (this.targetxyz[i + 1].z - this.targetxyz[i + 2].z) / 2.0 + rsRandf(wide / 2) - wide / 4;
                if (this.targetxyz[i].y > high) this.targetxyz[i].y = high;
                if (this.targetxyz[i].y < -high) this.targetxyz[i].y = -high;
                this.xyzChange[i][0] = 0.0;
                this.xyzChange[i][1] = rsRandf(75.0 / dSpeed) + 50.0 / dSpeed;
            }
        }
        if (this.xyzChange[1][0] >= this.xyzChange[1][1]) {
            this.oldxyz[1].copy(this.xyz[1]);
            this.targetxyz[1].x = this.targetxyz[2].x + rsRandf(wide / 2) - wide / 4;
            this.targetxyz[1].y = -rsRandf(high / 2) - high / 4;
            this.targetxyz[1].z = this.targetxyz[2].z + rsRandf(wide / 2) - wide / 4;
            this.xyzChange[1][0] = 0.0;
            this.xyzChange[1][1] = rsRandf(50.0 / dSpeed) + 30.0 / dSpeed;
        }
        if (this.xyzChange[0][0] >= this.xyzChange[0][1]) {
            this.oldxyz[0].copy(this.xyz[0]);
            this.targetxyz[0].x = this.xyz[1].x + rsRandf(wide / 8) - wide / 16;
            this.targetxyz[0].y = -high;
            this.targetxyz[0].z = this.xyz[1].z + rsRandf(wide / 8) - wide / 16;
            this.xyzChange[0][0] = 0.0;
            this.xyzChange[0][1] = rsRandf(100.0 / dSpeed) + 75.0 / dSpeed;
        }
        for (let i = 0; i < dComplexity + 3; i++) {
            between = this.xyzChange[i][0] / this.xyzChange[i][1];
            between = (1.0 - Math.cos(between * PIx2)) / 2.0;
            this.xyz[i].lerpVectors(this.oldxyz[i], this.targetxyz[i], between);
            this.xyzChange[i][0] += frameTime;
        }

        // Update cyclone's widths
        temp = dComplexity + 2;
        if (this.widthChange[temp][0] >= this.widthChange[temp][1]) {
            this.oldWidth[temp] = this.width[temp];
            this.targetWidth[temp] = rsRandf(225.0) + 75.0;
            this.widthChange[temp][0] = 0.0;
            this.widthChange[temp][1] = rsRandf(50.0 / dSpeed) + 50.0 / dSpeed;
        }
        temp = dComplexity + 1;
        if (this.widthChange[temp][0] >= this.widthChange[temp][1]) {
            this.oldWidth[temp] = this.width[temp];
            this.targetWidth[temp] = rsRandf(100.0) + 15.0;
            this.widthChange[temp][0] = 0.0;
            this.widthChange[temp][1] = rsRandf(50.0 / dSpeed) + 50.0 / dSpeed;
        }
        for (let i = dComplexity; i > 1; i--) {
            if (this.widthChange[i][0] >= this.widthChange[i][1]) {
                this.oldWidth[i] = this.width[i];
                this.targetWidth[i] = rsRandf(50.0) + 15.0;
                this.widthChange[i][0] = 0.0;
                this.widthChange[i][1] = rsRandf(50.0 / dSpeed) + 40.0 / dSpeed;
            }
        }
        if (this.widthChange[1][0] >= this.widthChange[1][1]) {
            this.oldWidth[1] = this.width[1];
            this.targetWidth[1] = rsRandf(40.0) + 5.0;
            this.widthChange[1][0] = 0.0;
            this.widthChange[1][1] = rsRandf(50.0 / dSpeed) + 30.0 / dSpeed;
        }
        if (this.widthChange[0][0] >= this.widthChange[0][1]) {
            this.oldWidth[0] = this.width[0];
            this.targetWidth[0] = rsRandf(30.0) + 5.0;
            this.widthChange[0][0] = 0.0;
            this.widthChange[0][1] = rsRandf(50.0 / dSpeed) + 20.0 / dSpeed;
        }
        for (let i = 0; i < dComplexity + 3; i++) {
            between = this.widthChange[i][0] / this.widthChange[i][1];
            this.width[i] = THREE.MathUtils.lerp(this.oldWidth[i], this.targetWidth[i], between);
            this.widthChange[i][0] += frameTime;
        }

        // Update cyclone's color
        if (this.hslChange[0] >= this.hslChange[1]) {
            this.oldhsl = [...this.hsl];
            this.targethsl = [rsRandf(1.0), rsRandf(1.0), Math.min(rsRandf(1.0) + 0.5, 1.0)];
            this.hslChange[0] = 0.0;
            this.hslChange[1] = rsRandf(30.0) + 2.0;
        }
        between = this.hslChange[0] / this.hslChange[1];
        diff = this.targethsl[0] - this.oldhsl[0];
        direction = 0;
        if ((this.targethsl[0] > this.oldhsl[0] && diff > 0.5) || (this.targethsl[0] < this.oldhsl[0] && diff < -0.5)) {
            direction = diff > 0.5 ? 1 : 0;
        }
        this.hsl[0] = hslTween(this.oldhsl[0], this.targethsl[0], between, direction);
        this.hsl[1] = THREE.MathUtils.lerp(this.oldhsl[1], this.targethsl[1], between);
        this.hsl[2] = THREE.MathUtils.lerp(this.oldhsl[2], this.targethsl[2], between);
        this.hslChange[0] += frameTime;

        // Optional: Show curves (not implemented for simplicity)
    }
}

// Particle class
class Particle {
    constructor(cyclone) {
        this.cy = cyclone;
        this.init();

        this.mesh = new THREE.Mesh(particleGeometry, particleMaterial.clone());
        scene.add(this.mesh);
    }

    init() {
        this.width = rsRandf(0.8) + 0.2;
        this.step = 0.0;
        this.spinAngle = rsRandf(360);
        // Set initial color
        const color = new THREE.Color();
        color.setHSL(this.cy.hsl[0], this.cy.hsl[1], this.cy.hsl[2]);
       // this.mesh.material.color = color;
    }

    update(frameTime) {
        const point = new THREE.Vector3();
        let blend, scale, newStep, newSpinAngle, cyWidth, between;
        const dir = new THREE.Vector3();
        const dirPrev = new THREE.Vector3();
        const crossVec = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        let tiltAngle;

        if (this.step > 1.0) {
            this.init();
        }

        // Calculate current position on Bezier curve
        point.set(0, 0, 0);
        for (let i = 0; i < dComplexity + 3; i++) {
            blend = (fact[dComplexity + 2] / (fact[i] * fact[dComplexity + 2 - i])) *
                Math.pow(this.step, i) * Math.pow(1 - this.step, dComplexity + 2 - i);
            point.addScaledVector(this.cy.xyz[i], blend);
        }
        this.mesh.position.copy(point);

        // Calculate direction for tilt
        const prevStep = this.step - 0.01;
        dirPrev.set(0, 0, 0);
        for (let i = 0; i < dComplexity + 3; i++) {
            blend = (fact[dComplexity + 2] / (fact[i] * fact[dComplexity + 2 - i])) *
                Math.pow(prevStep, i) * Math.pow(1 - prevStep, dComplexity + 2 - i);
            dirPrev.addScaledVector(this.cy.xyz[i], blend);
        }
        dir.copy(point).sub(dirPrev).normalize();
        crossVec.crossVectors(dir, up).normalize();
        tiltAngle = -Math.acos(dir.dot(up)) * 180.0 / PI;

        // Determine width
        let i = Math.floor(this.step * (dComplexity + 2));
        if (i >= dComplexity + 2) i = dComplexity + 1;
        between = (this.step - (i / (dComplexity + 2))) * (dComplexity + 2);
        cyWidth = this.cy.width[i] * (1.0 - between) + this.cy.width[i + 1] * between;

        // Update step and spin angle
        newStep = (0.2 * frameTime * dSpeed) / (this.width * this.width * cyWidth);
        this.step += newStep;
        newSpinAngle = (1500.0 * frameTime * dSpeed) / (this.width * cyWidth);
        this.spinAngle += newSpinAngle;

        // Stretch scaling
        if (dStretch) {
            scale = this.width * cyWidth * newSpinAngle * 0.02;
            const temp = (cyWidth * 2.0) / dSize;
            if (scale > temp) scale = temp;
            if (scale < 3.0) scale = 3.0;
        } else {
            scale = 1.0;
        }

        // Apply transformations
        this.mesh.scale.set(1.0, 1.0, scale);
        this.mesh.rotation.set(0, THREE.MathUtils.degToRad(this.spinAngle), 0);
        this.mesh.rotateOnAxis(crossVec, THREE.MathUtils.degToRad(tiltAngle));

        // Update color
        const color = new THREE.Color();
        color.setHSL(this.cy.hsl[0], this.cy.hsl[1], this.cy.hsl[2]);
        this.mesh.material.color = color;
    }
}

// Helper function for HSL tweening
function hslTween(hsl1, hsl2, between, direction) {
    let h;
    if (direction) {
        h = hsl1 + (hsl2 - hsl1 - 1) * between;
        if (h < 0) h += 1;
    } else {
        h = hsl1 + (hsl2 - hsl1) * between;
        if (h > 1) h -= 1;
    }
    return h;
}

// Initialize cyclones and particles
const cyclones = [];
const particles = [];
for (let i = 0; i < dCyclones; i++) {
    cyclones[i] = new Cyclone();
    for (let j = i * dParticles; j < (i + 1) * dParticles; j++) {
        particles[j] = new Particle(cyclones[i]);
    }
}

// Animation loop
let lastTime = Date.now();
function animate() {
    requestAnimationFrame(animate);

    // Update time
    const now = Date.now();
    const frameTime = (now - lastTime) / 1000.0; // in seconds
    lastTime = now;

    // Update cyclones and particles
    for (let i = 0; i < dCyclones; i++) {
        cyclones[i].update(frameTime);
    }
    for (let i = 0; i < particles.length; i++) {
        particles[i].update(frameTime);
    }

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
