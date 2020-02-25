'use strict';

import * as THREE from 'three';
import vertexShaderSource from './hologramShader/vertex.glsl';
import fragmentShaderSource from './hologramShader/fragment.glsl';
import { Vector3 } from 'three';

const hologramShader = () => { return {
	
	uniforms: 
	{ 
		"c":   { type: "f", value: 1.15 },
		"p":   { type: "f", value: 1.9 },
		glowColor: { type: "c", value: new THREE.Color(0xcfdfff) }
		
	},

	vertexShader: vertexShaderSource,
	fragmentShader: fragmentShaderSource,

	side: THREE.FrontSide,
	blending: THREE.AdditiveBlending,
	transparent: true, 
	depthTest: true,
	depthMode: THREE.GreaterDepth,
	depthWrite: true,
	opacity: 0.8

}};

export { hologramShader };
