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
//import { shaderBlur } from './shaders/shaderBlur';
import { shaderSilhouettePass2 } from './shaders/shaderSilhouettePass2';

export default class RenderPassSilhouette {
	sm_silhouettePass1: ?THREE.ShaderMaterial;
	//sm_silhouettePass1b: ?THREE.ShaderMaterial;
	sm_silhouettePass2: ?THREE.ShaderMaterial;
	rt_pass1: ?THREE.WebGLRenderTarget;
	//rt_pass1b: ?THREE.WebGLRenderTarget;
	rt_pass2: ?THREE.WebGLRenderTarget;
	sceneFullScreenQuad: ?THREE.Scene;

	constructor() {
	}

	/**getRenderTargetPass1 returns a renderTarget for a depth texture of meshes */
	getRenderTargetPass1(width: number, height: number): THREE.WebGLRenderTarget {
		//width = 2048
		//height = 2048

		if (this.rt_pass1 == null) {
			this.rt_pass1 = new THREE.WebGLRenderTarget(width, height, {
				//minFilter: THREE.NearestFilter, // default is LinearFilter
				//magFilter: THREE.NearestFilter, // default is LinearFilter
				//wrapS: THREE.ClampToEdgeWrapping, // default is ClampToEdgeWrapping.
				//wrapT: THREE.ClampToEdgeWrapping, // default is ClampToEdgeWrapping.
				stencilBuffer: false, // default is true (only needed for ENTRY POINTS)
				type: THREE.HalfFloatType, // not all browsers support FloatType? (default is UnsignedByteType)
				depthBuffer: true, // default is true
				depthTexture: new THREE.DepthTexture(),
				//depthWrite: true,
			});
			this.rt_pass1.depthTexture.type = THREE.UnsignedShortType;
		}
		if (
			this.rt_pass1.width !== width ||
			this.rt_pass1.height !== height
		) {
			this.rt_pass1.setSize(width, height);
		}
		return this.rt_pass1;
	}

	/**getRenderTargetPass2 returns a renderTarget for the finished silhouette texture */
	getRenderTargetPass2(width: number, height: number): THREE.WebGLRenderTarget {
		//width = 2048
		//height = 2048

		if (this.rt_pass2 == null) {
			this.rt_pass2 = new THREE.WebGLRenderTarget(width, height, {
				/* generateMipmaps: true,
				minFilter: THREE.LinearMipMapNearestFilter, // ok on large canvas */
				//minFilter: THREE.LinearMipMapLinearFilter, // NO! (supposedly the default value)
				//minFilter: THREE.NearestMipMapLinearFilter, // NO
				//minFilter: THREE.NearestMipMapNearestFilter, // NO
				stencilBuffer: false, // default is true (only needed for ENTRY POINTS)
				type: THREE.HalfFloatType, // not all browsers support FloatType? (default is UnsignedByteType)
				depthBuffer: false, // default is true
			});
		}
		if (
			this.rt_pass2.width !== width ||
			this.rt_pass2.height !== height
		) {
			this.rt_pass2.setSize(width, height);
		}
		return this.rt_pass2;
	}

	/**
	 * render1 renders the scene meshes into a depth texture
	 * @param {*} renderer 
	 * @param {*} sceneBox 
	 * @param {*} camera 
	 * @param {*} renderTarget 
	 */
	render1(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderTarget: THREE.WebGLRenderTarget): void {
		if (this.sm_silhouettePass1 == null) {
			this.sm_silhouettePass1 = new THREE.MeshDepthMaterial({
				depthTest: true, // default
				depthFunc: THREE.LessEqualDepth, // default
				side: THREE.DoubleSide,
			}); // automatically uses camera mNear and mFar // TODO: test THREEjs DepthMaterial
		}
		//this.sm_silhouettePass1.side = THREE.DoubleSide;

		scene.overrideMaterial = this.sm_silhouettePass1;
		renderer.setRenderTarget(renderTarget);
		renderer.clear();
		renderer.render(scene, camera);
		scene.overrideMaterial = null;
	}

	/**
	 * render2 takes the depth texture and computes a silhouette texture from it
	 * @param {*} renderer 
	 * @param {*} sceneBox 
	 * @param {*} camera 
	 * @param {*} renderTarget 
	 */
	render2(renderer: THREE.WebGLRenderer, texCustomDepthBuffer: THREE.Texture, texDepthBuffer: THREE.Texture, /* texSilhouetteAccumulatedBuffer: THREE.Texture, */ /* scene: THREE.Scene, */ camera: THREE.OrthographicCamera, renderTarget: THREE.WebGLRenderTarget/* , b_clear: boolean */): void {
		if (this.sm_silhouettePass2 == null) {
			this.sm_silhouettePass2 = new THREE.ShaderMaterial(shaderSilhouettePass2());
		}
		const sm: THREE.ShaderMaterial = this.sm_silhouettePass2;
		const scene = this.getFullScreenQuad();
		
		sm.uniforms.texDepthBuffer.value = texDepthBuffer;
		sm.uniforms.texCustomDepthBuffer.value = texCustomDepthBuffer;
		const h = renderer.context.drawingBufferHeight;
		const w = renderer.context.drawingBufferWidth;
		sm.uniforms.resolution.value = new THREE.Vector2(1.0/w, 1.0/h);
		
		const scaleDepthValues = Math.min(h, w); // we see more silhouette detail when the canvas is large
		//sm.uniforms.scaleDepthValues.value = (h+w)/2.0;
		sm.uniforms.scaleDepthValues.value = scaleDepthValues;
		
		scene.overrideMaterial = sm;
		renderer.setRenderTarget(renderTarget);
		renderer.render(scene, camera);
		scene.overrideMaterial = null;
	}

	getFullScreenQuad(): THREE.Scene {
		if (this.sceneFullScreenQuad == null) {
			this.sceneFullScreenQuad = new THREE.Scene();
			const fsq = new THREE.Mesh( // this is a full screen quad
				new THREE.PlaneBufferGeometry(2, 2),
				undefined,
			);
			
			this.sceneFullScreenQuad.add(fsq);
		}
		return this.sceneFullScreenQuad;
	}

	destroy() {
		if (this.sm_silhouettePass1 != null) {
			this.sm_silhouettePass1.dispose();
			this.sm_silhouettePass1 = undefined;
		}
		if (this.rt_pass1 != null) {
			this.rt_pass1.dispose();
			this.rt_pass1 = undefined;
		}/* 
		if (this.sm_silhouettePass1b != null) {
			this.sm_silhouettePass1b.dispose();
			this.sm_silhouettePass1b = undefined;
		}
		if (this.rt_pass1b != null) {
			this.rt_pass1b.dispose();
			this.rt_pass1b = undefined;
		} */
		if (this.sm_silhouettePass2 != null) {
			this.sm_silhouettePass2.dispose();
			this.sm_silhouettePass2 = undefined;
		}
		if (this.rt_pass2 != null) {
			this.rt_pass2.dispose();
			this.rt_pass2 = undefined;
		}
	}
}
