@import ../includes/weightWBOIT;
/** Cosgrove and Stoops */

// Set the precision for data types used in this shader
precision highp float;
precision highp int;

uniform float ufAlpha;
uniform vec3 uVec3Color;

varying vec2 vVec2TextureCoord;

void main(void) {
  //float alpha = fragColor.a;
  float alpha = ufAlpha;

  // TODO: sample color w/ uv coord from texture
  vec3 fragColor = uVec3Color;//vec3(0.9, 0.1, 0.1); //

  // scale color based on weighted alpha
  vec3 Ci = fragColor.rgb * alpha;
  // further scale color and alpha based on weighted alpha
  gl_FragColor = vec4(Ci, alpha) * w(alpha);

  //gl_FragColor = vec4(0.9, 0.1, 0.1, 1);
}
