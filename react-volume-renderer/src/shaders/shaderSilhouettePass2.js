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
import vertexShaderSource from './shaderSilhouettePass2/vertex.glsl';
import fragmentShaderSource from './shaderSilhouettePass2/fragment.glsl';

/** shaderSilhouettePass2
 * This shader computes depth differences.
 */

// I intentionally export a function. 'new THREE.ShaderMaterial(x)' does not create a copy of this object. This way, multiple renderers would SHARE this object, which led to BRAINSTAR-882
const shaderSilhouettePass2 = () => { return {

	uniforms: {
		texDepthBuffer: { type: 't', value: null },
		texCustomDepthBuffer: { type: 't', value: null },
		//texSilhouetteAccumulatedBuffer: { type: 't', value: null },
		resolution: { type: 'v2', value: new THREE.Vector2( 1 / 1024, 1 / 512 ) },
		scaleDepthValues: { type: 'f', value: 700.0 }, // DEBUG I believe I need this upscaling of the depth buffer b/c the near plane is so very near... TODO: depend on mFar-mNear
		
		/* debug1: { type: 'f', value: 70.0 }, // DEBUG
		ts: { type: 'f', value: 0.092929 }, // DEBUG
		tc: { type: 'f', value: 0.097544 }, // DEBUG */

		ts: { type: 'f', value: 0.045 }, // 2018-10-16
		tc: { type: 'f', value: 0.05 }, // 2018-10-16
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

}};
export { shaderSilhouettePass2 };
