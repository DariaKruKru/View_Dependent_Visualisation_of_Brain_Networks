@import ../includes/colourSpaceHelpers;

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

uniform vec3 uVec3AmbientColor;

uniform vec3 uVec3LightingDirection;
uniform vec3 uVec3DirectionalColor;

uniform bool ubUseLighting;

uniform vec3 uVec3Color;
uniform float ufSaturation;

varying vec2 vVec2TextureCoord;
varying vec3 vVec3LightWeighting;

varying vec3 vVec3Color;



void main(void) {
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		vVec2TextureCoord = uv;

		//vVec3Color = uVec3Color;
		vVec3Color = rgb2hsv(uVec3Color);
		vVec3Color.g = vVec3Color.g * ufSaturation;
		vVec3Color = hsv2rgb(vVec3Color);

		if (!ubUseLighting) {
				vVec3LightWeighting = vec3(1.0, 1.0, 1.0);
		} else {
				vec3 transformedNormal = normalMatrix * normal;
				float directionalLightWeighting = abs(dot(transformedNormal, uVec3LightingDirection));// max(dot(transformedNormal, uVec3LightingDirection), 0.0); // (this would work for well-formed meshes)
				vVec3LightWeighting = uVec3AmbientColor + uVec3DirectionalColor * directionalLightWeighting;
		}
}
