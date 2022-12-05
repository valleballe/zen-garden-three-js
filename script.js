/* Debug */
const gui = new dat.GUI({ closed: false, width: 200 });
const colorFolder = gui.addFolder("Sand Color");
const displaceFolder = gui.addFolder("Displacement");
const lightFolder = gui.addFolder("Light");

const debugObject = {
  sandDepthColor: "#1e4d40",
  sandSurfaceColor: "#ded5ca",
  sandBottomColor: "#beaaa3",
  displacementScale: 0.01,
  verteces: 500,
};

const BACKGROUND_COLOR = 0xf1f1f1;
const SAND_MODEL_PATH = "models/sand.glb"
const BOARD_MODEL_PATH = "models/zen-board.glb"
var loader = new THREE.GLTFLoader();

// Textures
const textures = {
  displacementMap: new THREE.TextureLoader().load(
'drawings/corgi.png'),
  sandColor: new THREE.TextureLoader().load(
'textures/Sand_BaseColor.png'),
  sandNormal: new THREE.TextureLoader().load(
'textures/Sand_Normal.png'),
  sandRoughness: new THREE.TextureLoader().load(
'textures/Sand_Roughness.png'),
  boardColor: new THREE.TextureLoader().load(
'textures/Wood_BaseColor.png'),
  boardNormal: new THREE.TextureLoader().load(
'textures/Wood_Normal.png'),
  boardRoughness: new THREE.TextureLoader().load(
'textures/Wood_Roughness.png'),
};


/* Scene */

const scene = new THREE.Scene();
scene.background = new THREE.Color(BACKGROUND_COLOR);
scene.fog = new THREE.Fog(BACKGROUND_COLOR, 20, 100);

// The camera
const camera = new THREE.PerspectiveCamera(
  20,
  window.innerWidth / window.innerHeight,
  1,
  10000
);

// The renderer: something that draws 3D objects onto the canvas
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor( 0x000000, 0 ); // the default
renderer.shadowMap.enabled = true;



// Append the renderer canvas into <body>
document.body.appendChild(renderer.domElement);

/* Models */

// Load Zen Board Model
loader.load(BOARD_MODEL_PATH, function(gltf) {
  theModel = gltf.scene;

  theModel.castShadow = true;
  theModel.receiveShadow = true;

  // Set the models initial scale   
  theModel.scale.set(1,1,1);
  theModel.position.set(0,-1,0)
  theModel.rotation.y = Math.PI;

  // Add the model to the scene
  theModel.position.y = -1;

  theModel.traverse((o) => {
   if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          o.material = new THREE.MeshPhongMaterial({
    map: textures.boardColor,
    //color: textures.boardColor,
    roughness:textures.boardRoughness,
    normalMap: textures.boardRoughness,
    normalScale: new THREE.Vector2( 1, 1 ),
    shininess: 60,
    });
   }
  });
  scene.add(theModel);

  }, undefined, function(error) {
  console.error(error)
});

// The Top Sand Layer
const topSand = {
  geometry: new THREE.PlaneGeometry(2, 2, debugObject.verteces, debugObject.verteces),
  material: new THREE.MeshStandardMaterial({
    color: debugObject.sandSurfaceColor,
    roughness:textures.sandRoughness,
    displacementMap: textures.displacementMap,
    displacementScale: debugObject.displacementScale,
    displacementBias: -.01, 
    normalMap: textures.sandNormal,
    normalScale: new THREE.Vector2( 1, 0 ),
    })
};

// Build mesh
topSand.mesh = new THREE.Mesh(
  topSand.geometry, 
  topSand.material,
)

// Add the cube into the scene
scene.add(topSand.mesh);
topSand.mesh.rotation.x = 3*Math.PI / 2;


// The Bottom Sand Layer
const bottomSand = {
  
  geometry: new THREE.PlaneGeometry(2, 2, debugObject.verteces, debugObject.verteces),
  material: new THREE.MeshStandardMaterial({
    color: debugObject.sandBottomColor,
    normalMap: textures.sandNormal,
    normalScale: new THREE.Vector2( 1, 0 ),
    })
};

// Build mesh
bottomSand.mesh = new THREE.Mesh(
  bottomSand.geometry, 
  bottomSand.material,
)

// Add the cube into the scene
scene.add(bottomSand.mesh);
bottomSand.mesh.position.y = -0.009;
bottomSand.mesh.rotation.x = 3*Math.PI / 2;


/* Add lights */

var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.61 );
    hemiLight.position.set( 0, 50, 0 );
// Add hemisphere light to scene   
scene.add( hemiLight );

var dirLight = new THREE.DirectionalLight( 0xffffff, 0.54 );
    dirLight.position.set( -8, 12, 8 );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
// Add directional Light to scene    
    scene.add( dirLight );

// Floor
var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
var floorMaterial = new THREE.MeshPhongMaterial({
  color: BACKGROUND_COLOR,
  shininess: 0
});

var floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -0.5 * Math.PI;
floor.receiveShadow = true;
floor.position.y = -.2;
scene.add(floor);

// Add controls
var controls = new THREE.OrbitControls( camera, renderer.domElement );



// Make the camera further from the cube so we can see it better
camera.position.z = 0;
camera.position.y = 10;
camera.rotation.x = -1*Math.PI / 2;





/* GUI */
// Surface Color

colorFolder
  .addColor(debugObject, "sandSurfaceColor")
  .onChange(() => {
topSand.material.color.setHex(debugObject.sandSurfaceColor.replace("#", "0x"));
  });
colorFolder
  .addColor(debugObject, "sandBottomColor")
  .onChange(() => {
    bottomSand.material.color
      .setHex(debugObject.sandBottomColor.replace("#", "0x"));
  });

// Displacement
displaceFolder
  .add(topSand.material, 'displacementBias', -1, 1, 0.01)
  .name("Bias")
displaceFolder
  .add(topSand.material, 'displacementScale', -1, 1, 0.01)
  .onChange(() => {updateMaterial(topSand)})
  .name("Scale")
displaceFolder
  .open()

// Light
lightFolder.add(dirLight.position, 'x', 0, 15)
lightFolder.add(dirLight.position, 'y', 0, 15)
lightFolder.add(dirLight.position, 'z', 0, 15)
lightFolder.add(dirLight, 'intensity', 0, 5, 0.01)
           .name("Dir intsty")
lightFolder.add(hemiLight, 'intensity', 0, 5, 0.01)
           .name("Hemi intsty")
lightFolder.open()

function updateMaterial(object) {
    object.material.side = Number(object.material.side)
    object.material.needsUpdate = true
}

function render() {
  // Render the scene and the camera
  renderer.render(scene, camera);
  controls.update();

//plane.mesh.rotation.x += 0.0001
  
  // Make it call the render() function about every 1/60 second
  requestAnimationFrame(render);

  
}

render();