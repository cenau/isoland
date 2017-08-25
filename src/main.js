import * as THREE from 'three';
import createLoop from 'canvas-loop';
import kd from 'keydrown';
import ecs from 'tiny-ecs';
import ec from 'three-effectcomposer';
import CANNON from 'cannon';
import isosurface from 'isosurface';
import SimplexNoise from 'simplex-noise'
import EventEmitter from 'events';
import PointerLockControls from 'three-pointerlock';
import QuickHull from  "./QuickHull"
import ConvexGeometry from  "./ConvexGeometry"


// systems
import initPhysics from './initPhysics';
import initGraphics from './initGraphics';
import stickToTargetSystem from './stickToTargetSystem';

// components
import Physics from './Physics';
import WASD from './WASD';
import Graphics from './Graphics';
import StickToTarget from './StickToTarget';
import Position from './Position';
import Quaternion from './Quaternion';
import Iso from './iso';
import QWorker from './my_task';
import webworkify from 'webworkify';


//  stuff that should be imports but doesnt work
const EffectComposer = ec(THREE);
QuickHull(THREE);
ConvexGeometry(THREE);
// import { glslify } from 'glslify'
const glslify = require('glslify');
// needed for bug https://github.com/stackgl/glslify/issues/49 - if you try using fixes like glslify babel plugin, then shaders wont live reload!!

const simplex = new SimplexNoise();

const scale = 50
//const adjust = 1.935; //32 @ 10
//const adjust = 1.876;  //32 
const adjust = 1.876;  //24 
//const adjust = 1.750; // 8 @ 10

//assets

const scene = new setupScene()

// physics

const world = setupWorld();


  const body = new CANNON.Body({
    mass: 0,
     position: new CANNON.Vec3(0, 0, 0), // m 
    shape: new CANNON.Plane(100),
  });

  var rot = new CANNON.Vec3(1,0,0)
  body.quaternion.setFromAxisAngle(rot, -Math.PI/2)
  world.addBody(body);


//  canvas for rendering
const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.style.zIndex = -1;
// renderer

const renderer = setupRenderer();
const camera = setupCamera();
const composer = setupComposer();

// setup ecs
const ents = new ecs.EntityManager(); // ents, because, i keep misspelling entities

// the player
const player = ents.createEntity();

player.addComponent(Position);
player.addComponent(Quaternion);
player.addComponent(Physics);
player.addComponent(Graphics);
//player.addComponent(WASD);

player.position.y = 4;



// procedural deformation texture
const deformMat = new THREE.ShaderMaterial({
  vertexShader: glslify('../shaders/deform_vert.glsl'),
  fragmentShader: glslify('../shaders/deform_frag.glsl'),
  transparent: true,
  uniforms: {
    iGlobalTime: { type: 'f', value: 0 },
    iResolution: { type: 'v2', value: new THREE.Vector2() },
  },
  defines: {
    USE_MAP: '',
  },
});







const passMat = new THREE.ShaderMaterial({
  vertexShader: glslify('../shaders/rock_vert.glsl'),
  fragmentShader: glslify('../shaders/rock_frag.glsl'),
  uniforms: {
    iGlobalTime: { type: 'f', value: 0 },
    iResolution: { type: 'v2', value: new THREE.Vector2() },
  },
  defines: {
    USE_MAP: '',
  },
});


    passMat.extensions.derivatives = true
const app = createLoop(canvas, { scale: renderer.devicePixelRatio });


// uniforms for screen shaders
composer.passthroughEffect.uniforms.iResolution.value.set(app.shape[0], app.shape[1]);

// time - for passing into shaders
let time = 0;

// the terrain plane
const geom = new THREE.PlaneGeometry(
  300, 300, // Width and Height
  300, 300, // Terrain resolution
);


const plane = ents.createEntity();
plane.addComponent(Graphics);
plane.addComponent(Position);
plane.addComponent(StickToTarget);
plane.graphics.mesh = new THREE.Mesh(geom);

plane.graphics.mesh.material = deformMat;
plane.graphics.mesh.material.side = THREE.DoubleSide;
plane.graphics.mesh.rotation.x -= (90 * Math.PI) / 180;
plane.stickToTarget.target = player;

plane.remove()

var worker = webworkify(Iso);
var dones = []



