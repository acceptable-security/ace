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

function buildChunk(list, blocks, position, cubeSize) {
    // Each cube should have 6 sides
    // each side should have 2 triangles
    // each triangle should have 3 points
    // each point consists of 3 numbers
    // :^)

    var size = list.length * 6 * 2 * 3 * 3;
    var _verts  = new Float32Array( size ); // Create size for biggest scenerio.
    var _colors = new Float32Array( size );
    var _norms  = new Float32Array( size );

    var vertexCounter = 0;

    for ( var i = 0; i < list.length; i++ ) {
        var x = list[i][0];
        var y = list[i][1];
        var z = list[i][2];

        if ( x < 0 || y < 0 || z < 0 ) continue;

        var color = blocks[ [x, y, z] ];

        var front  = (blocks[[x - 1, y    , z    ]]) == undefined;
        var back   = (blocks[[x + 1, y    , z    ]]) == undefined;
        var up     = (blocks[[x    , y    , z + 1]]) == undefined;
        var down   = (blocks[[x    , y    , z - 1]]) == undefined;
        var left   = (blocks[[x    , y - 1, z    ]]) == undefined;
        var right  = (blocks[[x    , y + 1, z    ]]) == undefined;

        var verts_norms = Cube([x * cubeSize, y * cubeSize, z * cubeSize], cubeSize, up, down, left, right, front, back);

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
    }



    return [_verts, _norms, _colors];
}
