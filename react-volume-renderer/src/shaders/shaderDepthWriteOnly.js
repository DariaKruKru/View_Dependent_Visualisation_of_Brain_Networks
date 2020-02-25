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
import vertexShaderSource from './shaderDepthWriteOnly/vertex.glsl';
import fragmentShaderSource from './shaderDepthWriteOnly/fragment.glsl';

export const shaderDepthWriteOnly = {
	side: THREE.DoubleSide,  //  DoubleSide
	depthWrite: true,
	depthTest: true,
	depthFunc: THREE.LessEqualDepth,
	colorWrite: false,
	//stencilTest: false,

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};
