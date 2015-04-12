// Sort of stolen from Stack Overflow. W/e
// Does morton (z-order) encoding on 3D coordinates.
function morton(x, y, z) {
    // Kept this in one function to eliminate the time between multiple function calls
    // Which is kind of ironic considering this is in a function.

    x = (x | (x << 16)) & 0x030000FF;
    x = (x | (x <<  8)) & 0x0300F00F;
    x = (x | (x <<  4)) & 0x030C30C3;
    x = (x | (x <<  2)) & 0x09249249;

    y = (y | (y << 16)) & 0x030000FF;
    y = (y | (y <<  8)) & 0x0300F00F;
    y = (y | (y <<  4)) & 0x030C30C3;
    y = (y | (y <<  2)) & 0x09249249;

    z = (z | (z << 16)) & 0x030000FF;
    z = (z | (z <<  8)) & 0x0300F00F;
    z = (z | (z <<  4)) & 0x030C30C3;
    z = (z | (z <<  2)) & 0x09249249;

    return x | (y << 1) | (z << 2);
}

// Return the vertices to be popped onto a VBO for rendering.
function Cube(position, size, up, down, left, right, front, back) {
    size = size / 2;

    var vertices = [];
    var normals = [];

    if ( up ) {
        vertices.push(
            [-size + position[0],  size + position[1], size + position[2]],
            [-size + position[0], -size + position[1], size + position[2]],
            [ size + position[0], -size + position[1], size + position[2]]
        );

        vertices.push(
            [ size + position[0],  size + position[1], size + position[2]],
            [-size + position[0],  size + position[1], size + position[2]],
            [ size + position[0], -size + position[1], size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, 1, 0]);
    }

    if ( down ) {
        vertices.push(
            [-size + position[0], -size + position[1], -size + position[2]],
            [-size + position[0],  size + position[1], -size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]]
        );

        vertices.push(
            [ size + position[0], -size + position[1], -size + position[2]],
            [-size + position[0],  size + position[1], -size + position[2]],
            [ size + position[0],  size + position[1], -size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, -1, 0]);
    }

    if ( left ) {
        vertices.push(
            [-size + position[0], -size + position[1],  size + position[2]],
            [-size + position[0], -size + position[1], -size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]]
        );

        vertices.push(
            [-size + position[0], -size + position[1],  size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]],
            [ size + position[0], -size + position[1],  size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([1, 0, 0]);
    }

    if ( right ) {
        vertices.push(
            [-size + position[0], size + position[1], -size + position[2]],
            [-size + position[0], size + position[1], size + position[2]],
            [ size + position[0], size + position[1], -size + position[2]]
        );
        vertices.push(
            [ size + position[0], size + position[1], -size + position[2]],
            [-size + position[0], size + position[1], size + position[2]],
            [ size + position[0], size + position[1], size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([-1, 0, 0]);
    }

    if ( back ) {
        vertices.push(
            [ size + position[0], -size + position[1],  size + position[2]],
            [ size + position[0],  size + position[1], -size + position[2]],
            [ size + position[0],  size + position[1],  size + position[2]]
        );

        vertices.push(
            [ size + position[0], -size + position[1],  size + position[2]],
            [ size + position[0], -size + position[1], -size + position[2]],
            [ size + position[0],  size + position[1], -size + position[2]]
        );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, 0, -1]);
    }

    if ( front ) {
        vertices.push(
                [-size + position[0], -size + position[1], -size + position[2]],
                [-size + position[0], -size + position[1],  size + position[2]],
                [-size + position[0],  size + position[1], -size + position[2]]
            );

        vertices.push(
                [-size + position[0], -size + position[1],  size + position[2]],
                [-size + position[0],  size + position[1],  size + position[2]],
                [-size + position[0],  size + position[1], -size + position[2]]
            );

        for ( var i = 0; i < 6; i++ )
            normals.push([0, 0, 1]);
    }

    return [vertices, normals];
}

// Chunk
// Parameters:
// position - position of chunk within map
// size     - size of chunk. should be static for all chunks.

