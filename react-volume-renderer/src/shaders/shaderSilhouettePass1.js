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
import vertexShaderSource from './shaderSilhouettePass1/vertex.glsl';
import fragmentShaderSource from './shaderSilhouettePass1/fragment.glsl';

/** shaderSilhouettePass1
 * This shader computes a simple 3x3 gaussian blur
 */
export const shaderBlur = {

	extensions: {
		derivatives: false,
		drawBuffers: false,
		fragDepth: false,
		shaderTextureLOD: false,
	},

	//flatShading: false,

	uniforms: {
		tex: { type: 't', value: null },
		resolution: { type: 'v2', value: new THREE.Vector2( 1 / 1024, 1 / 512 ) },
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};
