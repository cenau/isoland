import * as THREE from 'three';
import createLoop from 'canvas-loop';
import kd from 'keydrown';
import ecs from 'tiny-ecs';
import ec from 'three-effectcomposer';
import CANNON from 'cannon';
import isosurface from 'isosurface';
import SimplexNoise from 'simplex-noise'

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

//  stuff that should be imports but doesnt work
const EffectComposer = ec(THREE);
// import { glslify } from 'glslify'
const glslify = require('glslify');
// needed for bug https://github.com/stackgl/glslify/issues/49 - if you try using fixes like glslify babel plugin, then shaders wont live reload!!

const simplex = new SimplexNoise();

const adjust = 1.935;
//const adjust = 1.876;

var normalMap = THREE.ImageUtils.loadTexture('dist/normal.jpg', undefined, ready)
normalMap.repeat.set(0.1, 0.1);
normalMap.wrapS = normalMap.wrapT = THREE.MirroredRepeatWrapping



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



// assets

const scene = setupScene();

function flatFloor(vector){
  return vector.y;
}

function between(v,p,d){
  let isBetween = (v < p + d && v > p - d)
  return isBetween
}

function betweenVec(v,p,d){
  
  let isBetween = (between(v.x,p.x,d.x) && between(v.y,p.y,d.y) && between(v.z,p.z,d.z));
  return isBetween

}

function wall(vector,position,dimension){
  let object = 0;
  if (betweenVec(vector,position,dimension)){
    object  = simplex.noise3D(vector.x,vector.y,vector.z);
  }
  return object
}

function sdBox( p, b ,s)
{
  let d = {}
  d.x = Math.abs(p.x / s) - b.x;
  d.y = Math.abs(p.y / s) - b.y;
  d.z = Math.abs(p.z / s) - b.z;
  return (Math.min(Math.max(d.x,Math.max(d.y,d.z)),0.0) + Math.max(d.x,0.0) + Math.max(d.y,0.0) + Math.max(d.z,0.0)) * s;
}


function sphere(vector){
  let object  = Math.sqrt(vector.x * vector.x + vector.y * vector.y - vector.z * vector.z) - 1;
  return object
}

function bendyWall(vector, axis, frequency, amp, dims,inf){
  let anglevec = vector.clone();
  anglevec.applyAxisAngle(axis, Math.sin(frequency * vector.z) * amp);
  if (inf){anglevec.z = 1} 
  let density = sdBox(new THREE.Vector3(anglevec.x,anglevec.y,anglevec.z), dims,1);
  return density
}

function densityGenerator(vector){
  let density = flatFloor(vector);
  //density = Math.min(density,bendyWall(new THREE.Vector3(vector.x,vector.y,vector.z),new THREE.Vector3(0,0.1,0) , 1.5 , 1. ,new THREE.Vector3(0.2,1.2,1),true));
  density = Math.min(density,bendyWall(new THREE.Vector3(vector.x,vector.y,vector.z),new THREE.Vector3(0,0.4,0) , 0.2 , 1. ,new THREE.Vector3(0.2,0.8,1),true));
  density = Math.min(density,bendyWall(new THREE.Vector3(vector.x + 1,vector.y,vector.z),new THREE.Vector3(0,0.4,0) , 0.2 , 1. ,new THREE.Vector3(0.2,0.8,1),true));
   //density = Math.min(density,bendyWall(new THREE.Vector3(vector.x+2,vector.y,vector.z),new THREE.Vector3(0,0.2,0) , 1.5 , 1. ,new THREE.Vector3(0.2,0.3,1),true));
  let ruin = bendyWall(new THREE.Vector3(vector.x+4,vector.y,vector.z),new THREE.Vector3(vector.x,vector.y+1,vector.z) , 0.1 , 1. ,new THREE.Vector3(1,1,2),true);
  ruin = Math.max(ruin, -sdBox(new THREE.Vector3(vector.x + 4,vector.y,vector.z), new THREE.Vector3(0.8,2.0,0.8),1));
  ruin = Math.max(ruin, -sdBox(new THREE.Vector3(vector.x + 3.5,vector.y,vector.z), new THREE.Vector3(1.0,0.5,0.2),1));
  //density = Math.min(density,ruin);
  //density = bendyWall(new THREE.Vector3(vector.x,vector.y,vector.z), 0.5 , 1. ,new THREE.Vector3(0.2,0.8,1),true);
  //density -= wall(vector, new THREE.Vector3(1,1,1),new THREE.Vector3(1,1,6));
  // if (vector.x > Math.abs(Math.cos(vector.z)) && vector.x < Math.abs(Math.cos(vector.z)) + 0.2 && vector.y < 1.){
   // density -= pillar(vector) * Math.abs(Math.sin(vector.z * 0.5) * 3 )
 // };
 
  
  

  if (density >0)  {density +=  simplex.noise3D(vector.x,vector.y,vector.z) * 0.1}; 
  if (density <=0)  {density +=  simplex.noise3D(vector.x,vector.y,vector.z) * 0.1}; 
  return density;
}



