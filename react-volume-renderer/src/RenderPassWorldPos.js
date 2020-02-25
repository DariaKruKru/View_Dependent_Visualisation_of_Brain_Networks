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
import { shaderMeshWorldPos } from './shaders/shaderMeshWorldPos';

export default class RenderPassWorldPos {
	sm_worldPos: ?THREE.ShaderMaterial;
	rt_worldPos: ?THREE.WebGLRenderTarget;

	constructor() {
	}

	_getShaderMaterial(): THREE.ShaderMaterial {
		if (this.sm_worldPos != null) {
			return this.sm_worldPos;
		}
		this.sm_worldPos = new THREE.ShaderMaterial(shaderMeshWorldPos());
		return this.sm_worldPos;
	}

	// get the target texture for the entry or exit pass
	// create a appropriate one on the first time
	// changes size if width or height have changed
	getRenderTarget(width: number, height: number, withStencilBuffer: boolean): THREE.WebGLRenderTarget {
		if (this.rt_worldPos == null) {
			this.rt_worldPos = new THREE.WebGLRenderTarget(width, height, {
				//minFilter: THREE.NearestFilter,
				//magFilter: THREE.NearestFilter,
				minFilter: THREE.LinearFilter, // default is LinearFilter
				magFilter: THREE.LinearFilter, // default is LinearFilter
				wrapS: THREE.ClampToEdgeWrapping, // default is ClampToEdgeWrapping.
				wrapT: THREE.ClampToEdgeWrapping, // default is ClampToEdgeWrapping.
				generateMipmaps: false, // TODO: not documented ... remove?
				stencilBuffer: withStencilBuffer, // default is true (only needed for ENTRY POINTS)
				type: THREE.HalfFloatType, // not all browsers support FloatType? (default is UnsignedByteType)
				depthBuffer: true, // default is true
			});
		}
		if (
			this.rt_worldPos.width !== width ||
			this.rt_worldPos.height !== height
		) {
			this.rt_worldPos.setSize(width, height);
		}
		return this.rt_worldPos;
	}

	/**
	 * renderEntryPoints renders the front faces of the volume box to the render target -- and if the near plane clips something away, renders entry points where the near plane is
	 * @param {*} renderer 
	 * @param {*} sceneBox 
	 * @param {*} sceneNearPlane 
	 * @param {*} camera 
	 * @param {*} renderTarget The render target for the entry points, best use this function: getRenderTarget(x,y,true)
	 */
	renderEntryPoints(renderer: THREE.WebGLRenderer, sceneBox: THREE.Scene, sceneNearPlane: THREE.Scene, camera: THREE.PerspectiveCamera, renderTarget: THREE.WebGLRenderTarget) {
		const sm = this._getShaderMaterial();

		renderer.autoClear = false;

		// first: render back faces of the volume box to set the stencil buffer
		sm.depthTest = false;
		
		//sm.depthFunc = THREE.AlwaysDepth;
		sm.side = THREE.BackSide;
		// only write to stencil buffer
		
		renderer.state.buffers.stencil.setTest( true );
		//renderer.state.buffers.stencil.setClear( 0 ); // 0 is default
		renderer.state.buffers.stencil.setFunc( renderer.context.ALWAYS, 1, 0xFF ); // draw 1 to the stencil where the volume cube is
		renderer.state.buffers.stencil.setOp( renderer.context.REPLACE, renderer.context.REPLACE, renderer.context.REPLACE );

		sm.depthWrite = false;
		sm.colorWrite = false;
		sm.stencil = true;
		
		sceneBox.overrideMaterial = sm;
		renderer.setRenderTarget(renderTarget);
		renderer.clear();
		renderer.render(sceneBox, camera);
		sceneBox.overrideMaterial = null;

		//sm.depthTest = true;
		sm.side = THREE.FrontSide; // cull face OFF would be fine too
		//sm.depthFunc = THREE.AlwaysDepth;
		renderer.state.buffers.stencil.setTest( true );
		renderer.state.buffers.stencil.setFunc( renderer.context.EQUAL, 1, 0xFF );
		renderer.state.buffers.stencil.setOp( renderer.context.KEEP, renderer.context.KEEP, renderer.context.KEEP );
		sm.depthWrite = true;
		sm.colorWrite = true;
		
		sceneNearPlane.overrideMaterial = sm;
		renderer.render(sceneNearPlane, camera);
		sceneNearPlane.overrideMaterial = null;

		sm.stencil = false; // no more stencil

		// third: draw entry points with front faces on top of everything
		renderer.state.buffers.stencil.setTest( false );
		//sm.depthTest = true;
		//sm.side = THREE.FrontSide;
		//sm.depthFunc = THREE.AlwaysDepth;
		
		sceneBox.overrideMaterial = sm;
		renderer.render(sceneBox, camera);
		sceneBox.overrideMaterial = null;

		renderer.autoClear = true;
	}

	/**
	 * renderExitPoints renders the back faces of the volume box to the render target
	 * @param {*} renderer 
	 * @param {*} sceneBox 
	 * @param {*} camera 
	 * @param {*} renderTarget The render target for the exit points, best use this function: getRenderTarget(x,y,false)
	 */
	renderExitPoints(renderer: THREE.WebGLRenderer, sceneBox: THREE.Scene, camera: THREE.PerspectiveCamera, renderTarget: THREE.WebGLRenderTarget) {
		const sm_worldPos = this._getShaderMaterial();
		sm_worldPos.depthFunc = THREE.GreaterEqualDepth;
		sm_worldPos.side = THREE.BackSide;

		renderer.state.buffers.depth.setClear(0);

		sceneBox.overrideMaterial = sm_worldPos;
		renderer.setRenderTarget(renderTarget);
		renderer.clear();
		renderer.render(sceneBox, camera);
		sceneBox.overrideMaterial = null;
		
		// reset depth clear back to normal
		renderer.state.buffers.depth.setClear(1);
	}

	destroy() {
		if (this.sm_worldPos != null) {
			this.sm_worldPos.dispose();
			this.sm_worldPos = undefined;
		}
		if (this.rt_worldPos != null) {
			this.rt_worldPos.dispose();
			this.rt_worldPos = undefined;
		}
	}
}
