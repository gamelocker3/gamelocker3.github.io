// Inisialisasi Three.js scene, camera, renderer, dan lainnya
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.5, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Memuat audio listener dan audio untuk BGM
const listener = new THREE.AudioListener();
camera.add(listener);

const bgm = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('bgm.mp3', function(buffer) {
    bgm.setBuffer(buffer);
    bgm.setLoop(true);    // Musik diputar berulang
    bgm.setVolume(0.5);   // Atur volume sesuai keinginan (0.0 - 1.0)
    bgm.play();           // Memulai musik
});

// Memuat tekstur rumput dan dinding
const textureLoader = new THREE.TextureLoader();
const grassTexture = textureLoader.load('s.png');
grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(50, 50);

const wallTexture = textureLoader.load('wall.png');
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(1, 10); // Menyesuaikan tekstur untuk gedung

const rockTexture = textureLoader.load('rock.png');
rockTexture.wrapS = rockTexture.wrapT = THREE.RepeatWrapping;
rockTexture.repeat.set(1, 10); // Menyesuaikan tekstur untuk gedung

const pTexture = textureLoader.load('p.png');
pTexture.wrapS = pTexture.wrapT = THREE.RepeatWrapping;
pTexture.repeat.set(1, 10); // Menyesuaikan tekstur untuk gedung

const daunTexture = textureLoader.load('daun.png');
daunTexture.wrapS = daunTexture.wrapT = THREE.RepeatWrapping;
daunTexture.repeat.set(1, 10); // Menyesuaikan tekstur untuk gedung

// Membuat terrain datar dengan tekstur rumput
function createFlatTerrain() {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshBasicMaterial({
        map: grassTexture,
        side: THREE.DoubleSide,
    });
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);
}

createFlatTerrain();

// Membuat grid
function createGrid(size, divisions) {
    const gridHelper = new THREE.GridHelper(size, divisions, 0x000000, 0x000000);
    scene.add(gridHelper);
}
createGrid(2000, 200);

const cubeGeometry = new THREE.BoxGeometry(0, 0, 0);
const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 1;
scene.add(cube);

// Pencahayaan
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

camera.position.set(cube.position.x, cube.position.y / 2, cube.position.z + 5); // Low angle camera
camera.lookAt(cube.position);

document.getElementById('move').addEventListener('click', () => {
    
    new TWEEN.Tween(initialPosition)
        .to(targetPosition, 1000)
        .onUpdate(() => {
            cube.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
            camera.position.set(cube.position.x, cube.position.y / 2, cube.position.z + 5); // Update camera position with low angle
            camera.lookAt(cube.position);
        })
        .start();
});



const treePositions = [];
const rockPositions = [];
const buildingPositions = [];

function isPositionOccupied(x, z, positions, minDistance = 5) {
    return positions.some(pos => {
        const dx = pos.x - x;
        const dz = pos.z - z;
        return Math.sqrt(dx * dx + dz * dz) < minDistance;
    });
}
// Inisialisasi scene, kamera, renderer, dan lain-lain seperti sebelumnya...

// Array untuk menyimpan bounding box setiap objek
const collisionBoxes = [];

// Fungsi untuk membuat bounding box untuk objek
function addCollisionBox(object) {
    const box = new THREE.Box3().setFromObject(object);
    collisionBoxes.push(box);
}

// Update bounding box setiap kali objek dipindahkan
function updateCollisionBox(object, index) {
    collisionBoxes[index].setFromObject(object);
}

// Membuat terrain datar dan objek lainnya seperti sebelumnya
createFlatTerrain();
createGrid(2000, 200);

// Fungsi untuk menambah objek dengan bounding box
function addTree(x, z) {
    // Membuat pohon seperti sebelumnya
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ map: pTexture });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 0.5, z);
    scene.add(trunk);

    const leavesGeometry = new THREE.SphereGeometry(1, 16, 16);
    const leavesMaterial = new THREE.MeshLambertMaterial({ map: daunTexture });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 2.5, z);
    scene.add(leaves);

    // Tambah bounding box pohon ke dalam array
    addCollisionBox(trunk);
}

