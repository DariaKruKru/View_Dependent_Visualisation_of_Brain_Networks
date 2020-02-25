// neuronal atlas by nicolas swoboda
// silhouette calculation originally from the following source:
//# Initial software: Light Warping Version 1.0
//# Co-authors: Romain VERGNE, Romain PACANOWSKI, Pascal BARLA, Xavier GRANIER and Christophe SCHLICK.
//# Owners: INRIA, University of Bordeaux 1 and University of Bordeaux 2.
//# Copyright © 2008-2009, spread under the terms and conditions of the license CeCILL B Version 2.0.

#version 330

//<option name="mode" value="buffer">
//exports view and normal directions in camera coordinates, as well as a log-remapped depth, per vertex.
in vec3 vertexPosition;
in vec3 vertexNormal;	
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;
uniform float zmin;
uniform float zmax;
out vec3  normal;
out vec3  nv;
noperspective out float depth;
void main() {
	vec4 pos = modelViewMatrix * vec4(vertexPosition,1.0);
	normal = vertexNormal;
	//depth  = log(clamp(-(pos.z),zmin,zmax)/zmin)/log(zmax/zmin);
	depth = pos.z;
	//depth = clamp(-(pos.z),zmin,zmax);
	
	gl_Position = projectionMatrix * pos;
}
//</option>
//<option name="mode" value="weights">
//computes silhouettes and crease weights using simple differences between pixel neighbors
in vec4 vertexPosition;
out vec2 vTexCoord;
void main() {
	gl_Position = vertexPosition;
	vTexCoord = vec2(vertexPosition.xy) * .5 + .5;
}
//</option>


//////////////////////////////////////////////////////////////////////////
//</vertex>
//////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////
//<fragment>
//////////////////////////////////////////////////////////////////////////

//<option name="mode" value="buffer">
//converts normal data to gradient data (we use foreshortening=1), and pass on other variables
#extension GL_ARB_draw_buffers : enable

in vec3  normal;
//in vec3  view;
noperspective in float depth;
void main()
{
	gl_FragData[0] = vec4(normalize(normal),depth); // m_texColorTexture0
}
//</option>
//<option name="mode" value="weights">
//computes silhouettes and crease weights using simple differences between pixel neighbors
#extension GL_ARB_draw_buffers : enable
in vec2 vTexCoord;
uniform sampler2D MyBuffer; // m_texColorTexture0 (nx,ny,nz,depth)
uniform float     sw;
uniform float     sh;
uniform float     ts;
uniform float     tc;
// |A|B|C|
// |D|X|E|
// |F|G|H|
vec4 X,A,B,C,D,E,F,G,H;
float Asw,Bsw,Csw,Dsw,Esw,Fsw,Gsw,Hsw;// silhouette weights 
float Acw,Bcw,Ccw,Dcw,Ecw,Fcw,Gcw,Hcw;// crease weigths
float Aw,Bw,Cw,Dw,Ew,Fw,Gw,Hw;// combined weigths
void loadValues() {
  vec2 tCoord = vTexCoord;//vec2(vTexCoord.x*.5 + .5, vTexCoord.y*.5 + .5);
  float xc = tCoord.x;
  float xm = tCoord.x-sw;
  float xp = tCoord.x+sw;
  float yc = tCoord.y;
  float ym = tCoord.y-sh;
  float yp = tCoord.y+sh;
  X = texture2D(MyBuffer,vec2(xc,yc));
  A = texture2D(MyBuffer,vec2(xm,yp));
  B = texture2D(MyBuffer,vec2(xc,yp));
  C = texture2D(MyBuffer,vec2(xp,yp));
  D = texture2D(MyBuffer,vec2(xm,yc));
  E = texture2D(MyBuffer,vec2(xp,yc));
  F = texture2D(MyBuffer,vec2(xm,ym));
  G = texture2D(MyBuffer,vec2(xc,ym));
  H = texture2D(MyBuffer,vec2(xp,ym));
}
float silhouetteWeight(in float s) {
  float t2 = 0.9+ts;
  float t1 = t2-0.01;
  return smoothstep(t1,t2,max(1.0-abs(s),0.9));
}
//<option name="shadow" value="true">
float shadowWeight(in float s) {
  float t2 = 0.9+tc;
  float t1 = t2-0.01;
  return smoothstep(t1,t2,max(1.0-abs(s),0.9));
}
//</option>
void computeSilhouetteWeights() {
  Asw = silhouetteWeight(A.w-X.w);
  Bsw = silhouetteWeight(B.w-X.w);
  Csw = silhouetteWeight(C.w-X.w);
  Dsw = silhouetteWeight(D.w-X.w);
  Esw = silhouetteWeight(E.w-X.w);
  Fsw = silhouetteWeight(F.w-X.w);
  Gsw = silhouetteWeight(G.w-X.w);
  Hsw = silhouetteWeight(H.w-X.w);
}
//<option name="shadow" value="true">
void computeShadowWeights() {
  Acw = shadowWeight(A.w-X.w);
  Bcw = shadowWeight(B.w-X.w);
  Ccw = shadowWeight(C.w-X.w);
  Dcw = shadowWeight(D.w-X.w);
  Ecw = shadowWeight(E.w-X.w);
  Fcw = shadowWeight(F.w-X.w);
  Gcw = shadowWeight(G.w-X.w);
  Hcw = shadowWeight(H.w-X.w);
}
//</option>
void main(void) {
	loadValues();
	computeSilhouetteWeights();
	float meansw = (Asw+Bsw+Csw+Dsw+Esw+Fsw+Gsw+Hsw)/8.0; // silhoutte
	//<option name="shadow" value="true">
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

	//</option>
gl_FragData[0] = vec4(meansw,meansw,meansw,1.0);
}
//</option>


//////////////////////////////////////////////////////////////////////////
//</fragment>
//////////////////////////////////////////////////////////////////////////