function Chunk(position, size, cubeSize) {
    this.cubeSize = cubeSize;
    this.position = [position[0] * size[0], position[1] * size[1], position[2] * size[2]]; 
    this.blocks = {};                           // Morton encoded position -> color
    this.list = [];                             // List of non morton encoded positions.
    this.mesh;                                  // Cached mesh
    this.geometry = new THREE.BufferGeometry(); // VBO
    this.needsBuild = true;                     // Should this be rebuilt?
    this.size = size;

    // Add a block to the chunk. Position is relative to the chunk.
    this.add = function (x, y, z, color) {
        if ( x < 0 || y < 0 || z < 0 || x > this.size[0] || y > this.size[1] || z > this.size[2]) {
            throw "Out of range error!";
        }

        this.blocks[ morton(x, y, z) ] = [color[0] / 255, color[1] / 255, color[2] / 255];
        this.list.push([x, y, z]);
        this.needsBuild = true;
    };

    // Build a mesh from the buffer.
    this.build = function () {
        if ( !this.needsBuild)
            return;

        // Each cube should have 6 sides
        // each side should have 2 triangles
        // each triangle should have 3 points
        // each point consists of 3 numbers
        // :^)

        var _verts  = new Float32Array( this.list.length * 6 * 2 * 3 * 3 ); // Create size for biggest scenerio.
        var _colors = new Float32Array( this.list.length * 6 * 2 * 3 * 3 );
        var _norms  = new Float32Array( this.list.length * 6 * 2 * 3 * 3 );

        var vertexCounter = 0;

        for ( var i = 0; i < this.list.length; i++ ) {
            var x = this.list[i][0];
            var y = this.list[i][1];
            var z = this.list[i][2];

            var color = this.blocks[ morton(x, y, z) ];

            // console.log(color);

            // front = right
            // back  = left
            // up    = front
            // down  = back
            // left  = up
            // right = down

            var front  = (this.blocks[morton(x - 1, y    , z    )]) == undefined;
            var back   = (this.blocks[morton(x + 1, y    , z    )]) == undefined;
            var up     = (this.blocks[morton(x    , y    , z + 1)]) == undefined;
            var down   = (this.blocks[morton(x    , y    , z - 1)]) == undefined;
            var left   = (this.blocks[morton(x    , y - 1, z    )]) == undefined;
            var right  = (this.blocks[morton(x    , y + 1, z    )]) == undefined;

            var verts_norms = Cube([x * this.cubeSize, y * this.cubeSize, z * this.cubeSize], this.cubeSize, up, down, left, right, front, back);

            var verts = verts_norms[0];
            var norms = verts_norms[1];

            for ( var j = 0; j < verts.length; j++) {
                _verts[vertexCounter    ] = verts[j][0];
                _verts[vertexCounter + 1] = verts[j][1];
                _verts[vertexCounter + 2] = verts[j][2];

                _norms[vertexCounter    ] = norms[j][0];
                _norms[vertexCounter + 1] = norms[j][1];
                _norms[vertexCounter + 2] = norms[j][2];

                _colors[vertexCounter    ] = color[0];
                _colors[vertexCounter + 1] = color[1];
                _colors[vertexCounter + 2] = color[2];

                vertexCounter += 3;
            }

            this.geometry.addAttribute( 'position', new THREE.BufferAttribute( _verts,  3) );
            this.geometry.addAttribute( 'color',    new THREE.BufferAttribute( _colors, 3) );
            this.geometry.addAttribute( 'normal',   new THREE.BufferAttribute( _norms,  3) );

            // this.geometry.computeFaceNormals();
            // this.geometry.computeVertexNormals();

            var material = new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors, wireframe: false });

            this.mesh = new THREE.Mesh( this.geometry, material);

            this.mesh.position.set(this.position[0], this.position[1], this.position[2]);

            this.mesh.receiveShadow = true;
            this.mesh.castShadow = true;

            this.needsBuild = false;
        }
    };
}
