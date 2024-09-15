import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Global variables
const PIx2 = Math.PI * 2;
const PI = Math.PI;
const wide = 200;
const high = 200;

let dCyclones = 1;
let dParticles = 400;
let dSize = 7;
let dComplexity = 3;
let dSpeed = 10;
let dStretch = true;
let dShowCurves = false;

let scene, camera, renderer, controls;
let cyclones = [];
let particles = [];
let fact = [];

// Utility functions
function rsRandi(x) {
    return Math.floor(Math.random() * x);
}

function rsRandf(x) {
    return Math.random() * x;
}

function normalize(vec) {
    const length = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
    if (length === 0) return 0;
    vec.divideScalar(length);
    return length;
}

function factorial(x) {
    if (x === 0) return 1;
    let result = 1;
    for (let i = 2; i <= x; i++) result *= i;
    return result;
}

// Color conversion function
function hsl2rgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return new THREE.Color(r, g, b);
}

class Cyclone {
    constructor() {
        this.targetxyz = Array(dComplexity + 3).fill().map(() => new THREE.Vector3());
        this.xyz = Array(dComplexity + 3).fill().map(() => new THREE.Vector3());
        this.oldxyz = Array(dComplexity + 3).fill().map(() => new THREE.Vector3());
        this.targetWidth = Array(dComplexity + 3).fill(0);
        this.width = Array(dComplexity + 3).fill(0);
        this.oldWidth = Array(dComplexity + 3).fill(0);
        this.targethsl = [0, 0, 0];
        this.hsl = [0, 0, 0];
        this.oldhsl = [0, 0, 0];
        this.xyzChange = Array(dComplexity + 3).fill().map(() => [0, 0]);
        this.widthChange = Array(dComplexity + 3).fill().map(() => [0, 0]);
        this.hslChange = [0, 0];

        this.initializePath();
    }

    initializePath() {
        const lastIndex = dComplexity + 2;
        this.xyz[lastIndex].set(rsRandf(wide * 2) - wide, high, rsRandf(wide * 2) - wide);
        this.xyz[lastIndex - 1].set(this.xyz[lastIndex].x, rsRandf(high / 3) + high / 4, this.xyz[lastIndex].z);

        for (let i = dComplexity; i > 1; i--) {
            this.xyz[i].set(
                this.xyz[i + 1].x + rsRandf(wide) - wide / 2,
                rsRandf(high * 2) - high,
                this.xyz[i + 1].z + rsRandf(wide) - wide / 2
            );
        }

        this.xyz[1].set(
            this.xyz[2].x + rsRandf(wide / 2) - wide / 4,
            -rsRandf(high / 2) - high / 4,
            this.xyz[2].z + rsRandf(wide / 2) - wide / 4
        );

        this.xyz[0].set(
            this.xyz[1].x + rsRandf(wide / 8) - wide / 16,
            -high,
            this.xyz[1].z + rsRandf(wide / 8) - wide / 16
        );

        // Initialize widths
        this.width[lastIndex] = rsRandf(175) + 75;
        this.width[lastIndex - 1] = rsRandf(60) + 15;
        for (let i = dComplexity; i > 1; i--) {
            this.width[i] = rsRandf(25) + 15;
        }
        this.width[1] = rsRandf(25) + 5;
        this.width[0] = rsRandf(15) + 5;

        // Initialize color
        this.hsl = [rsRandf(1), rsRandf(1), 0];
        this.targethsl = [rsRandf(1), rsRandf(1), 1];
        this.hslChange = [0, 10];
    }

    update(frameTime) {
        this.updatePath(frameTime);
        this.updateWidths(frameTime);
        this.updateColor(frameTime);
    }

    updatePath(frameTime) {
        for (let i = 0; i < dComplexity + 3; i++) {
            if (this.xyzChange[i][0] >= this.xyzChange[i][1]) {
                this.oldxyz[i].copy(this.xyz[i]);
                this.generateNewTarget(i);
                this.xyzChange[i][0] = 0;
                this.xyzChange[i][1] = rsRandf(150 / dSpeed) + 75 / dSpeed;
            }

            const between = (this.xyzChange[i][0] / this.xyzChange[i][1]) * PIx2;
            const t = (1 - Math.cos(between)) / 2;
            this.xyz[i].lerpVectors(this.oldxyz[i], this.targetxyz[i], t);
            this.xyzChange[i][0] += frameTime;
        }
    }

