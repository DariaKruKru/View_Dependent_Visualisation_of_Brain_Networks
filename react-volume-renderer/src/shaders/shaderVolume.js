'use strict';
// @flow

import * as THREE from 'three';
/*
The MIT License (MIT) Copyright (c) 2015 Leandro Roberto Barbagallo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// substanial parts of the volume renderer copied from https://github.com/lebarba/WebGLVolumeRendering (see licence above)
// author: Florian Schulze <fschulze@vrvis.at>
// author: Nicolas Swoboda <swoboda@vrvis.at>

const vertexShaderSource = `
varying vec2 vVec2TextureCoord;

void main()
{
	vVec2TextureCoord = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); // render full screen quad only for this shader
}`;

import fragmentShaderSource from './shaderVolume/fragment.glsl';

// I intentionally export a function. 'new THREE.ShaderMaterial(x)' does not create a copy of this object. This way, multiple renderers would SHARE this object, which led to BRAINSTAR-882
const shaderVolume = () => { return {
	transparent: false,
	side: THREE.FrontSide,
	depthWrite: false,
	depthTest: false,
	uniforms: {
		meshRendererTex: { type: 't', value: null },
		meshRendererDepthTex: { type: 't', value: null },
		backgroundTex:  { type: 't', value: null },
		foregroundTex:  { type: 't', value: null },
		atlasTex:  { type: 't', value: null },
		tfTex:  { type: 't', value: null },
		silhouetteTex:  { type: 't', value: null },
		silhouetteDepthTex:  { type: 't', value: null },
		hologramTex: { type: 't', value: null },

		stepLength : { type: '1f', value: null },
		//alphaCorrection: { value: this.alphaCorrection },
		atlasColumns: { type: '1i', value: null },
		atlasRows: { type: '1i', value: null },
		atlasSliceNum: { type: '1i', value: null },
		volumeSize: { type: '3f', value: null }, // TODO: replace this with matVolume (scaling+transformation)
		backgroundColour: { type: '3f', value: [0.0, 0.0, 0.0] }, // optionally set a background colour
		viewProjectionInverse: { type: 'm4', value: null },
		channel0visible: { type: '1i', value: null },
		channel1visible: { type: '1i', value: null },
		channel2visible: { type: '1i', value: null },
		channel3visible: { type: '1i', value: null },
	},

	vertexShader: vertexShaderSource,

	fragmentShader: fragmentShaderSource,

}};
export { shaderVolume };
