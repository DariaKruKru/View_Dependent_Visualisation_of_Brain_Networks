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

import vertexShaderSource from './shaderSmartComposition/vertex.glsl';
import fragmentShaderSource from './shaderSmartComposition/fragment.glsl';

export const shaderSmartComposition = {

	uniforms: {
		//tDiffuse: { type: "t", value: 0 }, // default
		texSilhouette: { type: 't', value: null }, // silhouette texture
		texOpaque: { type: 't', value: null }, // default opaque texture
		texTransparency: { type: 't', value: null }, // transparency texture
		texGlow: { type: 't', value: null }, // glow texture
		texContour: { type: 't', value: null }, // coloured contours texture
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

};
