// Set the precision for data types used in this shader
precision highp float;
precision highp int;

varying vec2 vVec2TextureCoord;
varying vec3 vVec3LightWeighting;

uniform vec3 uVec3Color;
uniform float ufSaturation;

varying vec3 vVec3Color;

//uniform sampler2D uSampler;

void main(void) {
    gl_FragColor = vec4(vVec3Color * vVec3LightWeighting, 1.0);
		//gl_FragColor = vec4(1.0,1.0,0.0,1.0);
}