    generateNewTarget(i) {
        const lastIndex = dComplexity + 2;
        if (i === lastIndex) {
            this.targetxyz[i].set(rsRandf(wide * 2) - wide, high, rsRandf(wide * 2) - wide);
        } else if (i === lastIndex - 1) {
            this.targetxyz[i].set(this.xyz[i + 1].x, rsRandf(high / 3) + high / 4, this.xyz[i + 1].z);
        } else if (i > 1 && i <= dComplexity) {
            this.targetxyz[i].set(
                this.targetxyz[i + 1].x + (this.targetxyz[i + 1].x - this.targetxyz[i + 2].x) / 2 + rsRandf(wide / 2) - wide / 4,
                (this.targetxyz[i + 1].y + this.targetxyz[i - 1].y) / 2 + rsRandf(high / 8) - high / 16,
                this.targetxyz[i + 1].z + (this.targetxyz[i + 1].z - this.targetxyz[i + 2].z) / 2 + rsRandf(wide / 2) - wide / 4
            );
            this.targetxyz[i].y = Math.max(-high, Math.min(high, this.targetxyz[i].y));
        } else if (i === 1) {
            this.targetxyz[i].set(
                this.targetxyz[2].x + rsRandf(wide / 2) - wide / 4,
                -rsRandf(high / 2) - high / 4,
                this.targetxyz[2].z + rsRandf(wide / 2) - wide / 4
            );
        } else if (i === 0) {
            this.targetxyz[i].set(
                this.xyz[1].x + rsRandf(wide / 8) - wide / 16,
                -high,
                this.xyz[1].z + rsRandf(wide / 8) - wide / 16
            );
        }
    }

    updateWidths(frameTime) {
        for (let i = 0; i < dComplexity + 3; i++) {
            if (this.widthChange[i][0] >= this.widthChange[i][1]) {
                this.oldWidth[i] = this.width[i];
                this.generateNewTargetWidth(i);
                this.widthChange[i][0] = 0;
                this.widthChange[i][1] = rsRandf(50 / dSpeed) + (i > 1 ? 40 : 20) / dSpeed;
            }

            const between = this.widthChange[i][0] / this.widthChange[i][1];
            this.width[i] = this.oldWidth[i] + (this.targetWidth[i] - this.oldWidth[i]) * between;
            this.widthChange[i][0] += frameTime;
        }
    }

    generateNewTargetWidth(i) {
        const lastIndex = dComplexity + 2;
        if (i === lastIndex) {
            this.targetWidth[i] = rsRandf(225) + 75;
        } else if (i === lastIndex - 1) {
            this.targetWidth[i] = rsRandf(100) + 15;
        } else if (i > 1) {
            this.targetWidth[i] = rsRandf(50) + 15;
        } else if (i === 1) {
            this.targetWidth[i] = rsRandf(40) + 5;
        } else if (i === 0) {
            this.targetWidth[i] = rsRandf(30) + 5;
        }
    }

    updateColor(frameTime) {
        if (this.hslChange[0] >= this.hslChange[1]) {
            this.oldhsl = [...this.hsl];
            this.targethsl = [rsRandf(1), rsRandf(1), Math.min(rsRandf(1) + 0.5, 1)];
            this.hslChange[0] = 0;
            this.hslChange[1] = rsRandf(30) + 2;
        }

        const between = this.hslChange[0] / this.hslChange[1];
        for (let i = 0; i < 3; i++) {
            this.hsl[i] = this.oldhsl[i] + (this.targethsl[i] - this.oldhsl[i]) * between;
        }
        this.hslChange[0] += frameTime;
    }
}

class Particle {
    constructor(cyclone) {
        this.cyclone = cyclone;
        this.geometry = new THREE.SphereGeometry(dSize / 4, 3, 2);
        this.material = new THREE.MeshPhongMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        scene.add(this.mesh);
        this.init();
    }

    init() {
        this.width = rsRandf(0.8) + 0.2;
        this.step = 0;
        this.spinAngle = rsRandf(360);
        this.updateColor();
    }

