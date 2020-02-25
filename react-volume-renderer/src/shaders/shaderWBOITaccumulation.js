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
import vertexShaderSource from './shaderWBOITaccumulation/vertex.glsl';
import fragmentShaderSource from './shaderWBOITaccumulation/fragment.glsl';

export const shaderWBOITaccumulation = {
	side: THREE.DoubleSide, // material side property to turn off backface culling
	//depthFunc: THREE.OneMinusSr
	blending: THREE.CustomBlending, //THREE["CustomBlending"],
	blendSrc: THREE.OneFactor, //THREE["OneFactor"],
	blendDst: THREE.OneFactor, //THREE["OneFactor"],
	blendEquation: THREE.AddEquation,
	transparent: true,
	depthTest: true,
	depthWrite: false,
	depthFunc: THREE.LessEqualDepth, //THREE.OneMinusSr,
	//opacity: 0.5,

	uniforms: {
		uVec3Color: { type: 'v3', value: new THREE.Vector3(0.9,0.9,0.1) }, //new THREE.Uniform( 'v3', new THREE.Vector3(0.9,0.9,0.1) ).onUpdate( updateColor ),
		ufAlpha: { type: 'f', value: 0.9 },
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};
/*
function updateColor( meshObject, camera ) {
	this.value.set(meshObject.userData.color.r, meshObject.userData.color.g, meshObject.userData.color.b)
}
*/