function addRock(x, z) {
    const rockGeometry = new THREE.SphereGeometry(0.5, 8, 9);
    const rockMaterial = new THREE.MeshLambertMaterial({ map: rockTexture });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.2, z);
    scene.add(rock);

    // Tambah bounding box batu ke dalam array
    addCollisionBox(rock);
}

function addBuilding(x, z) {
    const buildingGeometry = new THREE.BoxGeometry(6, 40, 6);
    const buildingMaterial = new THREE.MeshLambertMaterial({ map: wallTexture });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.set(x, 10, z);
    scene.add(building);

    // Tambah bounding box gedung ke dalam array
    addCollisionBox(building);
}

// Generate objek dengan posisi acak dan tanpa overlap
for (let i = 0; i < 20; i++) {
    let x, z;

    do {
        x = (Math.random() - 0.5) * 90;
        z = (Math.random() - 0.5) * 90;
    } while (isPositionOccupied(x, z, treePositions));
    addTree(x, z);

    do {
        x = (Math.random() - 0.5) * 90;
        z = (Math.random() - 0.5) * 90;
    } while (isPositionOccupied(x, z, treePositions) || isPositionOccupied(x, z, rockPositions));
    addRock(x, z);

    do {
        x = (Math.random() - 0.5) * 90;
        z = (Math.random() - 0.5) * 90;
    } while (isPositionOccupied(x, z, treePositions) || isPositionOccupied(x, z, rockPositions) || isPositionOccupied(x, z, buildingPositions));
    addBuilding(x, z);
}

// Fungsi untuk mengecek tabrakan
function checkCollision(newPosition) {
    const playerBox = new THREE.Box3().setFromObject(cube);
    playerBox.translate(newPosition.clone().sub(cube.position)); // Prediksi posisi baru

    // Cek tabrakan dengan bounding box lain
    for (const box of collisionBoxes) {
        if (playerBox.intersectsBox(box)) {
            return true; // Tabrakan terjadi
        }
    }
    return false; // Tidak ada tabrakan
}

// Modifikasi fungsi untuk gerakan maju dengan deteksi tabrakan
function moveForward(distance) {
    const direction = new THREE.Vector3(Math.sin(cube.rotation.y), 0, Math.cos(cube.rotation.y)).normalize();
    const newPosition = cube.position.clone().addScaledVector(direction, distance);

    if (!checkCollision(newPosition)) {
        cube.position.copy(newPosition);

        camera.position.set(
            cube.position.x - Math.sin(cube.rotation.y) * 5,
            cube.position.y / 2,
            cube.position.z - Math.cos(cube.rotation.y) * 5
        );
        camera.lookAt(cube.position);
    }
}

// Modifikasi fungsi untuk gerakan mundur dengan deteksi tabrakan
function moveBackward(distance) {
    const direction = new THREE.Vector3(-Math.sin(cube.rotation.y), 0, -Math.cos(cube.rotation.y)).normalize();
    const newPosition = cube.position.clone().addScaledVector(direction, distance);

    if (!checkCollision(newPosition)) {
        cube.position.copy(newPosition);

        camera.position.set(
            cube.position.x - Math.sin(cube.rotation.y) * 5,
            cube.position.y / 2,
            cube.position.z - Math.cos(cube.rotation.y) * 5
        );
        camera.lookAt(cube.position);
    }
}

// Fungsi animasi seperti sebelumnya
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}

animate();

document.getElementById('up').addEventListener('click', () => {
    moveForward(1);
});

document.getElementById('down').addEventListener('click', () => {
    moveBackward(1);
});

document.getElementById('left').addEventListener('click', () => {
    cube.rotation.y += Math.PI / 50;
    camera.position.x = cube.position.x - Math.sin(cube.rotation.y) * 5;
    camera.position.z = cube.position.z - Math.cos(cube.rotation.y) * 5;
    camera.position.y = cube.position.y / 2; // Maintain low angle
    camera.lookAt(cube.position);
});

