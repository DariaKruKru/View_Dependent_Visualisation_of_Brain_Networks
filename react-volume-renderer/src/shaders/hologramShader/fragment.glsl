uniform vec3 glowColor;
varying float intensity;

void main() 
{
	vec3 glow = glowColor * intensity;
	float a = 1.0 * intensity;
    gl_FragColor = vec4( glow, a );
}