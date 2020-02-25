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

export default class RenderPassDepthBuffer {
	sm_depthBuffer: ?THREE.MeshDepthMaterial;
	rt_depthBuffer: ?THREE.WebGLRenderTarget;

	constructor() {}

	_getShaderMaterial(): THREE.MeshDepthMaterial {
		if (this.sm_depthBuffer == null) {
			// TODO: do not use THREE.DoubleSide
			this.sm_depthBuffer = new THREE.MeshDepthMaterial({
				depthTest: true,
				depthFunc: THREE.LessEqualDepth,
				side: THREE.DoubleSide,
			}); // automatically uses camera mNear and mFar
		}
		return this.sm_depthBuffer;
	}
	getRenderTarget(width: number, height: number): THREE.WebGLRenderTarget {
		if (!this.rt_depthBuffer) {
			// this is old:
			//this.rt_depthBuffer = new THREE.WebGLRenderTarget( width, height, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: false });

			// this is new:
			this.rt_depthBuffer = new THREE.WebGLRenderTarget(width, height, {
				minFilter: THREE.NearestFilter,
				magFilter: THREE.NearestFilter,
				generateMipmaps: false,
				stencilBuffer: false,
				depthBuffer: true,
				depthTexture: new THREE.DepthTexture(),
				type: THREE.HalfFloatType, // not all browsers support FloatType? (default is UnsignedByteType)
			});
			//this.rt_depthBuffer.depthBuffer = true;
			//this.rt_depthBuffer.depthTexture = new THREE.DepthTexture();
			this.rt_depthBuffer.depthTexture.type = THREE.UnsignedShortType;
		}
		if (
			this.rt_depthBuffer.width !== width ||
			this.rt_depthBuffer.height !== height
		) {
			this.rt_depthBuffer.setSize(width, height);
		}
		return this.rt_depthBuffer;
	}

	render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderTarget: THREE.WebGLRenderTarget) {
		const sm_depthBuffer = this._getShaderMaterial();

		scene.overrideMaterial = sm_depthBuffer; // opaque shader with optional desaturation
		renderer.setRenderTarget(renderTarget);
		renderer.render(scene, camera);
		scene.overrideMaterial = null;
	}

	destroy() {
		if (this.sm_depthBuffer != null) {
			this.sm_depthBuffer.dispose();
			this.sm_depthBuffer = undefined;
		}
		if (this.rt_depthBuffer != null) {
			this.rt_depthBuffer.dispose();
			this.rt_depthBuffer = undefined;
		}
	}
}
