import * as THREE from 'three';
import createLoop from 'canvas-loop';
import kd from 'keydrown';
import ecs from 'tiny-ecs';
import ec from 'three-effectcomposer';
import isosurface from 'isosurface';
import EventEmitter from 'events';
import PointerLockControls from './three-pointerlock';
import QWorker from './DensityQWorker';
import QueryableWorker from './QueryableWorker';
import ProgressBar from 'progressbar.js';
import dat from 'dat.gui';
// systems
import initGraphics from './initGraphics';
import Tone from 'tone';
import Tonal from 'tonal'
// components
import Graphics from './Graphics';
import Position from './Position';
import Quaternion from './Quaternion';


//from https://github.com/Tonejs/Tone.js/blob/master/examples/scripts/THREE.Tone.js
/**
 *  Update the listener's position and orientation based on
 *  a THREE.Object3D that is passed in.
 *  Adapted from https://github.com/mrdoob/three.js/blob/dev/src/audio/PositionalAudio.js
 *  @param  {THREE.Object3D}  object
 *  @return  {Tone.Panner3D}  this
 */
Tone.Listener.constructor.prototype.updatePosition = (function(){

	if (!THREE){
		throw new Error("this method requires THREE.js");
	}

	var position = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();
	var scale = new THREE.Vector3();

	var orientation = new THREE.Vector3();

	return function(object){
		var up = object.up;
		object.matrixWorld.decompose( position, quaternion, scale);
		orientation.set(0, 0, -1).applyQuaternion( quaternion);

		this.setPosition(position.x, position.y, position.z);

		this.setOrientation(orientation.x, orientation.y, orientation.z, up.x, up.y, up.z);
	};

}());
const shuffle = (arr) => arr.sort(() => (Math.random() - 0.5))


Tone.Transport.bpm.value = 100;

class Conductor {
  constructor() {
    this.scale = this.generateScale();
  }
  generateScale() {
    const scale =
      Tonal.scale(
        'G ' + 
        shuffle(Tonal
          .scale.names())[0]
      )
    return scale  
  }
  generateFreqs(){
    const notes = shuffle(this.scale.map(note => Tonal.transpose(note + '1', '16M'))); 

    const freqs = notes.map(note => Tonal.note.freq(note))
    return freqs
    
  }

  update(){

    this.scale = this.generateScale();
  }
}

const conductor = new Conductor();

function makeBellPart(bell,timing){
		return new Tone.Sequence(function(time, freq){
			bell.frequency.setValueAtTime(freq + Math.random() * 0.5, time, Math.random()*0.5 + 0.5);
			bell.triggerAttack(time);
		}, conductor.generateFreqs(), timing);


}
function makeCongaPart(){
		return congaPart = new Tone.Sequence(function(time, pitch){
			conga.triggerAttack(pitch, time, Math.random()*0.5 + 0.5);
		}, conductor.generateFreqs(), "4t");
}
var bell = new Tone.MetalSynth({
			"harmonicity" : 50,
			"resonance" : 200,
			"modulationIndex" : 50,
			"envelope" : {
				"decay" : 3,
				"sustain" : 1,
			},
			"volume" : -30
		}).toMaster();
		var bellPart = makeBellPart(bell,"1t").start(0); 
var bell2 = new Tone.MetalSynth({
			"harmonicity" : 100,
			"resonance" : 100,
			"modulationIndex" : 30,
			"envelope" : {
				"decay" : 3,
				"sustain" : 1,
			},
			"volume" : -40
		}).toMaster();
		var bellPart2 = makeBellPart(bell2, "2t").start(0); 

var conga = new Tone.MembraneSynth({
			"pitchDecay" : 0.008,
			"octaves" : 2,
			"envelope" : {
				"attack" : 0.0006,
				"decay" : 0.5,
				"sustain" : 0.1
			}
		}).toMaster();
		var congaPart = makeCongaPart().start(0); 




Tone.Transport.scheduleRepeat(updateFreqs, "4m", "4m");

function updateFreqs(){
  conductor.update();
	bellPart = makeBellPart(bell,"1t");
	bellPart2 = makeBellPart(bell2,"2t");
	congaPart = makeCongaPart(); 
}
//  stuff that should be imports but doesnt work
const EffectComposer = ec(THREE);
// import { glslify } from 'glslify'
const glslify = require('glslify');
// needed for bug https://github.com/stackgl/glslify/issues/49 - if you try using fixes like glslify babel plugin, then shaders wont live reload!!

const worldDebug = false;

// sF 10 and scale 10
// sF 10 and scale 100 ; cool 