document.getElementById('right').addEventListener('click', () => {
    cube.rotation.y -= Math.PI / 50;
    camera.position.x = cube.position.x - Math.sin(cube.rotation.y) * 5;
    camera.position.z = cube.position.z - Math.cos(cube.rotation.y) * 5;
    camera.position.y = cube.position.y / 2; // Maintain low angle
    camera.lookAt(cube.position);
});

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}

animate();

// Kontrol Kamera 360°
let isMouseDown = false;
let previousMousePosition = { x: 0, y: 0 };

window.addEventListener('mousedown', (event) => {
    isMouseDown = true;
});

window.addEventListener('mouseup', () => {
    isMouseDown = false;
});

window.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y,
        };

        const angle = 0.005;

        camera.rotation.y -= deltaMove.x * angle;
        camera.rotation.x -= deltaMove.y * angle;

        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }

    previousMousePosition = {
        x: event.clientX,
        y: event.clientY,
    };
});

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
// Menambahkan penghitung item
let itemCounter = 8;

// Fungsi untuk membuat item
// Fungsi untuk membuat item sebagai sprite 2D
function createItem(x, z) {
    const spriteTexture = textureLoader.load('item.png'); // Load the item texture
    const spriteMaterial = new THREE.SpriteMaterial({ map: spriteTexture });
    const item = new THREE.Sprite(spriteMaterial);

    item.position.set(x, 0.5, z); // Set item position
    item.scale.set(2, 2, 1); // Adjust the size of the sprite
    scene.add(item);

    // Menyimpan item dalam array posisi
    itemPositions.push({ object: item, x, z });
}

// Array untuk menyimpan posisi item yang bisa diambil
const itemPositions = [];

// Fungsi untuk memeriksa apakah pemain dekat dengan item dan mengambilnya
function checkItemPickup() {
    const playerPosition = cube.position;

    itemPositions.forEach((item, index) => {
        const distance = playerPosition.distanceTo(item.object.position);

        // Jika pemain dekat dengan item (misalnya dalam jarak 2 unit)
        if (distance < 2) {
            // Mengambil item
            console.log('Item diambil!');
            scene.remove(item.object); // Menghapus item dari dunia
            itemPositions.splice(index, 1); // Menghapus item dari array

            // Mengupdate penghitung item
            itemCounter--;
            document.getElementById('itemCounter').textContent = itemCounter;
        }
    });
}

// Menambahkan beberapa item acak ke dunia
for (let i = 0; i < 10; i++) {
    let x, z;
    do {
        x = (Math.random() - 0.5) * 90;
        z = (Math.random() - 0.5) * 90;
    } while (isPositionOccupied(x, z, treePositions) || isPositionOccupied(x, z, rockPositions) || isPositionOccupied(x, z, buildingPositions));
    createItem(x, z);
}

// Menambahkan kontrol tombol untuk mengambil item
document.getElementById('takeItem').addEventListener('click', () => {
    checkItemPickup(); // Memeriksa apakah ada item yang dapat diambil
});

// Fungsi animasi
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    renderer.render(scene, camera);
}

animate();
// Timer Countdown
let timerDuration = 8 * 60; // Durasi dalam detik (8 menit)
const timerDisplay = document.getElementById('timer');

// Fungsi untuk mengupdate tampilan timer
function updateTimerDisplay() {
    const minutes = Math.floor(timerDuration / 60);
    const seconds = timerDuration % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Fungsi untuk mengurangi waktu setiap detik
function startCountdown() {
    const countdownInterval = setInterval(() => {
        if (timerDuration > 0) {
            timerDuration--;
            updateTimerDisplay();
        } else {
            clearInterval(countdownInterval);
            alert("game over!");
            // Tambahkan aksi lain di sini ketika waktu habis, jika diperlukan.
        }
    }, 1000);
}

// Memulai countdown
startCountdown();
