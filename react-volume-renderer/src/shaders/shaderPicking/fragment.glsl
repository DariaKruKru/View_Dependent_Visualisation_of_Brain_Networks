// Set the precision for data types used in this shader
precision highp float;
precision highp int;

uniform vec3 uVec3MeshID;


void main(void) {
	//vec4 u = unpackUnorm4x8(uiMeshID)
	gl_FragColor = vec4(uVec3MeshID.x, uVec3MeshID.y, uVec3MeshID.z, 0.0);
	//gl_FragColor = vec4(uiMeshID);
}