function OlddoInWorker(gridposadjust,gridpos,caller) {
  function handleWorkerCompletion(message) {
    if (message.data.command == "done") {
  let geom = message.data.geom
  let gridp = message.data.gridpos
      if (message.data.id in dones){
      } else {
        caller.addChunkToWorld(geom,gridp);
        dones.push(message.data.id)
      for (var ps in message.data.result.positions){
        if ( message.data.result.positions[ps][1] > 0.2){
        const physicsSphere = ents.createEntity();
        physicsSphere.addComponent(Position);
        physicsSphere.addComponent(Physics);
        physicsSphere.position.x = gridp.x * adjust * 2 * scale + message.data.result.positions[ps][0] * scale;
        physicsSphere.position.y =  gridp.y * adjust * 2 * scale + message.data.result.positions[ps][1] * scale;
        physicsSphere.position.z = gridp.z * adjust * 2 * scale +message.data.result.positions[ps][2] * scale ;
        physicsSphere.addComponent(Quaternion);
        physicsSphere.addComponent(Graphics);
        physicsSphere.addComponent(Physics);
        physicsSphere.physics.mass = 0;
   let geom = new THREE.SphereGeometry(
    0.5, 10, 10, 10,
  );
  physicsSphere.graphics.mesh = new THREE.Mesh(geom)
        }
  } 
   let points = [];
        for (var ps in message.data.result.positions){ 
           points.push(
             new THREE.Vector3(
             message.data.result.positions[ps][0] * scale + gridp.x * adjust * 2 * scale,
             message.data.result.positions[ps][1] * scale + gridp.y * adjust * 2 * scale,
             message.data.result.positions[ps][2] * scale + gridp.z * adjust * 2 * scale
             )
           
           )
        }
      }
      //if(workQ.length > 0){
    //  let task = workQ.shift()
    //  doInWorker(task.a,task.g)
    //}
    }
    }
  

  worker.addEventListener("message", handleWorkerCompletion, false);
  
  let msg = {
    "gridposadjust": gridposadjust,
    "gridpos": gridpos,
  }
  worker.postMessage(msg);
}
document.addEventListener("DOMContentLoaded", function(event) 
{

})

//from https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
function QueryableWorker(webworkermodule, defaultListener, onError) {
      var instance = this,
      worker = webworkify(webworkermodule),
      listeners = {};

      this.defaultListener = defaultListener || function() {};
 
      if (onError) {worker.onerror = onError;}

      this.postMessage = function(message) {
        worker.postMessage(message);
      }

      this.terminate = function() {
        worker.terminate();
      }

      this.addListener = function(name, listener) {
        listeners[name] = listener; 
      }
 
      this.removeListener = function(name) { 
        delete listeners[name];
      }

      /* 
        This functions takes at least one argument, the method name we want to query.
        Then we can pass in the arguments that the method needs.
      */
      this.sendQuery = function() {
        if (arguments.length < 1) {
          throw new TypeError('QueryableWorker.sendQuery takes at least one argument'); 
          return;
        }
        worker.postMessage({
          'queryMethod': arguments[0],
          'queryMethodArguments': Array.prototype.slice.call(arguments, 1)
        });
      }

      worker.onmessage = function(event) {
        if (event.data instanceof Object &&
          event.data.hasOwnProperty('queryMethodListener') &&
          event.data.hasOwnProperty('queryMethodArguments')) {
          listeners[event.data.queryMethodListener].apply(instance, event.data.queryMethodArguments);
        } else {
          this.defaultListener.call(instance, event.data);
        }
      }
    }
var servitor = new QueryableWorker(QWorker)

 servitor.addListener('isoDone', function (ga, g) {
      console.log(ga,g);
    });
//from https://stackoverflow.com/questions/20774648/three-js-generate-uv-coordinate
function assignUVs2(geometry) {

    geometry.faceVertexUvs[0] = [];

    geometry.faces.forEach(function(face) {

        var uvs = [];
        var ids = [ 'a', 'b', 'c'];
        for( var i = 0; i < ids.length; i++ ) {
            var vertex = geometry.vertices[ face[ ids[ i ] ] ].clone();

            var n = vertex.normalize();
            var yaw = .5 - Math.atan( n.z, - n.x ) / ( 2.0 * Math.PI );
            var pitch = .5 - Math.asin( n.y ) / Math.PI;

            var u = yaw,
                v = pitch;
            uvs.push( new THREE.Vector2( u, v ) );
        }
        geometry.faceVertexUvs[ 0 ].push( uvs );
    });

    geometry.uvsNeedUpdate = true;
}