const adjustLookup = [{dims:4, adjust:1.5},{dims:8, adjust:1.750 },{dims:24, adjust:1.876 },{dims:32, adjust:1.935}  ]

let scale = 20
if (worldDebug == true){
scale = 2;
}
const sf = 10
const dims = 4
const adjust = adjustLookup
  .find(x => x.dims ===dims)
  .adjust;  

//assets
//
var noise = new Tone.Noise({
			"volume" : 0,
			"type" : "brown"
		})

var osc = new Tone.Oscillator({
			"frequency" : 440,
			"volume" : 10
		})

var osc2 = new Tone.Oscillator({
			"frequency" : 200,
			"volume" : 10
		})

var noiseb = new Tone.Noise({
			"volume" : 0,
			"type" : "brown"
		})

var oscb = new Tone.Oscillator({
			"frequency" : 440,
			"volume" : 10
		})

var osc2b = new Tone.Oscillator({
			"frequency" : 200,
			"volume" : 10
		})

var cheby = new Tone.Chebyshev(50);
var crusher = new Tone.BitCrusher(8).connect(cheby);
crusher.toMaster();
var audioTarget = new Tone.Panner3D().connect(crusher);
var audioTargetb = new Tone.Panner3D().connect(crusher);
osc.connect(audioTarget);
osc.sync();
osc.start();
osc2.connect(audioTarget);
osc2.sync();
osc2.start();
noise.connect(audioTarget);
noise.sync();
noise.start();
oscb.connect(audioTargetb);
oscb.sync();
oscb.start();
osc2b.connect(audioTargetb);
osc2b.sync();
osc2b.start();
noiseb.connect(audioTargetb);
noiseb.sync();
noise.start();
//loop.start("1m");
Tone.Transport.start();
const scene = new setupScene()
const gui = new dat.GUI()
document.getElementsByClassName('dg')[0].style.zIndex = 1;
document.getElementsByClassName('dg')[0].style.display = "none";
let uScale = {"value":0.01};
gui.add(uScale, 'value',0.000,10).name('scale');

// physics

const raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );;
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

let navMeshes = []
// the player
const player = ents.createEntity();

player.addComponent(Position);
player.addComponent(Quaternion);
player.addComponent(Graphics);

player.position.y = 0;

const collideGeom = new THREE.BoxGeometry(10,10,10,1);
const collideMesh = new THREE.Mesh(collideGeom);
collideMesh.position.y = 15;
scene.add(collideMesh);

