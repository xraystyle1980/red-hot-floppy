import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BloomEffect, EffectComposer, EffectPass, RenderPass, KernelSize } from "postprocessing" 
import { WebGLRenderer } from 'three'
import GUI from 'lil-gui'


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


/**
 * Debug
 */
const gui = new GUI({ title: 'Red Hot Floppy' })


/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const emissiveMap = textureLoader.load('./textures/floppy/floppyEmissive-grad.png')
emissiveMap.flipY = false 
emissiveMap.colorSpace = THREE.SRGBColorSpace

// Declare a global reference for the model
let model = null 

/**
 * Objects
 */
const loader = new GLTFLoader() 
loader.load(
    'models/floppy.glb',
    function (gltf) {
        model = gltf.scene  // Assign the model to the global reference
        scene.add(model) 

        // Traverse through the children of the model
        model.traverse((child) => {
            if (child.isMesh) {
                // Add emissive properties to the material
                child.material.emissive = new THREE.Color(0xFB6260)  // Set base color 
                child.material.emissiveMap = emissiveMap  // Apply the emissive map
                child.material.emissiveIntensity = 5  // Adjust the brightness of the emission
                child.material.needsUpdate = true  // Ensure the material is updated
            }
        }) 

        // Emissive Intensity Control
        gui.add({ emissiveIntensity: 5 }, 'emissiveIntensity').min(0).max(5).step(0.01).name('Intensity').onChange((value) => {
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissiveIntensity = value 
                    child.material.needsUpdate = true 
                }
            }) 
        }) 
    },
    undefined,
    function (error) {
        console.error('An error occurred while loading the model:', error) 
    }
) 


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 1
camera.position.z = 7
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.panSpeed = .075 
controls.minAzimuthAngle = - ( Math.PI / 2 ) + 0.35 
controls.maxAzimuthAngle = ( Math.PI / 2 ) - 0.35 
controls.dampingFactor = 0.1 
controls.minDistance = 5 
controls.maxDistance = 8 


/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2.1) 
scene.add(ambientLight) 


/**
 * Renderer
 */
const renderer = new WebGLRenderer({
	powerPreference: "high-performance",
    canvas: canvas,
	antialias: true,
	stencil: false,
    alpha: true
})


/**
 * Post processing
 */
const bloomEffect = new BloomEffect({
    intensity: 1.2,              // Bloom intensity
    luminanceThreshold: 0.05,     // Luminance threshold for bloom
    luminanceSmoothing: 1,
    kernelSize: KernelSize.VERY_LARGE
}) 

const bloomPass = new EffectPass(camera, bloomEffect)

// Composer
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
composer.addPass(bloomPass)

requestAnimationFrame(function render() {
	requestAnimationFrame(render) 
	composer.render() 
}) 

renderer.setSize(sizes.width, sizes.height)
composer.setSize(sizes.width, sizes.height)


/**
 * Resize
 */
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth 
    sizes.height = window.innerHeight 

    // Update camera
    camera.aspect = sizes.width / sizes.height 
    camera.updateProjectionMatrix() 

    // Update renderer
    renderer.setSize(sizes.width, sizes.height) 
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // Keep only one setPixelRatio here
}) 


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    controls.update()

    if (model) {
        model.position.y = Math.sin(elapsedTime) * 0.25
    }

    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()