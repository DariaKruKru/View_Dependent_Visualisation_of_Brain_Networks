/** Cosgrove and Stoops */

// Set the precision for data types used in this shader
precision highp float;
precision highp int;

uniform sampler2D texAccum;
uniform sampler2D texReveal;

varying vec2 vVec2TextureCoord;

void main(void) {
  // colour from accumulation texture
  vec4 accum = texture2D( texAccum, vVec2TextureCoord );
  // alpha from reavealage texture
  float reveal = texture2D( texReveal, vVec2TextureCoord ).r;
  // composition
  //gl_FragColor = accum;
  //gl_FragColor = vec4(0.0, reveal, 0.0, 1.0);
  gl_FragColor = vec4( accum.rgb / clamp(accum.a, 1e-9, 5e9), reveal);
}
