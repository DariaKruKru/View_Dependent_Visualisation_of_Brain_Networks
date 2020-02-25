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

import vertexShaderSource from './shaderWBOITcomposition/vertex.glsl';
import fragmentShaderSource from './shaderWBOITcomposition/fragment.glsl';

export const shaderWBOITcomposition = {
  
	uniforms: {
		texAccum: { type: 't', value: null }, // accumulation texture
		texReveal: { type: 't', value: null }, // revealage texture
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};