function assignUVs(geometry) {

    geometry.faceVertexUvs[0] = [];

    geometry.faces.forEach(function(face) {

        var components = ['x', 'y', 'z'].sort(function(a, b) {
            return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
        });

        var v1 = geometry.vertices[face.a];
        var v2 = geometry.vertices[face.b];
        var v3 = geometry.vertices[face.c];

        geometry.faceVertexUvs[0].push([
            new THREE.Vector2(v1[components[0]], v1[components[1]]),
            new THREE.Vector2(v2[components[0]], v2[components[1]]),
            new THREE.Vector2(v3[components[0]], v3[components[1]])
        ]);

    });

    geometry.uvsNeedUpdate = true;
}


const wireMat = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    wireframe: true
});

const chunks = []
chunk.prototype.addChunkToWorld = function(g,gridpos){
  var loader = new THREE.JSONLoader();
     let geom = loader.parse( g ).geometry
    geom.__proto__ = THREE.IsosurfaceGeometry.prototype;
    assignUVs(geom);
    geom.scale(scale,scale,scale);
   



     
  

    let obj = new THREE.Mesh(geom);
    obj.material.side = THREE.DoubleSide;
    obj.material = passMat
    obj.material = wireMat
    scene.add(obj);
    obj.position.set(gridpos.x * adjust * 2 * scale ,gridpos.y * adjust * 2 * scale ,gridpos.z * adjust * 2 * scale);
    chunks.push(obj)
  }

function  makeChunk(i,j,k){
        const c = new chunk(new THREE.Vector3(i,j,k));
//        scene.add(c.obj);
  //      c.obj.position.set(i * adjust * 2 * scale ,j * adjust * 2 * scale ,k * adjust * 2 * scale);

  }    
function  makeChunks() {
        const gridsize = new THREE.Vector3(3,3,3);
        const chunkLength  = gridsize.x * gridsize.y * gridsize.z; 
    
        let normalisedGrid = new THREE.Vector3(
    (gridsize.x - 1) /2,
    gridsize.y,
    (gridsize.x -1) /2 
  );

  for (let i = -normalisedGrid.x;i<=normalisedGrid.x; i++){
    for (let j = 0;j<normalisedGrid.y; j++){
      for (let k = -normalisedGrid.z;k<=normalisedGrid.z; k++){
        makeChunk(i,j,k);
      }
    }
   }
}



function chunk(gridpos){
  this.gridpos = gridpos;
  this.dims = 24;
  this.bounds = 2;
  this.gridposadjust = new THREE.Vector3(gridpos.x,gridpos.y,gridpos.z);
  this.gridposadjust.multiply(new THREE.Vector3(adjust * 2, adjust * 2,adjust * 2));
  const self = this; //nasty
  this.makeObj();
}


chunk.prototype.makeObj = function(){
  servitor.sendQuery('getIso',this.gridposadjust,this.gridpos,this.dims,this.bounds) 
}


 var bel = document.createElement('div')
 bel.id= "blocker"
 bel.style["background-color"] ="rgba(0,0,0,0.5)"; 
 bel.style.width= "100%"
 bel.style.height= "100%"
 bel.style.position= "absolute"
 document.body.append(bel)

 var iel = document.createElement('div')
 iel.id= "instructions"
 iel.style.color ="white"
 iel.style.width= "100%"
 iel.style.height= "100%"
 iel.style.position= "absolute"
 iel.innerHTML = "clicky for cursory"
 
 bel.append(iel)

 var blocker = document.getElementById( 'blocker' );
           
var instructions = document.getElementById( 'instructions' );
            var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
            if ( havePointerLock ) {
                var element = document.body;
                var pointerlockchange = function ( event ) {
                    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                        controls.enabled = true;
                        blocker.style.display = 'none';
                    } else {
                        controls.enabled = false;
                        blocker.style.display = '-webkit-box';
                        blocker.style.display = '-moz-box';
                        blocker.style.display = 'box';
                        instructions.style.display = '';
                    }
                }
                var pointerlockerror = function ( event ) {
                    instructions.style.display = '';
                }
                // Hook pointer lock state change events
                document.addEventListener( 'pointerlockchange', pointerlockchange, false );
                document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
                document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
                document.addEventListener( 'pointerlockerror', pointerlockerror, false );
                document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
                document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
                instructions.addEventListener( 'click', function ( event ) {
                    instructions.style.display = 'none';
                    // Ask the browser to lock the pointer
                    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                    if ( /Firefox/i.test( navigator.userAgent ) ) {
                        var fullscreenchange = function ( event ) {
                            if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
                                document.removeEventListener( 'fullscreenchange', fullscreenchange );
                                document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
                                element.requestPointerLock();
                            }
                        }
                        document.addEventListener( 'fullscreenchange', fullscreenchange, false );
                        document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
                        element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                        element.requestFullscreen();
                    } else {
                        element.requestPointerLock();
                    }
                }, false );
            } else {
                instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
            }




