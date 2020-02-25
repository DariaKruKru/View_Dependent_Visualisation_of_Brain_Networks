// Set the precision for data types used in this shader
precision highp float;
precision highp int;

varying vec2 vVec2TextureCoord;
varying vec3 vVec3LightWeighting;

uniform float ufAlpha;

//uniform sampler2D uSampler;

void main(void) {
    //vec4 textureColor = texture2D(uSampler, vec2(vVec2TextureCoord.s, vVec2TextureCoord.t));
    vec4 textureColor = vec4(.3,.3,.5,.2);
    gl_FragColor = vec4(textureColor.rgb * vVec3LightWeighting, textureColor.a * ufAlpha);
		//gl_FragColor = vec4(1.0,1.0,0.0,1.0);
}
