//#extension GL_OES_standard_derivatives : enable
// Taken from http://www.madebyevan.com/shaders/curvature/ which has been published under this license: CC0 (http://creativecommons.org/publicdomain/zero/1.0/)
// Set the precision for data types used in this shader
precision highp float;
precision highp int;

uniform sampler2D tex;
uniform vec2 resolution;

varying vec2 vVec2TextureCoord;

void main() {
	vec2 v2 = vVec2TextureCoord;
	float xc = v2.x;
	float xm = v2.x-resolution.x;
	float xp = v2.x+resolution.x;
	float yc = v2.y;
	float ym = v2.y-resolution.y;
	float yp = v2.y+resolution.y;
	// |A|B|C|
	// |D|X|E|
	// |F|G|H|
	vec4 sum = texture2D( tex, v2 ) * 0.25; // X
	
	sum += texture2D(tex,vec2(xm,yp)) * 0.0625; // A
	sum += texture2D(tex,vec2(xc,yp)) * 0.125; // B
	sum += texture2D(tex,vec2(xp,yp)) * 0.0625; // C
	sum += texture2D(tex,vec2(xm,yc)) * 0.125; // D
	sum += texture2D(tex,vec2(xp,yc)) * 0.125; // E
	sum += texture2D(tex,vec2(xm,ym)) * 0.0625; // F
	sum += texture2D(tex,vec2(xc,ym)) * 0.125; // G
	sum += texture2D(tex,vec2(xp,ym)) * 0.0625; // H

	gl_FragColor = sum;
	//gl_FragColor = texture2D( tex, v2 );
}