//obj.material = deformMat;
app.on('tick', (dt) => {
  kd.tick();
  controls.update(dt)
  time += dt / 1000;
  deformMat.uniforms.iGlobalTime.value = time;
  composer.render(scene, camera);
  renderer.render(scene, camera, composer.bufferTexture);
  composer.passthroughEffect.uniforms.iGlobalTime.value = time;


  world.step(world.fixedTimeStep, dt, world.maxSubSteps);

  
  // run system inits
  ents.queryComponents([Graphics]).forEach((each) => {
    if (!each.graphics.inScene) {
      initGraphics(scene, each);
    }
  });
  ents.queryComponents([Physics]).forEach((each) => {
    if (!each.physics.body) {
      initPhysics(world, each);

    }
  });
  // run systems

  // update position from physics
  ents.queryComponents([Physics, Position]).forEach((each) => {
    each.position.copy(each.physics.body.position);
  });
  // update quaternion from physics
  ents.queryComponents([Physics, Quaternion]).forEach((each) => {
    each.quaternion.copy(each.physics.body.quaternion);
  });


  // update mesh from position
  ents.queryComponents([Graphics, Position]).forEach((each) => {
    each.graphics.mesh.position.copy(each.position);
  });
  // update mesh from quaternion
  ents.queryComponents([Graphics, Quaternion]).forEach((each) => {
    each.graphics.mesh.quaternion.copy(each.quaternion);
  });

  ents.queryComponents([Position, StickToTarget]).forEach((each) => {
    stickToTargetSystem(each);
  });

  camera.position.copy(player.position);
  camera.quaternion.copy(player.quaternion);
});


app.on('resize', resize);



// keyboard input



kd.Z.down(() => {
  for ( var c in chunks){
 if (chunks[c].material == passMat){
    chunks[c].material = wireMat
 }else {
    chunks[c].material = passMat

 }
  }
});

kd.W.down(() => {
  
   
  
  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(0, 0, -1),
      new CANNON.Vec3(0, 0, 0),
    );
  });
});

kd.S.down(() => {

  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(0, 0, 1),
      new CANNON.Vec3(0, 0, 0),
    );
  });
});

kd.A.down(() => {

  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(-0.1, 0, 0),
      new CANNON.Vec3(0, 0, -0.1),
    );
  });
});

kd.D.down(() => {

  ents.queryComponents([WASD]).forEach((each) => {
    each.physics.body.applyLocalImpulse(
      new CANNON.Vec3(0.1, 0, 0),
      new CANNON.Vec3(0, 0, -0.1),
    );
  });
});


function setupRenderer() {
  const rend = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    devicePixelRatio: window.devicePixelRatio,
  });

  rend.setClearColor(0xffdddd, 1);
  // renderer.context.getShaderInfoLog = function () { return '' }; //nasty hack to suppress error merssages due to possible ff bug? https://github.com/mrdoob/three.js/issues/9716
  return rend;
}


// setup camera
function setupCamera() {
  const cam = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    500);

  cam.position.set(0, 0, 0);
  return cam;
}

function setupWorld() {
  const wor = new CANNON.World();
   wor.gravity = new CANNON.Vec3(0, -1, 0) // m/s²
  //wor.gravity = new CANNON.Vec3(0, 0, 0); // m/s²

  wor.broadphase = new CANNON.NaiveBroadphase();

  wor.solver.iterations = 2;


  wor.fixedTimeStep = 1 / 60; // physics engine setting - keeps render framerate and sim in sync
  wor.maxSubSteps = 10; // physics engine setting - not 100% sure what this does

  return wor;
}

function setupScene() {
  const sce = new THREE.Scene();
  const light = new THREE.AmbientLight(0x404040); // soft white light
  sce.add(light);
  return sce;
}

