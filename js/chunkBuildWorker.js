importScripts('chunkBuild.js');

onmessage = function (event) {
    var out = buildChunk(event.data.list, event.data.blocks, event.data.position, event.data.cubeSize);

    postMessage({
        "id": event.data.id,
        "verts":  out[0],
        "norms":  out[1],
        "colors": out[2]
    });
};
