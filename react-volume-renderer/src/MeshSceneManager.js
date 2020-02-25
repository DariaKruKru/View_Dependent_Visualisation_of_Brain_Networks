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
import { clearScene } from './util.js';

var getMeshIDasVector = function(id) {
	//console.log('### id = '+meshObject.id)
	//let id = meshObject.userData.id

	var mask = parseInt('11111111', 2); // 255
	let x = id & mask;
	let y = (id >> 8) & mask;
	let z = (id >> 16) & mask;

	return new THREE.Vector3(x / 255.0, y / 255.0, z / 255.0);
	//this.value.setX  (x / 255.0) // 65280
	//this.value.setY  (y / 255.0) // 65535
	//this.value.setZ  (z / 255.0) // 65535
};

const isMesh = function(node) {
	switch (node.type) {
		case 'Group':
		case 'Scene':
		case 'Light':
		case 'AmbientLight':
		case 'SpotLight': {
			return false;
		}
		case 'Mesh':
		case 'Line':
		case 'LineSegments': {
			return true;
		}
	}
	throw new Error('node type not handled: ' + node.type);
}

/**
 * MeshSceneManager takes objects (with render styles) and offers a getter for a
 * scene with correct visibility for each render style.
 */
export default class MeshSceneManager {
	scene: THREE.Scene;
	cameraLight: THREE.SpotLight;

	constructor() {
		//this.sceneObjects = [];
		// init scene
		this.scene = new THREE.Scene();
		this.cameraLight = new THREE.SpotLight(0xffffff, 1.1);
		this.scene.add(this.cameraLight); // attach point light to scene
		this.scene.add(new THREE.AmbientLight(0x555555));

		//window.scene = this.scene; // for the THREEjs inspector

		//this.destroy = this.destroy.bind(this);
		/*
    this.templateCenterOffset = [
      453/2,
      661/2,
      196/2
    ];*/
	}

	/**
	 * getScene returns the current scene with meshes set visible
	 */
	getScene(renderStyle: string): THREE.Scene {
		switch (renderStyle) {
			case 'opaque':
				this._setSceneVisibilityOpaque();
				break;
			case 'isPickable':
				this._setSceneVisibilityPicking();
				break;
			case 'contour':
				// TODO: this should be done for all meshes that have render style 'contour'
				this._setSceneVisibilityOpaque();
				break;
				//throw Error('Really does not work with this shader... has to render each mesh in a separate pass.');
				/* For a contour/silhouette shader it does not make sense to get a scene
				* because we need to render each mesh in a separate pass anyways.
				* Compare the new silhouette shading in BrainGazer/BrainTrawler.
				*/
			case 'silhouetteAndCreases':
				this._setSceneVisibilitySilhouette();
				break;
			case 'customMaterial':
				this._setSceneVisibilityCustomMaterial();
				break;
			case 'hologram':
				this._setSceneVisibilityHologram();
				break;
			default:
				//console.error('RenderStyle ' + renderStyle + ' not available.');
				throw Error('RenderStyle ' + renderStyle + ' not available.');
				//break;
		}

		return this.scene;
	}

	/**_setSceneVisibilityCustomMaterial sets only meshes visible that have renderStyle
	 * 'customMaterial'.
	 */
	_setSceneVisibilityCustomMaterial(): void {
		
		this.scene.traverse(function(node) {
			if (!isMesh(node)) return;

			// set opaque stuff visible (that's also the default renderStyles)
			if (node.userData.renderStyles.indexOf('customMaterial') > -1) {
				// use 'remove-opaque' to hide objects if an ancestor is rendered opaque
				node.visible = true;
			} else {
				// not opaque, make it invisible
				node.visible = false;
			}
		});
	}

