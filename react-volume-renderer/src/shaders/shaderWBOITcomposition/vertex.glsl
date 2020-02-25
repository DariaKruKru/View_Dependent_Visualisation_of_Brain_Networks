// Set the precision for data types used in this shader
precision highp float;
precision highp int;

//attribute vec3 position; // THREE.js default
//attribute vec3 normal; // THREE.js default
//attribute vec2 uv; // THREE.js default
//attribute vec2 uv2; // THREE.js default

// Default THREE.js uniforms available to vertex shader
//uniform mat4 modelMatrix;
//uniform mat4 modelViewMatrix;
//uniform mat4 projectionMatrix;
//uniform mat4 viewMatrix;
//uniform mat3 normalMatrix;

varying vec2 vVec2TextureCoord;

void main(void) {
  vVec2TextureCoord = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
