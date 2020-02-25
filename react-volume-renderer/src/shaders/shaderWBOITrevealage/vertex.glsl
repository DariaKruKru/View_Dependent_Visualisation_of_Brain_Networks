precision highp float;
precision highp int;

//attribute vec3 position; // THREE.js default
//attribute vec3 normal; // THREE.js default
//attribute vec2 uv; // THREE.js default
//attribute vec2 uv2; // THREE.js default

//uniform mat4 modelViewMatrix; // THREE.js default
//uniform mat4 projectionMatrix; // THREE.js default
//uniform mat3 normalMatrix; // THREE.js default
//uniform mat4 modelMatrix; // THREE.js default
//uniform mat4 viewMatrix; // THREE.js default

varying float vfDepth;

void main(void) {
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

		vec4 test = modelViewMatrix * vec4(position, 1.0);
		vfDepth = test.z;
}
