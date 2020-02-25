//@xxixxmport ../includes/weightWBOIT;
/** Cosgrove and Stoops */

// Set the precision for data types used in this shader
precision highp float;
precision highp int;

//uniform sampler2D tDiffuse;
uniform sampler2D texSilhouette;
//uniform sampler2D texTransparency;
uniform sampler2D texOpaque;
uniform sampler2D texContour;
uniform sampler2D texGlow;


varying vec2 vVec2TextureCoord;

void main(void) {
	//vec4 t = texture2D( texTransparency, vVec2TextureCoord );
	vec4 s = texture2D( texSilhouette, vVec2TextureCoord );
	vec4 op = texture2D( texOpaque, vVec2TextureCoord );
	vec4 c = texture2D( texContour, vVec2TextureCoord );
	vec4 g = texture2D( texGlow, vVec2TextureCoord );

	vec4 o = vec4(1.0, 1.0, 1.0, 1.0); // white background
	o = s;
	if (op.r > 0.0  || op.g > 0.0 || op.b > 0.0){ // something opaque
		o = o * (1.0-o.r) + op * (o.r);
	}
	/* if (t.r > 0.0 || t.g > 0.0 || t.b > 0.0){ // something transparent
		o = o * (t.a) + t * (1.0-t.a);
	} */
	if (c.r > 0.0 || c.g > 0.0 || c.b > 0.0) { // there is a coloured contour
		o = c;
	}
	o = o + g;
	gl_FragColor = o;
}