const navGeom = new THREE.TetrahedronGeometry(1,0);
const landingGeom = new THREE.CylinderGeometry(30,30,200,32);
const landingMesh = new THREE.Mesh(landingGeom);
landingMesh.position.y = -60;
landingMesh.position.x = -1500;
scene.add(landingMesh);

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
    scale: { type: 'f', value: uScale.value },
  },
  defines: {
    USE_MAP: '',
  },
});
const runeMat = new THREE.ShaderMaterial({
  vertexShader: glslify('../shaders/rock_vert.glsl'),
  fragmentShader: glslify('../shaders/rune_frag.glsl'),
  uniforms: {
    iGlobalTime: { type: 'f', value: 0 },
    iResolution: { type: 'v2', value: new THREE.Vector2() },
    scale: { type: 'f', value: uScale.value },
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





document.addEventListener("DOMContentLoaded", function(event) 
{

})

var servitor = new QueryableWorker(QWorker)

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
    color: 0xffffff,
    wireframe: true
});

collideMesh.material = runeMat;
landingMesh.material = runeMat;
landingMesh.material.transparent = true
collideMesh.material.transparent = true
landingMesh.material.side = THREE.DoubleSide;

function ChunkManager(webWorker,progress){
  this.dims = dims;
  this.bounds = 2;
  this.webWorker = webWorker;
  this.chunks = [];
  this.requested = [];
  this.progress = progress;
}


ChunkManager.prototype.getNeighbours = function(gridpos){
  let neighbourPos = []; 
 
  for (let k= -5;k<5;k++){
  for (let j=-3;j<=3;j++){
  for (let i =0; i <10;i++){
  let vector = camera.getWorldDirection();
  let theta = Math.atan2(vector.x,vector.z);
  let result = new THREE.Vector3();
  
  result.copy(gridpos);
  result.x = result.x + Math.sin(theta + j * 0.1) * i;
  result.z = result.z + Math.cos(theta + j * 0.1)*i;
  result.x = Math.round(result.x);
    result.y = result.y + k
  result.z = Math.round(result.z);
  neighbourPos.push([result.x,result.y,result.z]);
        
  }
  }
  }
  let missing = []
  for (let p in neighbourPos){
    let pos = new THREE.Vector3(neighbourPos[p][0],neighbourPos[p][1],neighbourPos[p][2]);
  

    const thisChunk = this.chunks.find(x => x.gridpos.equals(pos));
    
    if (thisChunk === undefined){
      missing.push(pos);
    }
  }
  return missing;
}
ChunkManager.prototype.worldToGrid = function(worldpos){
 let gridpos = new THREE.Vector3();
  gridpos.copy(worldpos);

  gridpos.x * adjust * 2 * scale
  gridpos.z * adjust * 2 * scale
  gridpos.y * adjust * 2 * scale
  gridpos.divideScalar(adjust * 2 * scale);
  gridpos.round();
  return gridpos;

}
ChunkManager.prototype.update = function(player){
 
  const gridpos = this.worldToGrid(new THREE.Vector3(player.position.x,player.position.y,player.position.z));
   
  const missing = this.getNeighbours(gridpos);
  for (let chunk in missing){
    let loadIt = false;
    if (this.requested.length == 0){
      loadIt = true;
    }
    else{
     if (!this.requested.find(x => x.equals(missing[chunk]))){
      loadIt = true 
     }
      
      
    
  }
    if (loadIt ==true){
      this.requestChunk(missing[chunk],false);
        this.webWorker.addListener('isoDone', (geom, gridpos) => {
          this.addChunkToWorld(geom,gridpos);
        });
  }
  }

}

ChunkManager.prototype.requestInitialChunks = function(gridsize,origin) {
        const chunkLength  = gridsize.x * gridsize.y * gridsize.z; 
        this.progress.total += chunkLength; 
        let normalisedGrid = new THREE.Vector3(
    (gridsize.x - 1) /2,
    (gridsize.y -1) /2,
    (gridsize.x -1) /2 
  );

  
  for (let i = -normalisedGrid.x;i<=normalisedGrid.x; i++){
    for (let j = -normalisedGrid.y;j<=normalisedGrid.y; j++){
      for (let k = -normalisedGrid.z;k<=normalisedGrid.z; k++){
        this.requestChunk(new THREE.Vector3(origin.x + i, origin.y + j,origin.z + k),true);
        this.webWorker.addListener('isoDoneBlocking', (geom, gridpos) => {
            this.addChunkToWorld(geom,gridpos);
          this.progress.increment();
        });
      }
    }
   }
}



ChunkManager.prototype.requestChunk = function(gridpos,blocking){
  let gridposadjust = new THREE.Vector3(gridpos.x,gridpos.y,gridpos.z);
  gridposadjust.multiply(new THREE.Vector3(adjust * 2, adjust * 2,adjust * 2));
  this.requested.push(gridpos)
  servitor.sendQuery('getIso',gridposadjust,gridpos,this.dims,this.bounds,sf,blocking) 
}


ChunkManager.prototype.addChunkToWorld = function(g,gridpos){
  const loader = new THREE.JSONLoader();
    let geom = loader.parse( g ).geometry
    geom.__proto__ = THREE.IsosurfaceGeometry.prototype;
    assignUVs(geom);
    geom.scale(scale,scale,scale);
    let obj = new THREE.Mesh(geom);
    obj.material.side = THREE.DoubleSide;
    obj.material = passMat
    scene.add(obj);
    obj.position.set(gridpos.x * adjust * 2 * scale ,gridpos.y * adjust * 2 * scale ,gridpos.z * adjust * 2 * scale);
    obj.gridpos = new THREE.Vector3(gridpos.x,gridpos.y,gridpos.z);
    this.chunks.push(obj) 
    
  }

ChunkManager.prototype.switchMat = function(mat){
  for ( var c in this.chunks){
    this.chunks[c].material = mat

    this.chunks[c].material.side = THREE.DoubleSide;
  }
  
}


 var bel = document.createElement('div')
 bel.id= "blocker"


 document.body.append(bel)

 var iel = document.createElement('figcaption')
 iel.id= "instructions"
  
 var pel = document.createElement('div')
 pel.id= "progress"
 pel.style.height = "200px" 
 pel.style.width = "200px"
 bel.append(pel)
 pel.append(iel)

function Progress(){
  this.total = 0;
  this.current = 0;
  this.graphic = new ProgressBar.Circle('#progress', {
       text: {
        // Initial value for text.
        // Default: null
        //value: 'Text',

        // Text color.
        // Default: same as stroke color (options.color)
        //color: '#f00',

        // Class name for text element.
        // Default: 'progressbar-text'
        //className: 'progressbar__label',
   style: {
          // or fontSize: '28px'
          'font-size': 'xx-large',
     'position': 'absolute',
    'left': '50%',
    'top': '50%',
    'padding': '0px',
    'margin': '0px',
    'transform': 'translate(-50%, -50%)'
        },
        // If true, CSS is automatically set for container and text element.
        // If you want to modify all CSS your self, set this to false
        // Default: true
        autoStyle: true
    },
        color: '#555',
        strokeWidth: 5,
    trailWidth: 1,
     trailColor: '#555',
        duration: 500,
        easing: 'easeInOutQuart',
    from: { color: '#999', width: 1 },
  to: { color: '#ccc', width: 2 },
  // Set default step function for all animate calls
  step: function(state, circle) {
    circle.path.setAttribute('stroke', state.color);
    circle.path.setAttribute('stroke-width', state.width);
    var value = Math.round(circle.value() * 100);
    circle.setText(value);

    if (value ==0) {
     circle.setText("LOADING");

    }
    if (value ==100){
    circle.setText("CLICK");
      
    }
  }

  });
}

Progress.prototype.increment = function(){
  this.current ++
  this.graphic.animate(this.current/this.total);
  if (this.current >= this.total){
    this.done()
  }
}
Progress.prototype.done = function(){
  //chunkManager.switchMat(passMat);
  this.graphic.setText("CLICK");
            var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
            if ( havePointerLock ) {
                var element = document.body;
                var pointerlockchange = function ( event ) {
                    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
                        controls.enabled = true;
                         blocker.style.display = 'none';
                    } else {
                        controls.enabled = false;
                        blocker.style.display = 'flex';
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
                blocker.addEventListener( 'click', function ( event ) {
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
  

}

 var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );




//obj.material = deformMat;
app.on('tick', (dt) => {
  kd.tick();
  if (worldDebug == true){
  controls.getObject().position.y = 40;
  controls.gravity = false;
  }
 
  const testPos = controls.getObject().position
  if (testPos.x > -10 && testPos.x < 10 && testPos.z > -10 && testPos.z < 10){
    console.log("THERE!")
  }

  Tone.Listener.updatePosition(camera);
  audioTarget.updatePosition(collideMesh);
  audioTargetb.updatePosition(landingMesh);
  
  for (let navMesh of navMeshes){
    var dir = new THREE.Vector3(); 

    navMesh.position.sub(dir.subVectors( navMesh.position, collideMesh.position ).normalize().multiplyScalar(5));
  }
  //player.position.x = controls.getObject().position.x
  //player.position.y = controls.getObject().position.y
  //player.position.z = controls.getObject().position.z

 //collideMesh.position.copy(controls.getObject().position);  

/*for (var vertexIndex = 0; vertexIndex < collideMesh.geometry.vertices.length; vertexIndex++)
{       
    var localVertex = collideMesh.geometry.vertices[vertexIndex].clone();
    var globalVertex = localVertex.applyMatrix4( collideMesh.matrixWorld );
    var directionVector = globalVertex.sub( collideMesh.position );

    raycaster.ray.origin.copy(collideMesh.position)
    raycaster.ray.direction = directionVector.clone().normalize() ;
    var collisionResults = raycaster.intersectObjects( chunkManager.chunks );
    if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
    {
       collisions++
    }
}
*/
 raycaster.ray.origin.copy( controls.getObject().position );
					raycaster.ray.origin.y -= 10;
          raycaster.ray.direction =new THREE.Vector3( 0, - 1, 0 )
					var intersections = raycaster.intersectObjects( chunkManager.chunks );
   if (intersections.length > 0) 
    {  
    controls.botDist = intersections[intersections.length-1].distance
    } 
      controls.isOnObject = intersections.length > 0;
 raycaster.ray.origin.copy( controls.getObject().position );
 raycaster.ray.direction = controls.getDirection(new THREE.Vector3()).clone().normalize()
					intersections = raycaster.intersectObjects( chunkManager.chunks );
    
  if (controls.enabled){
    if (landingMesh.position.y > -10000){
    landingMesh.position.y -=1.5;
    }
  } 
  controls.isCollision = intersections.length > 0; 
  controls.update(dt)
  time += dt / 1000;
  passMat.uniforms.scale.value = uScale.value;
  runeMat.uniforms.iGlobalTime.value = time;
  composer.render(scene, camera);
  renderer.render(scene, camera, composer.bufferTexture);
  composer.passthroughEffect.uniforms.iGlobalTime.value = time;
  let distortDistance = Math.min(testPos.distanceTo( collideMesh.position),testPos.distanceTo( landingMesh.position ) );
  let distort = 0
    if (distortDistance < 100) {
    distort = 1 - distortDistance * 0.01;
      console.log(distortDistance)
    if (testPos.distanceTo( collideMesh.position) <=10)
      {
        distort *= 100;
        window.location.replace('https://bitly.com/98K8eH');
      }
  }
  composer.passthroughEffect.uniforms.amount.value = distort; 
  //chunkManager.update(controls.getObject());



  
  // run system inits
  ents.queryComponents([Graphics]).forEach((each) => {
    if (!each.graphics.inScene) {
      initGraphics(scene, each);
    }
  });
  // run systems

  // update mesh from position
  ents.queryComponents([Graphics, Position]).forEach((each) => {
    each.graphics.mesh.position.copy(each.position);
  });
  // update mesh from quaternion
  ents.queryComponents([Graphics, Quaternion]).forEach((each) => {
    each.graphics.mesh.quaternion.copy(each.quaternion);
  });


  camera.position.copy(player.position);
  camera.quaternion.copy(player.quaternion);
  collideMesh.rotation.y += 0.001 * dt ;
  collideMesh.rotation.z -= 0.001 * dt ;
});


app.on('resize', resize);



// keyboard input


kd.Q.down(() => {
/*
let navMesh = new THREE.Mesh(navGeom);
navMesh.position.copy(controls.getObject().position)
navMesh.material = runeMat;
navMesh.transparent = true;

scene.add(navMesh)
navMeshes.push(navMesh)
*/
});

kd.Z.down(() => {

  chunkManager.switchMat(wireMat);

});
kd.X.down(() => {
  chunkManager.switchMat(passMat);


});

kd.W.down(() => {
   
  

});

kd.S.down(() => {

});

kd.A.down(() => {

});

kd.D.down(() => {

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
      amount: {type:'f',value: 0},
    },
    vertexShader: glslify('../shaders/pass_vert.glsl'),
    fragmentShader: glslify('../shaders/end_frag.glsl'),

  };

  // effect composer to deal with the screen shaders
  effectComposer.addPass(new EffectComposer.RenderPass(scene, camera)); // the actual scene
  effectComposer.passthroughEffect = new EffectComposer.ShaderPass(passthroughShader);

  effectComposer.addPass(effectComposer.passthroughEffect); // adding the passthrough shader

  effectComposer.passes[effectComposer.passes.length - 1].renderToScreen = true;

  return effectComposer;
}


const controls = new PointerLockControls( camera );
scene.add( controls.getObject() );
Tone.Listener.updatePosition(camera);

var controlsEnabled = false;
			var moveForward = false;
			var moveBackward = false;
			var moveLeft = false;
			var moveRight = false;
			var canJump = false;
			var velocity = new THREE.Vector3();


const progress = new Progress();
const chunkManager = new ChunkManager(servitor,progress);
chunkManager.requestInitialChunks(new THREE.Vector3(10,3,10),new THREE.Vector3(-25,0,0));
chunkManager.requestInitialChunks(new THREE.Vector3(10,3,10),new THREE.Vector3(-15,0,0));
chunkManager.requestInitialChunks(new THREE.Vector3(30,10,30),new THREE.Vector3(0,0,0));

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
//from https://medium.com/@lachlantweedie/animation-in-three-js-using-tween-js-with-examples-c598a19b1263
function animateVector3(vectorToAnimate, target, options){
    options = options || {};
    // get targets from options or set to defaults
    var to = target || THREE.Vector3(),
        easing = options.easing || TWEEN.Easing.Quadratic.In,
        duration = options.duration || 2000;
    // create the tween
    var tweenVector3 = new TWEEN.Tween(vectorToAnimate)
        .to({ x: to.x, y: to.y, z: to.z, }, duration)
        .easing(easing)
        .onUpdate(function(d) {
            if(options.update){
                options.update(d);
            }
         })
        .onComplete(function(){
          if(options.callback) options.callback();
        });
    // start the tween
    tweenVector3.start();
    // return the tween in case we want to manipulate it later on
    return tweenVector3;
}





/**
 *  Update the position of this panner based on 
 *  a THREE.Object3D that is passed in.
 *  Adapted from https://github.com/mrdoob/three.js/blob/dev/src/audio/PositionalAudio.js
 *  @param  {THREE.Object3D}  object
 *  @return  {Tone.Panner3D}  this
 */
Tone.Panner3D.prototype.updatePosition = (function(){

	if (!THREE){
		throw new Error("this method requires THREE.js");
	}

	var position = new THREE.Vector3();

	return function(object){
		position.setFromMatrixPosition(object.matrixWorld);
		this.setPosition(position.x, position.y, position.z);
	};
}());