    updateColor() {
        const color = hsl2rgb(...this.cyclone.hsl);
        this.material.color.copy(color);
    }

    update(frameTime) {
        if (this.step > 1) {
            this.init();
        }

        const newPosition = new THREE.Vector3();
        for (let i = 0; i < dComplexity + 3; i++) {
            const blend = fact[dComplexity + 2] / (fact[i] * fact[dComplexity + 2 - i]) *
                          Math.pow(this.step, i) * Math.pow(1 - this.step, dComplexity + 2 - i);
            newPosition.add(this.cyclone.xyz[i].clone().multiplyScalar(blend));
        }

        const dir = new THREE.Vector3();
        for (let i = 0; i < dComplexity + 3; i++) {
            const blend = fact[dComplexity + 2] / (fact[i] * fact[dComplexity + 2 - i]) *
                          Math.pow(this.step - 0.01, i) * Math.pow(1 - (this.step - 0.01), dComplexity + 2 - i);
            dir.add(this.cyclone.xyz[i].clone().multiplyScalar(blend));
        }
        dir.sub(newPosition).normalize();

        const up = new THREE.Vector3(0, 1, 0);
        const crossVec = new THREE.Vector3().crossVectors(dir, up);
        const tiltAngle = -Math.acos(dir.dot(up)) * 180 / PI;

        const i = Math.floor(this.step * (dComplexity + 2));
        const between = (this.step - (i / (dComplexity + 2))) * (dComplexity + 2);
        const cyWidth = this.cyclone.width[i] * (1 - between) + this.cyclone.width[i + 1] * between;

        const newStep = (0.2 * frameTime * dSpeed) / (this.width * this.width * cyWidth);
        this.step += newStep;

        const newSpinAngle = (1500 * frameTime * dSpeed) / (this.width * cyWidth);
        this.spinAngle += newSpinAngle;

        let scale = this.width * cyWidth * newSpinAngle * 0.02;
        const temp = cyWidth * 2 / dSize;
        scale = Math.max(3, Math.min(scale, temp));

        this.mesh.position.copy(newPosition);
        this.mesh.rotation.set(0, this.spinAngle * PI / 180, tiltAngle * PI / 180);
        this.mesh.scale.set(1, 1, dStretch ? scale : 1);

        this.updateColor();
    }
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 50, 3000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.z = wide * 2;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(wide * 2, -high, wide * 2);
    scene.add(directionalLight);

    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement);

    // Initialize factorial array
    for (let i = 0; i < 13; i++) {
        fact[i] = factorial(i);
    }

    // Initialize cyclones and particles
    for (let i = 0; i < dCyclones; i++) {
        cyclones.push(new Cyclone());
        for (let j = 0; j < dParticles; j++) {
            particles.push(new Particle(cyclones[i]));
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    const frameTime = 1 / 60; // Assuming 60 FPS

    for (let i = 0; i < dCyclones; i++) {
        cyclones[i].update(frameTime);
        for (let j = i * dParticles; j < (i + 1) * dParticles; j++) {
            particles[j].update(frameTime);
        }
    }

    if (dShowCurves) {
        drawCurves();
    }

    controls.update();
    renderer.render(scene, camera);
}

function drawCurves() {
    cyclones.forEach(cyclone => {
        const curveGeometry = new THREE.BufferGeometry();
        const points = [];

        for (let step = 0; step <= 1; step += 0.02) {
            const point = new THREE.Vector3();
            for (let i = 0; i < dComplexity + 3; i++) {
                const blend = fact[dComplexity + 2] / (fact[i] * fact[dComplexity + 2 - i]) *
                              Math.pow(step, i) * Math.pow(1 - step, dComplexity + 2 - i);
                point.add(cyclone.xyz[i].clone().multiplyScalar(blend));
            }
            points.push(point);
        }

        curveGeometry.setFromPoints(points);
        const curveMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const curveLine = new THREE.Line(curveGeometry, curveMaterial);
        scene.add(curveLine);

        // Remove the curve after rendering
        setTimeout(() => {
            scene.remove(curveLine);
            curveGeometry.dispose();
            curveMaterial.dispose();
        }, 0);
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

init();
animate();