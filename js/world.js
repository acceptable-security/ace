function World(size, chunkSize, cubeSize, options) {
    var self = this; // I hate this hack so much.

    this.options = options;

    this.chunks = {};
    this.size = size;
    this.chunkSize = chunkSize;
    this.cubeSize = cubeSize;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor( 0xF0F0F0 );

    var asyncBuild = undefined;

    if ( window.Worker != undefined ) {
        asyncBuild = (function () {
            var listeners = [], builder = new Worker("js/chunkBuildWorker.js");

            builder.onmessage = function (event) {
                console.log(event.data);
                if ( listeners[event.data.id] ) {
                    listeners[event.data.id](event.data["verts"], event.data["norms"], event.data["colors"]);
                }
                delete listeners[event.data.id];
            };

            return function (list, blocks, position, cubeSize, listener) {
                listeners.push(listener || null);
                builder.postMessage({
                    "id": listeners.length - 1,
                    "list": list,
                    "blocks": blocks,
                    "position": position,
                    "cubeSize": cubeSize
                });
            };
        })();
    }

    //SSAO stuff
    if ( options['ssao'] ) {
        self.composer = new THREE.EffectComposer( self.renderer );
        self.composer.addPass( new THREE.RenderPass( self.scene, self.camera ) );

        self.depthTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

        var depthShader = THREE.ShaderLib[ "depthRGBA" ];
        var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

        self.depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader, uniforms: depthUniforms } );
        self.depthMaterial.blending = THREE.NoBlending;

        // postprocessing
        var effect = new THREE.ShaderPass( THREE.SSAOShader );
        effect.uniforms[ 'tDepth' ].value = self.depthTarget;
        effect.uniforms[ 'size' ].value.set( window.innerWidth, window.innerHeight );
        effect.uniforms[ 'cameraNear' ].value = self.camera.near;
        effect.uniforms[ 'cameraFar' ].value = self.camera.far;
        effect.renderToScreen = true;
        self.composer.addPass( effect );
    }

    this.collider = [];

    document.body.appendChild( this.renderer.domElement );

    this.initScene = function (size, step) {
        // Plate to use for initial cubes.
        var plate = new THREE.PlaneBufferGeometry(2000, 2000);
        plate.applyMatrix(new THREE.Matrix4().makeRotationX( -Math.PI / 2));
        plate.computeFaceNormals();

        var plane = new THREE.Mesh(plate);
        self.collider.push(plane);

        if ( self.player )
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
        var chunk = [ Math.floor(x / self.cubeSize / self.chunkSize[0]),
                      Math.floor(y / self.cubeSize / self.chunkSize[1]),
                      Math.floor(z / self.cubeSize / self.chunkSize[2]) ];

        if ( self.chunks[chunk] == undefined ) {
            console.log("Creating chunk " + chunk);
            self.chunks[chunk] = new Chunk(chunk, self.chunkSize, self.cubeSize);
        }

        var pos = [(x / self.cubeSize) - (chunk[0] * self.chunkSize[0]),
                   (y / self.cubeSize) - (chunk[1] * self.chunkSize[1]),
                   (z / self.cubeSize) - (chunk[2] * self.chunkSize[2])];

        console.log("Position: " + JSON.stringify(pos));

        self.chunks[chunk].add(pos[0], pos[1], pos[2], [255, 0, 255]);
    };

    this.add = function (x, y, z, color) {
        self._add(x * self.cubeSize, y * self.cubeSize, z * self.cubeSize, color);
    };

    this.render = function () {
        self.player.currentChunk = self.chunks[[ Math.floor(self.camera.position.x / self.chunkSize[0]),
                                                 Math.floor(self.camera.position.y / self.chunkSize[1]),
                                                 Math.floor(self.camera.position.z / self.chunkSize[2]) ]];
        self.player.colliders = self.collider;
		self.player.update();

        for ( var chunkPos in self.chunks ) { // Should be replaced with distance n stuff
            var chunk = self.chunks[chunkPos];
            if ( chunk.needsBuild ) {
                if ( chunk.mesh ) {
                    self.collider.splice(self.collider.indexOf(chunk.mesh), 1);
                    self.scene.remove(chunk.mesh);
                }

                if ( asyncBuild != undefined ) {
                    asyncBuild(chunk.list, chunk.blocks, chunk.position, chunk.cubeSize, function (verts, norms, colors) {
                        chunk.build(verts, norms, colors);
                        self.scene.add(chunk.mesh);
                    });
                }
                else {
                    chunk.build();
                    self.scene.add(chunk.mesh);
                }
            }
        }

        if ( options['ssao'] ) {
            self.scene.overrideMaterial = self.depthMaterial;
            self.renderer.render( self.scene, self.camera, self.depthTarget );
            self.scene.overrideMaterial = null;

            self.composer.render();
        }
        else {
            self.renderer.render(self.scene, self.camera);
        }

        requestAnimationFrame( self.render );
    }

    this.initScene(cubeSize * 10, cubeSize);
    this.player = new Player(this.camera, this.scene, this.collider, this._add);

    window.addEventListener( 'resize', function () {
        self.camera.aspect = window.innerWidth / window.innerHeight;
        self.camera.updateProjectionMatrix();

        self.renderer.setSize( window.innerWidth, window.innerHeight );

    }, false );

    this.render();
}
