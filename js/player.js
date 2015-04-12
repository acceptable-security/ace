function Player(camera, scene, colliders, _add) {
    var self = this; // EEWW :(

    this.camera = camera;
    this.scene = scene;
    this.colliders = colliders;
    this.controls = new THREE.PointerLockControls(this.camera);
    this.scene.add(this.controls.getObject());
    this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
    this._add = _add;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;

	this.prevTime = performance.now();
    this.velocity = new THREE.Vector3();

    this.float = false;

    this.mass = 100;
    this.gravity = 9.8;
    this.size = [10.0, 10.0, 10.0];
    this.acceleration = [400.0, 350.0, 400.0];
    this.position = [0.0, 0.0, 0.0];

    this.mouse = new THREE.Vector2();
    this.cubeSize = 25;

    this.rollOverGeo = new THREE.BoxGeometry( this.cubeSize, this.cubeSize, this.cubeSize );
    this.rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
    this.rollOverMesh = new THREE.Mesh( this.rollOverGeo, this.rollOverMaterial );
    this.scene.add( this.rollOverMesh );

    var blocker = document.getElementById( 'blocker' );
	var instructions = document.getElementById( 'instructions' );

    var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

	if ( havePointerLock ) {
        var element = document.body;

        var pointerlockchange = function ( event ) {
			if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
				self.controlsEnabled = true;
				self.controls.enabled = true;

				blocker.style.display = 'none';
            }
            else {
                if ( self.float ) return;

                self.controls.enabled = false;

				blocker.style.display = '-webkit-box';
				blocker.style.display = '-moz-box';
				blocker.style.display = 'box';

				instructions.style.display = '';
            }
        };

		var pointerlockerror = function ( event ) {
			instructions.style.display = '';
	    };

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
            }
            else {
                element.requestPointerLock();
            }
        }, false );
    }
    else {
		instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
	}

	document.addEventListener('keydown', function ( event ) {
        if ( event.keyCode == 67 ) {
            if ( self.float ) { // Become FPS
                self.camera.position.set( self.position[0], self.position[1], self.position[2] );

                var element = document.body;

                element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

        		if ( /Firefox/i.test( navigator.userAgent ) ) {
                    element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
                    element.requestFullscreen();
                }
                else {
                    element.requestPointerLock();
                }

				self.controls.enabled = true;

                self.float = !self.float;
            }
            else { // Become float
                self.camera.position.set( 200, 200, 200 );
                self.camera.lookAt( new THREE.Vector3() );

                self.float = !self.float;

                document.exitPointerLock();

                self.controls.enabled = false;
            }

            return;
        }

        if ( self.float ) {
            return;
        }

        switch ( event.keyCode ) {
            case 38: // up
			case 87: // w
			    self.moveForward = true;
				break;

			case 37: // left
			case 65: // a
				self.moveLeft = true;
                break;

			case 40: // down
			case 83: // s
				self.moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				self.moveRight = true;
				break;

			case 32: // space
				if ( self.canJump === true ) self.velocity.y += self.acceleration[1];
					self.canJump = false;
				break;
		}
	}, false);

	document.addEventListener('keyup', function ( event ) {
        if ( self.float ) {
            return;
        }

        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                self.moveForward = false;
                break;

            case 37: // left
            case 65: // a
                self.moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                self.moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                self.moveRight = false;
                break;
        }
    }, false);

    document.body.addEventListener('click', function ( event ) {
        if ( !self.float ) {
            return;
        }

        self.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

        self.mouseray.setFromCamera( self.mouse, self.camera );

        var intersects = self.mouseray.intersectObjects(self.colliders);

        if ( intersects.length > 0 ) {
            var intersect = intersects[0];

            var pos = new THREE.Vector3().copy(intersect.point).add(intersect.face.normal);
            pos.divideScalar( self.cubeSize ).floor().multiplyScalar( self.cubeSize ).addScalar( self.cubeSize/2 );

            self._add(pos.x, pos.y, pos.z, [(pos.x * 2000) % 255, (pos.y * 2000) % 255, (pos.z * 2000) % 255]);
        }
    });

    document.body.addEventListener('mousemove', function ( event ) {
        if ( !self.float ) return;

        event.preventDefault();

    	self.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );

    	self.raycaster.setFromCamera( self.mouse, self.camera );

    	var intersects = self.raycaster.intersectObjects( self.colliders );

    	if ( intersects.length > 0 ) {
    		var intersect = intersects[ 0 ];

    		self.rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
    		self.rollOverMesh.position.divideScalar( self.cubeSize ).floor().multiplyScalar( self.cubeSize ).addScalar( self.cubeSize/2 );
    	}
    });

    this.update = function () {
        if ( !self.float ) {
            self.raycaster.ray.origin.copy( self.controls.getObject().position );
    		self.raycaster.ray.origin.y -= 10;

    		var intersections = self.raycaster.intersectObjects(self.colliders);

    		var isOnObject = intersections.length > 0;

    		var time = performance.now();
    		var delta = ( time - self.prevTime ) / 1000;

    		self.velocity.x -= self.velocity.x * self.size[0] * delta;
    		self.velocity.z -= self.velocity.z * self.size[2] * delta;
    		self.velocity.y -= self.gravity * self.mass * delta;

    		if ( self.moveForward )  self.velocity.z -= self.acceleration[2] * delta;
    		if ( self.moveBackward ) self.velocity.z += self.acceleration[2] * delta;

        	if ( self.moveLeft )  self.velocity.x -= self.acceleration[0] * delta;
    		if ( self.moveRight ) self.velocity.x += self.acceleration[0] * delta;

    		if ( isOnObject === true ) {
    			self.velocity.y = Math.max( 0, self.velocity.y );

    			self.canJump = true;
    		}

    	    self.controls.getObject().translateX( self.velocity.x * delta );
    		self.controls.getObject().translateY( self.velocity.y * delta );
    		self.controls.getObject().translateZ( self.velocity.z * delta );

    		if ( self.controls.getObject().position.y < self.size[1] ) {
    			self.velocity.y = 0;
    			self.controls.getObject().position.y = self.size[1];

    			self.canJump = true;
    		}

            self.position = [self.camera.position.x, self.camera.position.y, self.camera.position.z];
    		self.prevTime = time;
        }
        else {
            // console.log("NO UPDATE")
        }
    }
}
