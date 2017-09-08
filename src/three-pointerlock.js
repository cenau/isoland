/**
 * @author mrdoob / http://mrdoob.com/
 * Source: https://github.com/mrdoob/three.js/blob/master/examples/js/controls/PointerLockControls.js
 *
 * Adopted to common js by Javier Zapata
 * Modified by geraint 
*/

module.exports = function ( camera ) {

  var THREE = window.THREE || require('three');

  var scope = this;
  this.gravity =true;
  camera.rotation.set( 0, 0, 0 );
  this.isCollision = false;
  var pitchObject = new THREE.Object3D();
  pitchObject.add( camera );

  var yawObject = new THREE.Object3D();
  yawObject.position.y = 5;
  yawObject.position.z = 0;
  yawObject.position.x = -1500;
  yawObject.rotation.y = -Math.PI/2;
  yawObject.add( pitchObject );

  var moveForward = false;
  var moveBackward = false;
  var moveLeft = false;
  var moveRight = false;
  var botDist = 0;
  var isOnObject = false;
  var canJump = false;

  var prevTime = performance.now();

  var velocity = new THREE.Vector3();

  var PI_2 = Math.PI / 2;

  var onMouseMove = function ( event ) {

    if ( scope.enabled === false ) return;

    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;

    pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

  };

  var onKeyDown = function ( event ) {

    switch ( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = true;
        break;

      case 37: // left
      case 65: // a
        moveLeft = true; break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        break;

      case 32: // space
        //if ( canJump === true ) velocity.y += 50;
        canJump = false;
        break;

    }

  };

  var onKeyUp = function ( event ) {

    switch( event.keyCode ) {

      case 38: // up
      case 87: // w
        moveForward = false;
        break;

      case 37: // left
      case 65: // a
        moveLeft = false;
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        break;

    }

  };

  document.addEventListener( 'mousemove', onMouseMove, false );
  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  this.enabled = false;

  this.getObject = function () {

    return yawObject;

  };

  this.isOnObject = function ( boolean ) {
    isOnObject = boolean;
    canJump = boolean;

  };

  this.getDirection = function() {

    // assumes the camera itself is not rotated

    var direction = new THREE.Vector3( 0, 0, -1 );
    var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

    return function( v ) {

      rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

      v.copy( direction ).applyEuler( rotation );

      return v;

    };

  }();

  this.update = function (dt) {
    if ( scope.enabled === false ) return;
    var time = performance.now();
    var delta = dt / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    
    if( this.gravity){
    velocity.y -= 9.8 * 5 * delta; // 100.0 = mass
    }
    if ( moveForward ) velocity.z -= 400.0 * delta;
    if ( moveBackward ) velocity.z += 400.0 * delta;

    if ( moveLeft ) velocity.x -= 400.0 * delta;
    if ( moveRight ) velocity.x += 400.0 * delta;
    
    if (this.gravity){
    if (this.isOnObject === true ) {
      if (this.botDist < 9){ 
       velocity.y +=  9.8 * 10 * delta + 10.;
      }
      velocity.y = Math.max( 0, velocity.y );
      canJump = true;
    }else {
    }
    }
    if (this.isCollision === true ) {
      velocity.x = -10;
      
      velocity.z = 10;
    }
    yawObject.translateX( velocity.x * delta );
    yawObject.translateY( velocity.y * delta );
    yawObject.translateZ( velocity.z * delta );

    if ( yawObject.position.y < -200 ) {

      velocity.y = 0;
  yawObject.position.y = 5;
  yawObject.position.z = 0;
  yawObject.position.x = -1500;

      canJump = true;
    }

    prevTime = time;
  };
};
