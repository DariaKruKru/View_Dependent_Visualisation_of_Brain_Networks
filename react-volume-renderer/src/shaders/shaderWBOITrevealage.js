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
import vertexShaderSource from './shaderWBOITrevealage/vertex.glsl';
import fragmentShaderSource from './shaderWBOITrevealage/fragment.glsl';

export const shaderWBOITrevealage = {
	side: THREE.DoubleSide, // material side property to turn off backface culling
	//depthFunc: THREE.OneMinusSr
	blending: THREE.CustomBlending, //THREE["CustomBlending"],
	blendSrc: THREE.ZeroFactor, //THREE["ZeroFactor"],
	blendDst: THREE.OneMinusSrcColorFactor, //THREE["OneMinusSrcColorFactor"],
	blendEquation: THREE.AddEquation,
	transparent: true,
	depthTest: true,
	depthWrite: false,
	depthFunc: THREE.LessEqualDepth,
	//opacity: 0.5,
	
	/*var blendings = [ "NoBlending", "NormalBlending", "AdditiveBlending", "SubtractiveBlending", "MultiplyBlending", "AdditiveAlphaBlending" ];
var src = [ "ZeroFactor", "OneFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor", "DstColorFactor", "OneMinusDstColorFactor", "SrcAlphaSaturateFactor" ];
var dst = [ "ZeroFactor", "OneFactor", "SrcColorFactor", "OneMinusSrcColorFactor", "SrcAlphaFactor", "OneMinusSrcAlphaFactor", "DstAlphaFactor", "OneMinusDstAlphaFactor" ];
	*/

	uniforms: {
		tDiffuse: { type: 't', value: null }, // not used
		ufAlpha: { type: 'f', value: 0.9},
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};
