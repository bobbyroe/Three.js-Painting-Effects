import * as THREE from "three";
import { ImprovedNoise } from "jsm/math/ImprovedNoise.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 8;
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.dampingFactor = 0.05;
controls.enableDamping = true;

// lights
const sunlight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
sunlight.position.y = 10;
sunlight.position.z = 0.5;
scene.add(sunlight);
sunlight.castShadow = true;
sunlight.shadow.mapSize.width = 4096;
sunlight.shadow.mapSize.height = 4096;
const filllight = new THREE.DirectionalLight(0xffffff, 0.12);
filllight.position.z = 4;
scene.add(filllight);


// Get Square
const squaresGroup = new THREE.Object3D();
function getSquare(pos) {
  let { x, y } = pos;
  let z = 0;
  let targetColor = new THREE.Color(0, 0, 0);
  const emissive =  new THREE.Color(0x000000);
  const highlightedColor =  new THREE.Color(0xFF9900);
  let isHighlighted = false;
  const material = new THREE.MeshStandardMaterial({
    color: 0xF0F0FF,
    flatShading: true,
    emissive,
  });
 
  const sqLength = 0.2;
  const squareShape = new THREE.Shape()
    .moveTo(0, 0)
    .lineTo(0, sqLength)
    .lineTo(sqLength, sqLength)
    .lineTo(sqLength, 0)
    .lineTo(0, 0);
  const extrudeSettings = {
    depth: 0.2,
    bevelEnabled: true,
    bevelSegments: 12,
    steps: 1,
    bevelSize: 0.03,
    bevelThickness: 0.02,
  };
  const geometry = new THREE.ExtrudeGeometry(squareShape, extrudeSettings);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.z = 45 * (Math.PI / 180);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  let ns;
  const nFreq = 0.33;
  const nScale = 0.5;
  let lerpAlpha = 1.0;
  let emisiveIntensity = 0.0;
  function update (t) {
    ns = Noise.noise(mesh.position.x * nFreq, mesh.position.y * nFreq, t);
    mesh.position.z = ns * nScale;
    const distance = mesh.position.distanceTo(mousePos);
    if (distance < 0.5) {
      let hue = t - distance * 0.1;
      mesh.material.color.setHSL(hue, 1.0, 0.5);
      mesh.material.emissive.setHSL(hue, 1.0, 0.5);
      emisiveIntensity = 0.5;
    } else {
      emisiveIntensity -= 0.005;
    }
    mesh.material.emissiveIntensity = Math.max(0.0, emisiveIntensity);
  }
  function setFocused (isFocused) {
    isHighlighted = isFocused;
    targetColor.set(highlightedColor);
    material.emissive.set(targetColor);
    lerpAlpha = 0.0;
  }
  const box = { mesh, update, setFocused };
  mesh.userData.box = box;
  return box;
}

// Squares
const squares = [];
const spacingX = 0.2;
const spacingY = 0.4;
const numCols = 50;
const numRows = 26;
const startX = -5;
const startY = -5;
let offsetY = 0;
for (let i = 0; i < numCols; i += 1) {
  for (let j = 0; j < numRows; j += 1) {
    offsetY = (i % 2) * -spacingX;
    let square = getSquare({
      x: startX + i * spacingX,
      y: offsetY + startY + j * spacingY,
    });
    squares.push(square);
    squaresGroup.add(square.mesh);
  }
}
scene.add(squaresGroup);

const planeGeo = new THREE.PlaneGeometry(12, 12, 12, 12);
const planeMat = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0.0,
  wireframe: true,
});
const drawingPlaneGroup = new THREE.Group();
scene.add(drawingPlaneGroup);
const planeObj = new THREE.Mesh(planeGeo, planeMat);
drawingPlaneGroup.add(planeObj);

function handlePointerMove(evt) {
  pointer.set(
    (evt.clientX / window.innerWidth) * 2 - 1,
    -(evt.clientY / window.innerHeight) * 2 + 1
  );
}
function handlePointerclick (evt) {
  console.log(currentIntersectedObject);
}

const raycaster = new THREE.Raycaster();
const mousePos = new THREE.Vector3(20, 20, 0);
const pointer = new THREE.Vector2();
document.addEventListener( 'mousemove', handlePointerMove );
document.addEventListener( 'click', handlePointerclick );
let currentIntersectedObject = null;

function handleRaycast() {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(
    drawingPlaneGroup.children,
    false
  );
  if (intersects.length > 0) {
    mousePos.copy(intersects[0].point);
  }
}
const Noise = new ImprovedNoise();
const timeScale = 0.0005;
function animate(timeStep) {
  requestAnimationFrame(animate);
  handleRaycast();
  squares.forEach( s => s.update(timeStep * timeScale));
  renderer.render(scene, camera);
  controls.update();
}

animate();