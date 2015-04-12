function World(size, chunkSize, cubeSize) {
    var self = this; // I hate this hack so much.

    this.chunks = {};
    this.size = size;
    this.chunkSize = chunkSize;
    this.cubeSize = cubeSize;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

    this.keyboard = new THREEx.KeyboardState();

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( 0xF0F0F0 );

    this.collider = [];




    this.mouseray = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();


    // document.body.addEventListener('mousemove', function ( event ) {
    //     if ( !self.player.float ) {
    //         return;
    //     }
    //
    //     event.preventDefault();
    //
	// 	self.mouse.set( ( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1 );
    //
	// 	self.mouseray.setFromCamera( self.mouse, self.camera );
    //
	// 	var intersects = self.mouseray.intersectObjects( self.collider );
    //
	// 	if ( intersects.length > 0 ) {
    //         var intersect = intersects[ 0 ];
    //
	// 		self.rollOverMesh.position.copy( intersect.point ).add( intersect.face.normal );
	// 		self.rollOverMesh.position.divideScalar( self.cubeSize ).floor().multiplyScalar( self.cubeSize ).addScalar( self.cubeSize/2 );
	// 	}
    // });




    document.body.appendChild( this.renderer.domElement );

    this.initScene = function (size, step) {
        // Plate to use for initial cubes.
        var plate = new THREE.PlaneBufferGeometry(1000, 1000);
        plate.applyMatrix(new THREE.Matrix4().makeRotationX( -Math.PI / 2));
        plate.computeFaceNormals();

        var plane = new THREE.Mesh(plate);
        self.collider.push(plane);

        if ( self.player)
            self.player.colliders = self.collider;

        self.scene.add(plane);

        // Lighting
        var ambient = new THREE.AmbientLight( 0xcccccc );
        self.scene.add(ambient);

        var directional = new THREE.DirectionalLight( 0xffffff, 2 );
        directional.position.set( 1, 2, 0.5 ).normalize();
        self.scene.add(directional);

        // Grid
        var geometry = new THREE.Geometry();

        for ( var i = 0; i <= 2*size; i += step ) {
            geometry.vertices.push(new THREE.Vector3(       0, 0, i ));
            geometry.vertices.push(new THREE.Vector3(  2*size, 0, i ));

            geometry.vertices.push(new THREE.Vector3( i, 0,     0 ));
            geometry.vertices.push(new THREE.Vector3( i, 0,  2*size ));
        }

        var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2, transparent: true });
        var line = new THREE.Line(geometry, material, THREE.LinePieces);

        self.scene.add(line);
    };

    this._add = function (x, y, z, color) {
        var chunk = [ Math.floor(x / self.cubeSize / self.chunkSize[0]), Math.floor(y / self.cubeSize / self.chunkSize[1]), Math.floor(z / self.cubeSize / self.chunkSize[2]) ];

        if ( self.chunks[chunk] == undefined ) {
            console.log("Creating chunk " + chunk);
            self.chunks[chunk] = new Chunk(chunk, self.chunkSize, self.cubeSize);
        }

        var pos = [(x / self.cubeSize) - (chunk[0] * self.chunkSize[0]),
                   (y / self.cubeSize) - (chunk[1] * self.chunkSize[1]),
                   (z / self.cubeSize) - (chunk[2] * self.chunkSize[2])];

        console.log(chunk);
        console.log(pos);

        self.chunks[chunk].add(pos[0], pos[1], pos[2], [255, 0, 255]);
    };

    this.add = function (x, y, z, color) {
        self._add(x * self.cubeSize, y * self.cubeSize, z * self.cubeSize, color);
    };

    this.render = function () {
		requestAnimationFrame( self.render );

        self.player.update();

        for ( var chunkPos in self.chunks ) { // Should be replaced with distance n stuff
            var chunk = self.chunks[chunkPos];

            if ( chunk.needsBuild ) {
                if ( chunk.mesh ) {
                    self.collider.splice(self.collider.indexOf(chunk.mesh), 1);
                    self.scene.remove(chunk.mesh);
                }

                chunk.build();
                self.scene.add(chunk.mesh);
                self.collider.push(chunk.mesh);
                self.player.colliders = self.collider;
            }
        }

		self.renderer.render(self.scene, self.camera);
    }

    this.initScene(cubeSize * 10, cubeSize);
    this.player = new Player(this.camera, this.scene, this.collider, this._add);
    this.render();
}