	/**_setSceneVisibilityOpaque sets only meshes visible that have renderStyle
	 * 'opaque'.
	 * Also sets colour saturation to 1 for each mesh.
	 */
	_setSceneVisibilityOpaque(): void {
		let bDesaturateAll = false;
		this.scene.traverse(function(node) {
			if (!isMesh(node)) return;

			if (node.userData.renderStyles.indexOf('desaturate-rest') > -1) {
				bDesaturateAll = true;
			}
		});

		this.scene.traverse(function(node) {
			if (!isMesh(node)) return;

			// set opaque stuff visible (that's also the default renderStyles)
			if (
				node.userData.renderStyles.indexOf('opaque') > -1 &&
				node.userData.renderStyles.indexOf('remove-opaque') == -1
			) {
				// use 'remove-opaque' to hide objects if an ancestor is rendered opaque
				node.visible = true;
				node.userData.saturation = 1.0;
				if (
					bDesaturateAll &&
					node.userData.renderStyles.indexOf('saturate-always') == -1
				) {
					// this is opaque but color desaturated
					node.userData.saturation = 0.5;
				}
			} else {
				// not opaque, make it invisible
				node.visible = false;
			}
		});
	}

	_setSceneVisibilityHologram(): void {
	
		this.scene.traverse(function(node) {
			if (!isMesh(node)) return;

			// set hologram stuff visible
			if (
				node.userData.renderStyles.indexOf('hologram') > -1
			) {
				node.visible = true;
			} else {
				// does not have renderStyle hologram, make it invisible
				node.visible = false;
			}
		});
	}

	
	/**_setSceneVisibilitySilhouette sets only meshes visible that have renderStyle
	 * 'silhouetteAndCreases'.
	 */
	_setSceneVisibilitySilhouette(): void {
		
		let counter = 0;
		this.scene.traverse(function(node) {
			if (!isMesh(node)) return;

			// set silhouette stuff visible
			if (
				node.userData.renderStyles.indexOf('silhouetteAndCreases') > -1
			) {
				node.visible = true;
			} else {
				// does not have renderStyle silhouetteAndCreases, make it invisible
				node.visible = false;
			}
		});
	}

	// TODO: use this
	// set everything visible that has style 'isPickable'
	_setSceneVisibilityPicking(): void {
		
	}

	/**
	 * setObjects clears the scene and then adds all objects to it.
	 */
	setObjects(objects: Array<THREE.Group>) {
		// clear scene, keep only the two lights
		this.scene.children = [this.scene.children[0], this.scene.children[1]];

		for (let obj of objects) {
			this._addVisibleObject(obj);
		}
	}

	/**
	 * _addVisibleObject gives the mesh of the object (found at children[0]) an
	 * onBeforeRender function, then adds the object to the scene.
	 *
	 * The onBeforeRender function makes sure that the uniforms are dynamically
	 * changed with the object's userData.
	 */
	_addVisibleObject(obj: THREE.Group) {
		//mesh.material['side'] = THREE.DoubleSide; // TODO: use well-formed meshes instead
		obj.children[0].onBeforeRender = function onBeforeRender(
			_this,
			scene,
			camera,
			geometry,
			material,
			_group,
		) {
			// _this is the renderer, _this.context is the WebGLRenderer
			if (material.setProgramNotYetCalled) {
				const map = material.uniforms;

				if (map.hasOwnProperty('ufSaturation')) {
					map.ufSaturation.value = this.userData.saturation;
				}
				if (map.hasOwnProperty('uVec3Color')) {
					map.uVec3Color.value = this.userData.color;
				}
				if (map.hasOwnProperty('uVec3MeshID')) {
					map.uVec3MeshID.value = getMeshIDasVector(this.userData.id);
				}
				material.setProgramNotYetCalled = false;
				return;
			}
			if (material.program && material.uniforms !== undefined) {
				const gl = material.program.getUniforms().renderer.context;
				const map = material.program.getUniforms().map;

				if (map.hasOwnProperty('ufSaturation')) {
					map.ufSaturation.setValue(gl, this.userData.saturation);
				}
				if (map.hasOwnProperty('uVec3Color')) {
					map.uVec3Color.setValue(gl, this.userData.color);
				}
				if (map.hasOwnProperty('uVec3MeshID')) {
					map.uVec3MeshID.setValue(gl, getMeshIDasVector(this.userData.id));
				}
			}
		};

		// add final obj to scene
		//this.sceneObjects.push(obj);
		this.scene.add(obj);
	}

	destroy() {
		clearScene(this.scene);

		window.scene = undefined;
	}
}
