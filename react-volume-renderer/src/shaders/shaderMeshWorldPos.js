// @flow
/******************************************************************************
******************************************************************************
**
** Copyright (c) 2011-2017 VRVis Zentrum für Virtual Reality und Visualisierung
** Forschungs-GmbH All rights reserved.
**
************************************************************
**
** THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE OF VRVis GmbH The copyright
** notice above does not evidence any actual or intended publication of such
** code.
**
******************************************************************************
******************************************************************************/

// author: Florian Schulze <fschulze@vrvis.at>
// author: Nicolas Swoboda <swoboda@vrvis.at>
import * as THREE from 'three';

let vertexShaderSource = `
varying vec3 worldSpaceCoords;

void main()
{
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	//worldSpaceCoords = position; // using worldSpaceCoords instead of volumeSpaceCoords works just fine!
	worldSpaceCoords = (modelMatrix * vec4( position, 1.0 )).xyz;
}`;

let fragmentShaderSource = `
varying vec3 worldSpaceCoords;

void main()
{
	//The fragment's world space coordinates as fragment output.
	gl_FragColor = vec4( worldSpaceCoords.x , worldSpaceCoords.y, worldSpaceCoords.z, 1.0 );
}`;

// I intentionally export a function. 'new THREE.ShaderMaterial(x)' does not create a copy of this object. This way, multiple renderers would SHARE this object, which led to BRAINSTAR-882
const shaderMeshWorldPos = () => { return {

	transparent: false,

	side: THREE.FrontSide, // set this to BackSide to get backPos

	depthTest: true,

	uniforms: {
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

}};

export { shaderMeshWorldPos };
