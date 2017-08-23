import * as THREE from 'three';
import SimplexNoise from 'simplex-noise'

export default function (self) {
self.addEventListener("message", go);

const simplex = new SimplexNoise();

function go(message) {
  var vector = message.data.vector;
  var density = calculateDensity(vector);

  self.postMessage({
    "command":"done",
    "density": density
  });
}

function calculateDensity(vector){
  let density = flatFloor(vector);
  let keep = building(vector); 
  density = Math.min(density, keep);
  density +=  simplex.noise3D(vector.x,vector.y,vector.z) * 0.1; 
  return density; 
  }



function sdBox( p, b ,s)
{
  let d = {}
  d.x = Math.abs(p.x / s) - b.x;
  d.y = Math.abs(p.y / s) - b.y;
  d.z = Math.abs(p.z / s) - b.z;
  return (Math.min(Math.max(d.x,Math.max(d.y,d.z)),0.0) + Math.max(d.x,0.0) + Math.max(d.y,0.0) + Math.max(d.z,0.0)) * s;
}
function flatFloor(vector){
  return vector.y;
}
function building(vector) {
  let object = sdBox(vector, new THREE.Vector3(2,5,2),1)
  return object;
}
}
