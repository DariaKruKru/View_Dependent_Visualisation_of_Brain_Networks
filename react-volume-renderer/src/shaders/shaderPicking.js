'use strict';
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

// author: Nicolas Swoboda <swoboda@vrvis.at>

import * as THREE from 'three';
import vertexShaderSource from './shaderPicking/vertex.glsl';
import fragmentShaderSource from './shaderPicking/fragment.glsl';

export const shaderPicking = {
	side: THREE.DoubleSide, // material side property to turn off backface culling

	uniforms: {
		uVec3MeshID: { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.5) }, //new THREE.Uniform('v3', new THREE.Vector3(0.0, 0.0, 0.5)).onUpdate( updateMeshID ),
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};/*
function ToUint32(x) {
	return x >>> 0;
}
function ToInt32(x) {
	return x >> 0;
}*/
/*
function updateMeshID( meshObject, camera ) {
	//console.log('### id = '+meshObject.id)
	let id = meshObject.userData.id

	var mask=parseInt("11111111",2); // 255
	let x = id & mask;
	let y = (id >> 8) & mask;
	let z = (id >> 16) & mask;

	this.value.setX  (x / 255.0) // 65280
	this.value.setY  (y / 255.0) // 65535
	this.value.setZ  (z / 255.0) // 65535

}*/
