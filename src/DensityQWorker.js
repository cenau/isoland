// queryable web worker stuff based on https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
import SimplexNoise from 'simplex-noise'
import * as THREE from 'three';
import isosurface from 'isosurface';
export default function (self) {
const simplex = new SimplexNoise();//TODO check this is only called once as its expensive

var queryableFunctions = {
  getIso: function(gridposadjust,gridpos,d,b,s,blocking) {
  self.scaleFactor = s;
  const dims = [d, d, d];
  const bounds = [[-b, -b, -b ], [b, b, b]];
  const map = function(p) {
    return densityGenerator(p.add(gridposadjust));
  }
  const geom = new THREE.IsosurfaceGeometry(dims, map, bounds);
    if (blocking) {reply('isoDoneBlocking', geom.toJSON(),gridpos);
    }
    else {
      reply('isoDone', geom.toJSON(),gridpos);
    }
    },
  ping: function() {
      reply('pong'); 
  }
};


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

// distance fucntions adapted from http://iquilezles.org/www/articles/distfunctions/distfunctions.htm


function opTx( p, m )
{
    let mi = new THREE.Matrix4();
    mi.getInverse(m)
    let q = p.clone();
    
    q.applyMatrix4(mi);
    return q;
}

function sdBox( p, b ,s)
{
  let d = {}
  d.x = Math.abs(p.x / s) - b.x;
  d.y = Math.abs(p.y / s) - b.y;
  d.z = Math.abs(p.z / s) - b.z;
  return (Math.min(Math.max(d.x,Math.max(d.y,d.z)),0.0) + Math.max(d.x,0.0) + Math.max(d.y,0.0) + Math.max(d.z,0.0)) * s;
}

function  sdTorus( p, t )
{
  let q = new THREE.Vector2(new THREE.Vector2(p.x,p.z).length() - t.x,p.y);
  return q.length()-t.y;
}

function sdSphere( p, s )
{
  let q = p.clone();
  return q.length()-s;
}

function  sdCone( p, c )
{
  let q = Math.sqrt(Math.pow(p.x,2) +Math.pow(p.z,2));
  console.log(c.dot(new THREE.Vector2(q,p.z)))
  return c.dot(new THREE.Vector2(q,p.z));
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

function surroundingWall(vector) {
  let object = sdBox(vector, new THREE.Vector3(5,1.5,5),1)
  object = Math.max(object, -sdBox(vector, new THREE.Vector3(4,1.6,4),1))
  return object;
}

function gate(vector) {
  let object = sdBox(vector, new THREE.Vector3(1,1.3,1.1),1)
  return object;

}

function building(vector) {
  let object = sdBox(vector, new THREE.Vector3(2,4,2),1)
  return object;
}

function buildingTower(vector) {
  let object = sdBox(vector, new THREE.Vector3(1,4,1),1)
  return object;
}

function noise(vector,amount) {
  return simplex.noise3D(vector.x,vector.y,vector.z) * amount; 

}

function fortMap(vector){
  let rot = new THREE.Matrix4().makeRotationY(Math.PI/1.3);
  let rot2 = new THREE.Matrix4().makeRotationX(Math.sin(vector.z * 0.01) * 0.7);
  let rot3 = new THREE.Matrix4().makeRotationAxis(vector,0.01)
  let twistWhole = opTx(vector, rot);
  twistWhole = opTx(twistWhole,rot3);
  let density = flatFloor(twistWhole);
  vector = vector;
  vector.divideScalar(self.scaleFactor);
  rot = new THREE.Matrix4().makeRotationY(Math.sin(vector.y) * 0.3);
  const twist = opTx(vector, rot);
  let wall = surroundingWall(twist) +  Math.cos(vector.z) + Math.sin(vector.y); 
  wall = Math.max(wall,-gate(new THREE.Vector3(vector.x,vector.y,vector.z-5)));
  let keep = building(new THREE.Vector3(vector.x, vector.y * 4.2 - Math.cos(vector.y) *2 ,vector.z)); 
  keep = Math.min(keep,buildingTower(new THREE.Vector3(vector.x+1.5,vector.y,vector.z+1.5)));
  keep = Math.max(keep,-building(new THREE.Vector3(vector.x * 1.1,vector.y * (1.- vector.y),vector.z *1.1))) + noise(vector, 0.2);
  density = Math.min(density, wall);
  density = Math.min(density, keep);
  rot = new THREE.Matrix4().makeRotationX(Math.PI/2);
  var rotScale = opTx(vector,rot);
  const sc = 0.6
  rotScale.divideScalar(sc);
  
  density = Math.min(density,sdTorus(rotScale, new THREE.Vector2(sc,sc * 0.33))*sc);


  let walkrot = vector
  rot = new THREE.Matrix4().makeRotationZ(Math.sin(vector.x * 0.25)*0.0001);
  rot.makeRotationY(Math.sin(vector.x * 0.25)*0.001);
  walkrot = opTx(vector,rot)
  let walkway = sdBox(new THREE.Vector3(walkrot.x+8,walkrot.y+0.5,walkrot.z), new THREE.Vector3(5,0.2,1), 1);
  let sidewall = sdBox(new THREE.Vector3(walkrot.x+8,walkrot.y+0.1,walkrot.z+ 0.5), new THREE.Vector3(5,0.2,0.2), 1);
  let sidewall2 = sdBox(new THREE.Vector3(walkrot.x+8,walkrot.y+0.1,walkrot.z- 0.5), new THREE.Vector3(5,0.2,0.2), 1);
  walkway = Math.min(walkway,sidewall)
  walkway = Math.min(walkway,sidewall2)
  let landingSphere = sdSphere(new THREE.Vector3(walkrot.x +8, walkrot.y + 0.5, walkrot.z),0.8)
   //landingSphere = Math.max(-landingSphere, sdSphere( new THREE.Vector3(walkrot.x +8, walkrot.y + 0.5,walkrot.z),0.9))
   landingSphere = Math.max(landingSphere,-sdBox( new THREE.Vector3(walkrot.x +7.5, walkrot.y + 0.35,walkrot.z),new THREE.Vector3(0.5,0.4,0.3),1))
  walkway = Math.min(walkway,landingSphere)
  density = Math.min(density,walkway)
  if (density >0)  {density +=  simplex.noise3D(vector.x,vector.y,vector.z) * 0.1}; 
  if (density <=0)  {density +=  simplex.noise3D(vector.x,vector.y,vector.z) * 0.1}; 
  
  density * self.scaleFactor;
  return density;



}

function desertMap(vector){
  vector =new THREE.Vector3(vector.x,vector.y+0.8,vector.z);
  let density = flatFloor(vector);
  return density;
}


function densityGenerator(vector){
  return fortMap(vector);
 // return desertMap(vector);
}


// system functions

function defaultReply(message) {
  // your default PUBLIC function executed only when main page calls the queryableWorker.postMessage() method directly
  // do something
}

function reply() {
  if (arguments.length < 1) { throw new TypeError('reply - not enough arguments'); return; }
  postMessage({ 'queryMethodListener': arguments[0], 'queryMethodArguments': Array.prototype.slice.call(arguments, 1) });
}

onmessage = function(oEvent) {
  if (oEvent.data instanceof Object && oEvent.data.hasOwnProperty('queryMethod') && oEvent.data.hasOwnProperty('queryMethodArguments')) {
    queryableFunctions[oEvent.data.queryMethod].apply(self, oEvent.data.queryMethodArguments);
  } else {
    defaultReply(oEvent.data);
  }
};



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




}
