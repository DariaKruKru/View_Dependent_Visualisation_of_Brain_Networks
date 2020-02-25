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
//import { shaderOpaque } from 'imports-loader?THREE=three!shaders/shaderOpaque';
import { shaderOpaque } from './shaders/shaderOpaque';

export default class RenderPassOpaqueMesh {
	sm_opaque: ?THREE.ShaderMaterial;
	rt_opaque: ?THREE.WebGLRenderTarget;

	constructor() {}

	_getShaderMaterial(): THREE.ShaderMaterial {
		if (this.sm_opaque == null) {
			this.sm_opaque = new THREE.ShaderMaterial(shaderOpaque()); // new THREE.MeshLambertMaterial({side: THREE.DoubleSide })
		}
		return this.sm_opaque;
	}
	getRenderTarget(width: number, height: number): THREE.WebGLRenderTarget {
		if (this.rt_opaque == null) {
			this.rt_opaque = new THREE.WebGLRenderTarget(width, height, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBAFormat,
				stencilBuffer: false,
			});
		}
		if (this.rt_opaque.width !== width || this.rt_opaque.height !== height) {
			this.rt_opaque.setSize(width, height);
		}
		return this.rt_opaque;
	}

	render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderTarget: THREE.WebGLRenderTarget) {
		const sm_opaque = this._getShaderMaterial();

		sm_opaque.setProgramNotYetCalled = true; // the first object's onBeforeRender does not have access to uniform locations because useProgram will not have been called at that time
		scene.overrideMaterial = sm_opaque; // opaque shader with optional desaturation
		renderer.setRenderTarget(renderTarget);
		renderer.render(scene, camera);
		scene.overrideMaterial = null;
	}

	destroy() {
		if (this.sm_opaque != null) {
			this.sm_opaque.dispose();
			this.sm_opaque = undefined;
		}
		if (this.rt_opaque != null) {
			this.rt_opaque.dispose();
			this.rt_opaque = undefined;
		}
	}
}
