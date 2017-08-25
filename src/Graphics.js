import * as THREE from 'three';

export default Graphics;


function Graphics() {
  this.geom = new THREE.SphereGeometry(
    1, 1,
    1, 1,
  );
  this.mesh = new THREE.Mesh(this.geom)
  this.inScene = false;
}

Graphics.prototype.setIsInScene = function (bool) {
  this.inScene = bool;
};