function setupComposer() {
  const effectComposer = new EffectComposer(renderer);

  // setup buffer render target for render to texture stuff.

  // const bufferScene = new THREE.Scene();
  effectComposer.bufferTexture = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight,
    {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
    },
  );


  // passthrough shader for fullscreen + buffer. Use this as template for effects.
  const passthroughShader = {

    uniforms: {
      tLast: { type: 't', value: effectComposer.bufferTexture },
      tDiffuse: { type: 't', value: null }, // output from previous - all need this
      iResolution: { type: 'v2', value: new THREE.Vector2() },
      iGlobalTime: { type: 'f', value: 0 },
    },
    vertexShader: glslify('../shaders/pass_vert.glsl'),
    fragmentShader: glslify('../shaders/pass_frag.glsl'),

  };

  // effect composer to deal with the screen shaders
  effectComposer.addPass(new EffectComposer.RenderPass(scene, camera)); // the actual scene
  effectComposer.passthroughEffect = new EffectComposer.ShaderPass(passthroughShader);

  effectComposer.addPass(effectComposer.passthroughEffect); // adding the passthrough shader

  effectComposer.passes[effectComposer.passes.length - 1].renderToScreen = true;

  return effectComposer;
}

makeChunks();

const controls = new PointerLockControls( camera );
scene.add( controls.getObject() );


var controlsEnabled = false;
			var moveForward = false;
			var moveBackward = false;
			var moveLeft = false;
			var moveRight = false;
			var canJump = false;
			var velocity = new THREE.Vector3();



app.start()
resize()



function resize() {
  const [width, height] = app.shape;
  camera.aspect = width / height;
  renderer.setSize(width, height, false);

  camera.updateProjectionMatrix();
}






THREE.IsosurfaceGeometry = function(dims, map, bounds) {

    THREE.Geometry.call( this );

    var p = new THREE.Vector3();
    var compatibleMap = function(x, y, z) {
        return map(p.fromArray([x, y, z]))
    };
    
    var result = isosurface.marchingCubes(dims, compatibleMap, bounds)
    var v, f;

    for (var i = 0; i < result.positions.length; ++i) {
        v = result.positions[i];
        this.vertices.push(new THREE.Vector3().fromArray(v));
    }

    for (var i = 0; i < result.cells.length; ++i) {
        f = result.cells[i];
        if (f.length === 3) {
            this.faces.push(new THREE.Face3(f[0], f[1], f[2]));
        } else if (f.length === 4) {
            this.faces.push(new THREE.Face3(f[0], f[1], f[2]));
            this.faces.push(new THREE.Face3(f[0], f[2], f[3]));
        }
    }

    this.mergeVertices();

    var s = 0.001;
    var tinyChangeX = new THREE.Vector3( s, 0, 0 );
    var tinyChangeY = new THREE.Vector3( 0, s, 0 );
    var tinyChangeZ = new THREE.Vector3( 0, 0, s );

    var upTinyChangeInX, upTinyChangeInY, upTinyChangeInZ;
    var downTinyChangeInX, downTinyChangeInY, downTinyChangeInZ;
    var tinyChangeInX, tinyChangeInY, tinyChangeInZ;

    var vertexNormals = [];
    var normal;

    for (var i = 0; i < this.vertices.length; ++i) {
        var vertex = this.vertices[i];

        upTinyChangeInX   = map( vertex.clone().add(tinyChangeX) );
        downTinyChangeInX = map( vertex.clone().sub(tinyChangeX) );
        tinyChangeInX = upTinyChangeInX - downTinyChangeInX;

        upTinyChangeInY   = map( vertex.clone().add(tinyChangeY) );
        downTinyChangeInY = map( vertex.clone().sub(tinyChangeY) );
        tinyChangeInY = upTinyChangeInY - downTinyChangeInY;

        upTinyChangeInZ   = map( vertex.clone().add(tinyChangeZ) );
        downTinyChangeInZ = map( vertex.clone().sub(tinyChangeZ) );
        tinyChangeInZ = upTinyChangeInZ - downTinyChangeInZ;
        
        normal = new THREE.Vector3(tinyChangeInX, tinyChangeInY, tinyChangeInZ);
        normal.normalize();
        vertexNormals.push(normal);
    }

    for (var i = 0; i < this.faces.length; ++i) {
        f = this.faces[i];
        f.vertexNormals = [
            vertexNormals[f.a],
            vertexNormals[f.b],
            vertexNormals[f.c]
        ];
    }
};

THREE.IsosurfaceGeometry.prototype = Object.create( THREE.Geometry.prototype );
THREE.IsosurfaceGeometry.prototype.constructor = THREE.IsosurfaceGeometry;
