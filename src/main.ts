import './style.css'
import * as THREE from 'three'

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  90,  // Increased FOV from 75 to 90 for wider view
  window.innerWidth / window.innerHeight, 
  0.1, 
  5000  // Increased from 2000 to 5000 for further view distance
)
const renderer = new THREE.WebGLRenderer()

renderer.setSize(window.innerWidth, window.innerHeight)
document.querySelector('#app')!.appendChild(renderer.domElement)

let isDragging = false
let previousMousePosition = { x: 0, y: 0 }
const rotationSpeed = 0.005

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true
  previousMousePosition = {
    x: e.clientX,
    y: e.clientY
  }
})

renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isDragging) return

  const deltaMove = {
    x: e.clientX - previousMousePosition.x,
    y: e.clientY - previousMousePosition.y
  }

  camera.rotation.y -= deltaMove.x * rotationSpeed

  previousMousePosition = {
    x: e.clientX,
    y: e.clientY
  }
})

renderer.domElement.addEventListener('mouseup', () => {
  isDragging = false
})

renderer.domElement.addEventListener('touchstart', (e) => {
  isDragging = true
  previousMousePosition = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  }
})

renderer.domElement.addEventListener('touchmove', (e) => {
  if (!isDragging) return

  const deltaMove = {
    x: e.touches[0].clientX - previousMousePosition.x,
    y: e.touches[0].clientY - previousMousePosition.y
  }

  camera.rotation.y -= deltaMove.x * rotationSpeed

  previousMousePosition = {
    x: e.touches[0].clientX,
    y: e.touches[0].clientY
  }
})

renderer.domElement.addEventListener('touchend', () => {
  isDragging = false
})

// Create tiled floor
const tileSize = 2
const gridSize = 50 // Increased from 20 to 50 for longer floor
const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 })
const tileGeometry = new THREE.PlaneGeometry(tileSize, tileSize)

// Create floor group to hold all tiles
const floor = new THREE.Group()

for (let x = 0; x < gridSize; x++) {
  for (let z = 0; z < gridSize*4; z++) {
    const material = (x + z) % 2 === 0 ? whiteMaterial : blackMaterial
    const tile = new THREE.Mesh(tileGeometry, material)
    
    // Position each tile
    tile.position.set(
      (x - gridSize/2) * tileSize + tileSize/2,
      0,
      (z - gridSize/2) * tileSize + tileSize/2
    )
    tile.rotation.x = -Math.PI / 2
    floor.add(tile)
  }
}

scene.add(floor)

// Create walls
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 })
const wallGeometry = new THREE.PlaneGeometry(200, 20) // Increased from 100,10 to 200,20

const leftWall = new THREE.Mesh(wallGeometry, wallMaterial)
leftWall.position.set(-50, 10, 0) // Changed x from -100 to -50
leftWall.rotation.y = Math.PI / 2
scene.add(leftWall)

const textureLoader = new THREE.TextureLoader()
const paintings = [
  'positano_painting.webp',
  'paint2.webp',
  'paint3.jpg',
  'paint4.jpg',
  'paint5.jpg',
  'paint6.jpg',
  'paint7.jpg',
]

const PAINTING_WIDTH = 20
const PAINTING_SPACING = 25
const PAINTING_HEIGHT = 20

// Calculate positions for horizontal layout
function getPaintingPosition(index: number, totalPaintings: number) {
  // Calculate z-position (along the wall)
  const totalWidth = totalPaintings * PAINTING_SPACING
  const startZ = -totalWidth / 2 + PAINTING_SPACING/2
  const z = startZ + (index * PAINTING_SPACING)
  
  // Fixed height for all paintings
  const y = 10  // Center height on wall
  
  return { y, z }
}

// Create paintings for both walls
paintings.forEach((paintingFile, index) => {
  const paintingTexture = textureLoader.load(
    paintingFile,
    undefined,
    undefined,
    (error) => console.error('Error loading texture:', error)
  )

  const paintingGeometry = new THREE.PlaneGeometry(PAINTING_WIDTH, PAINTING_HEIGHT)
  const paintingMaterial = new THREE.MeshBasicMaterial({ map: paintingTexture })
  const painting = new THREE.Mesh(paintingGeometry, paintingMaterial)
  
  const position = getPaintingPosition(index, paintings.length)
  painting.position.set(49.9, position.y, position.z)
  painting.rotation.y = -Math.PI / 2
  scene.add(painting)

  // Create a copy for the left wall
  const paintingCopy = painting.clone()
  paintingCopy.position.set(-49.9, position.y, position.z)
  paintingCopy.rotation.y = Math.PI / 2
  scene.add(paintingCopy)
})

// Modify initial camera position and rotation
camera.position.set(0, 2, 0)  // Changed from (0, 100, 0) to be at human height
camera.rotation.x = 0  // Changed from -Math.PI / 2 to look straight ahead
camera.rotation.y = 0
camera.rotation.z = 0

// Remove the lookAt call since we're manually setting rotation
// camera.lookAt(0, 0, -1)  // Remove this line

// Movement controls
const moveSpeed = 0.5
const keys: { [key: string]: boolean } = {}

window.addEventListener('keydown', (e) => {
  keys[e.key] = true
})

window.addEventListener('keyup', (e) => {
  keys[e.key] = false
})

// Update isTopDown default state
let isTopDown = false  // Changed from true to false

// Update toggleView function
function toggleView() {
  isTopDown = !isTopDown
  
  if (isTopDown) {
    camera.position.set(0, 100, 0)
    camera.rotation.x = -Math.PI / 2
    camera.rotation.y = 0
    camera.rotation.z = 0
  } else {
    camera.position.set(0, 2, 0)
    camera.rotation.x = 0
    camera.rotation.y = 0
    camera.rotation.z = 0
  }
}

// Create and add button
const viewToggleBtn = document.createElement('button')
viewToggleBtn.textContent = 'Toggle View'
viewToggleBtn.style.position = 'fixed'
viewToggleBtn.style.top = '20px'
viewToggleBtn.style.left = '20px'
viewToggleBtn.style.zIndex = '1000'
document.body.appendChild(viewToggleBtn)

viewToggleBtn.addEventListener('click', toggleView)

// Modify moveCamera function to handle both views
function moveCamera() {
  const direction = new THREE.Vector3()
  
  if (isTopDown) {
    if (keys['ArrowUp'] || keys['w']) direction.z = -1
    if (keys['ArrowDown'] || keys['s']) direction.z = 1
    if (keys['ArrowLeft'] || keys['a']) direction.x = -1
    if (keys['ArrowRight'] || keys['d']) direction.x = 1
  } else {
    if (keys['ArrowUp'] || keys['w']) {
      direction.z = -Math.cos(camera.rotation.y)
      direction.x = -Math.sin(camera.rotation.y)
    }
    if (keys['ArrowDown'] || keys['s']) {
      direction.z = Math.cos(camera.rotation.y)
      direction.x = Math.sin(camera.rotation.y)
    }
    if (keys['ArrowLeft'] || keys['a']) {
      direction.x = -Math.cos(camera.rotation.y)
      direction.z = Math.sin(camera.rotation.y)
    }
    if (keys['ArrowRight'] || keys['d']) {
      direction.x = Math.cos(camera.rotation.y)
      direction.z = -Math.sin(camera.rotation.y)
    }
  }

  direction.normalize()
  camera.position.x += direction.x * moveSpeed
  camera.position.z += direction.z * moveSpeed
}

function animate() {
  requestAnimationFrame(animate)
  moveCamera()
  renderer.render(scene, camera)
}

animate()

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}) 