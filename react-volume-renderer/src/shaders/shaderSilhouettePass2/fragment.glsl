// Set the precision for data types used in this shader
precision highp float;
precision highp int;

uniform sampler2D texDepthBuffer;
uniform sampler2D texCustomDepthBuffer;
//uniform sampler2D texSilhouetteAccumulatedBuffer;

varying vec2 vVec2TextureCoord;

uniform vec2 resolution;
//const float ts = 0.092929; +0.9
//const float tc = 0.097544; +0.9
uniform float scaleDepthValues;
uniform float ts;
uniform float tc;
// |A|B|C|
// |D|X|E|
// |F|G|H|
float X,A,B,C,D,E,F,G,H; // depths
float Asw,Bsw,Csw,Dsw,Esw,Fsw,Gsw,Hsw;// silhouette weights
float Acw,Bcw,Ccw,Dcw,Ecw,Fcw,Gcw,Hcw;// crease weigths
void loadValues() {
	vec2 tCoord = vVec2TextureCoord;
	float xc = tCoord.x;
	float xm = tCoord.x-resolution.x;
	float xp = tCoord.x+resolution.x;
	float yc = tCoord.y;
	float ym = tCoord.y-resolution.y;
	float yp = tCoord.y+resolution.y;
	X = texture2D(texCustomDepthBuffer,vec2(xc,yc)).r;
	A = texture2D(texCustomDepthBuffer,vec2(xm,yp)).r;
	B = texture2D(texCustomDepthBuffer,vec2(xc,yp)).r;
	C = texture2D(texCustomDepthBuffer,vec2(xp,yp)).r;
	D = texture2D(texCustomDepthBuffer,vec2(xm,yc)).r;
	E = texture2D(texCustomDepthBuffer,vec2(xp,yc)).r;
	F = texture2D(texCustomDepthBuffer,vec2(xm,ym)).r;
	G = texture2D(texCustomDepthBuffer,vec2(xc,ym)).r;
	H = texture2D(texCustomDepthBuffer,vec2(xp,ym)).r;
}
float silhouetteWeight(in float s) {
	float t2 = 0.9+ts;
	float t1 = t2-0.01;
	return smoothstep(t1,t2,max(1.0-abs(s * scaleDepthValues),0.9));
}
float shadowWeight(in float s) {
	float t2 = 0.9+tc;
	float t1 = t2-0.01;
	return smoothstep(t1,t2,max(1.0-abs(s * scaleDepthValues),0.9));
}
void computeSilhouetteWeights() {
	Asw = silhouetteWeight(A-X);
	Bsw = silhouetteWeight(B-X);
	Csw = silhouetteWeight(C-X);
	Dsw = silhouetteWeight(D-X);
	Esw = silhouetteWeight(E-X);
	Fsw = silhouetteWeight(F-X);
	Gsw = silhouetteWeight(G-X);
	Hsw = silhouetteWeight(H-X);
}
void computeShadowWeights() {
	Acw = shadowWeight(A-X);
	Bcw = shadowWeight(B-X);
	Ccw = shadowWeight(C-X);
	Dcw = shadowWeight(D-X);
	Ecw = shadowWeight(E-X);
	Fcw = shadowWeight(F-X);
	Gcw = shadowWeight(G-X);
	Hcw = shadowWeight(H-X);
}
void main(void) {
	loadValues();
	computeSilhouetteWeights();
	float meansw = (Asw+Bsw+Csw+Dsw+Esw+Fsw+Gsw+Hsw)/8.0; // silhoutte
	computeShadowWeights();
	float meanShadoww = (Acw+Bcw+Ccw+Dcw+Ecw+Fcw+Gcw+Hcw)/8.0; // shadow

	if (meanShadoww < 0.4) {// dark shadow
		meansw = min(meansw,0.4);
	} else if (meanShadoww < 0.8) { // light shadow
		meansw = min(meansw,0.8);
	}

	float shadowDark = smoothstep(.38, .5, meanShadoww)+.4;
	float shadowLight = smoothstep(.78, .99, meanShadoww)+.8;

	if (meanShadoww < 0.7) {// dark shadow
		meansw = min(meansw, shadowDark);
	}
	if (meanShadoww < 0.9) { // light shadow
		meansw = min(meansw, shadowLight);
	}

	/* float depth = texture2D(texCustomDepthBuffer, vVec2TextureCoord).r; // keep depth from MeshDepthMaterial for mixing multiple silhouettes (and mixing in volume renderer)
	float depthPreviousSilhouette = texture2D(texSilhouetteAccumulatedBuffer, vVec2TextureCoord).g; // depth of the accumulated silhouette texture

	if (depthPreviousSilhouette > depth) {
		//discard;
		return;
	} */
	float depth = texture2D(texDepthBuffer, vVec2TextureCoord).r; // depth from an actual depth buffer attachment

	if (meansw == 1.0) {
		gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
	} else {
		//meansw = 1.0 - meansw; // now above 0.0
		gl_FragColor = vec4(meansw, 1.0, 0.0, 0.0);
	}
	
	//vec2 tCoord = vVec2TextureCoord;
	//gl_FragColor = vec4(texture2D(texCustomDepthBuffer, vVec2TextureCoord) * 700.0);
}