var oldMap = function(p) {
  //return  simplex.noise3D(p.x,p.y,p.z);
 // return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) - 1;
 // return Math.sqrt(p.x * p.x + p.y * p.y   - simplex.noise3D(p.x,p.y,p.z)) - 1; //tunnel
  //return Math.sqrt(p.y * 4  -  simplex.noise3D(p.x,p.y,p.z)) - 1; //landscape
  //return p.x * p.x + p.y * p.y   - simplex.noise3D(p.x,p.y,p.z) ; //structure
  let adj = 0.
 // if (p.x > -0.2 && p.x <0.2) {adj = -Math.abs(simplex.noise3D(p.x,p.y,p.z))} //wall
  //if (p.x > -0.4 && p.x <0.4 && p.z >-0.4 && p.z < 0.4) {adj = -Math.abs(simplex.noise3D(p.x,p.y,p.z))}
 // adj = adj * 8; 
  //if (p.x > -0.2 && p.x <0.2) {adj += -Math.abs(simplex.noise3D(p.x,p.y,p.z))} //wall
  
  if (p.x > -1.4 && p.x <-1.0) {adj += -Math.abs(simplex.noise3D(p.x,p.y,p.z + gridpos * 1.18))} //wall
  if (p.x > 0.8 && p.x <1.2) {adj += -Math.abs(simplex.noise3D(p.x,p.y,p.z + gridpos * 1.18)) + p.y} //wall
  
  if (gridpos ==4){
   if (p.z < -0.5) {adj += -Math.abs(simplex.noise3D(p.x,p.y,p.z + gridpos * 1.18)) * 3  }
   if (p.x > -0.2 && p.x < 0.2) { adj = -0. }
  }
  return p.y + adj * Math.abs(p.z + Math.sin(gridpos * 120) * 6 ) - simplex.noise3D(p.x,p.y,p.z) *0.1 ; //wall with hole
  //return p.y + adj * 6. - simplex.noise3D(p.x,p.y,p.z) *0.1 ; //structure
};


function chunk(gridpos){
  this.d = 32;
  this.dims = [this.d, this.d, this.d];
  this.b = 2;
  this.bounds = [[-this.b, -this.b, -this.b ], [this.b, this.b, this.b]];
  this.gridpos = gridpos;
  this.gridposadjust = new THREE.Vector3(gridpos.x,gridpos.y,gridpos.z);
  this.gridposadjust.multiply(new THREE.Vector3(adjust * 2, adjust * 2,adjust * 2));
  const self = this; //nasty
  this.map = function(p) {
    return densityGenerator(p.add(self.gridposadjust));
  }
  this.makeObj();

}
const scale = 10
chunk.prototype.makeObj = function(){
  let geom = new THREE.IsosurfaceGeometry(this.dims, this.map, this.bounds);
  assignUVs(geom);
  geom.scale(scale,scale,scale);
  this.obj = new THREE.Mesh(geom);
  this.obj.material.side = THREE.DoubleSide;
  this.obj.material = passMat
  this.obj.material.extensions.derivatives = true
}


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
player.addComponent(WASD);

player.position.y = 4;
player.position.z = 10;


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

function ready(){
  for (let i = -1;i<2; i++){
    for (let j = 0;j<1; j++){
      for (let k = -1;k<2; k++){
        const c = new chunk(new THREE.Vector3(i,j,k));
        scene.add(c.obj);
        c.obj.position.set(i * adjust * 2 * scale ,j * adjust * 2 * scale ,k * adjust * 2 * scale);
      }
    }
   }
}

const passMat = new THREE.ShaderMaterial({
  vertexShader: glslify('../shaders/rock_vert.glsl'),
  fragmentShader: glslify('../shaders/rock_frag.glsl'),
  uniforms: {
    normalMap: {type: 't', value:normalMap},
    iGlobalTime: { type: 'f', value: 0 },
    iResolution: { type: 'v2', value: new THREE.Vector2() },
  },
  defines: {
    USE_MAP: '',
  },
});
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

//obj.material = deformMat;

app.on('tick', (dt) => {
  kd.tick();
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

app.start();
resize();


// keyboard input




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
  // wor.gravity = new CANNON.Vec3(0, -0.1, 0) // m/s²
  //wor.gravity = new CANNON.Vec3(0, 0, 0); // m/s²

  wor.broadphase = new CANNON.NaiveBroadphase();

  wor.solver.iterations = 10;


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


function resize() {
  const [width, height] = app.shape;
  camera.aspect = width / height;
  renderer.setSize(width, height, false);

  camera.updateProjectionMatrix();
}






