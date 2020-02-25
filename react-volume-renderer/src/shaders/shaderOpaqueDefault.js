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
import vertexShaderSource from './shaderOpaqueDefault/vertex.glsl';
import fragmentShaderSource from './shaderOpaqueDefault/fragment.glsl';

export const shaderOpaqueDefault = {
	side: THREE.DoubleSide, // material side property to turn off backface culling
	//depthFunc: THREE.OneMinusSr

	transparent: false,
	//opacity: 0.5,

	uniforms: {
		uVec3AmbientColor: { type: 'v3', value: new THREE.Vector3( 0.2, 0.2, 0.2 ) }, // type: "3fv",
		uVec3LightingDirection: { type: 'v3', value: new THREE.Vector3( -0.25, -0.25, -1.0 ) },
		uVec3DirectionalColor: { type: 'v3', value: new THREE.Vector3( 0.8, 0.8, 0.8 ) },
		ubUseLighting: { type: '1i', value: 1 },
		ufAlpha: { type: '1f', value: 0.5 },
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};
