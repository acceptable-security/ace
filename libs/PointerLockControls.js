/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );

	scope.pitchObject = new THREE.Object3D();
	scope.pitchObject.add( camera );

	scope.yawObject = new THREE.Object3D();
	scope.yawObject.add( scope.pitchObject );

	var PI_2 = Math.PI / 2;

	this.onMouseMove = function ( event ) {
		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		scope.yawObject.rotation.y -= movementX * 0.002;
		scope.pitchObject.rotation.x -= movementY * 0.002;

		scope.pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, scope.pitchObject.rotation.x ) );

		camera.updateProjectionMatrix();
	};

	document.addEventListener( 'mousemove', this.onMouseMove, false );

	this.enabled = false;

	this.getObject = function () {
		return scope.yawObject;
	};

	this.getDirection = function() {
		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, -1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {
			rotation.set( scope.pitchObject.rotation.x, scope.yawObject.rotation.y, 0 );
			v.copy( direction ).applyEuler( rotation );

			return v;

		}

	}();

};
