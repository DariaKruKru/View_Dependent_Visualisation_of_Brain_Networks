@import ../includes/weightWBOIT;
/** Cosgrove and Stoops */

// Set the precision for data types used in this shader
precision highp float;
precision highp int;

uniform float ufAlpha;

void main(void) {
  //float alpha = fragColor.a;
  float alpha = ufAlpha;
  //float alpha = 0.5;
  // calculate alpha based on the weighted alpha value of the coordinate
  gl_FragColor = vec4( vec3(w(alpha)), 1.0);
  //gl_FragColor = vec3(w(alpha));
}
