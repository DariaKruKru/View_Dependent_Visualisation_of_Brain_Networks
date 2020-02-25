//uniform vec3 viewVector;
uniform float c;
uniform float p;
varying float intensity;

void main() 
{
    vec3 vNormal = normalize( normalMatrix * normal );
	/* vec3 vNormel = normalize( modelViewMatrix * vec4(viewVector, 1.0) ).xyz; */
	vec3 vCamera = vec3(0.0,0.0,1.0);
	intensity = pow( c - dot(vNormal, vCamera), p );

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}