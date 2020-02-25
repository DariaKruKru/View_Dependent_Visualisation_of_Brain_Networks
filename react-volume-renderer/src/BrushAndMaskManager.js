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
// author: Markus Toepfer <toepfer@vrvis.at>

import * as THREE from 'three';
import { clearScene } from './util.js';
import type { Mask, Brush } from './flowTypes';

export default class BrushAndMaskManager {

	masksUpdated: boolean;
	masks: ?Array<Mask>;
	sceneMask: ?THREE.Scene;
	getMaskScene: ()=>THREE.Scene;
	setMasks: (masks: ?Array<Mask>) => void;

	brushUpdated: boolean;
	brush: ?Brush;
	sceneBrush: ?THREE.Scene;
	getSceneBrush: ()=>THREE.Scene;
	setBrush: (brush: ?Brush) => void;

	constructor() {
		this.setMasks = this.setMasks.bind(this);
		this.sceneMask = undefined;
		this.masksUpdated = false;
		this.masks = undefined;

		this.setBrush = this.setBrush.bind(this);
		this.sceneBrush = undefined;
		this.brushUpdated = false;
		this.brush = undefined;
	}
	destroy(): void {
		clearScene(this.sceneBrush);
		clearScene(this.sceneMask);
	}
	
	setBrush(brush: ?Brush): void {
		if (this.brush == null && brush == null) {
			// nothing changed
			return;
		}
		
		if (this.brush != null && brush != null) {
			// check if the new brush is different
			if (JSON.stringify(this.brush) == JSON.stringify(brush)) {
				// nothing changed
				return;
			}
		}

		this.brush = brush;
		this.brushUpdated = true;
	}
	getSceneBrush() {
		if (this.sceneBrush == null) {
			this.sceneBrush = new THREE.Scene();
		}

		if (this.brushUpdated) {
			this.brushUpdated = false;
			//} || this.brush.radius != this.brushCached.radius || this.brush.path != this.brushCached.path || this.brush.voxels != this.brushCached.voxels) {

			//28.05.2018 Florian: seems that this.brush!=this.brushCached didn't really work
			
			//this.brushCached = this.brush;
			clearScene(this.sceneBrush);
			this.sceneBrush = new THREE.Scene();

			const material = new THREE.MeshBasicMaterial({
				color: 0xffff00,
				opacity: 0.3,
				transparent: true,
				depthWrite: false,
			});

			if (this.brush != null) {
				let brush: Brush = this.brush;
			
				if (brush.radius != null && brush.path != null) {
					//&& this.brush.path.length >= 1
					//(Markus - 09 06 2017: seems like the volume is not centered anymore in the 3d view... so we dont need to move the coordinates)
					const geo = new THREE.SphereGeometry(brush.radius);

					for (let segment of brush.path) {
						for (let X of segment) {
							const mesh = new THREE.Mesh(geo, material);
							mesh.position.x = X[0]; //-hx;
							mesh.position.y = X[1]; //-hy;
							mesh.position.z = X[2]; //-hz;
							//console.log('MESHPOS ', 'X: ', X[0], hx, mesh.position.x, 'Y: ', X[1], hy, mesh.position.y, 'Z: ', X[2], hz, mesh.position.z);
							this.sceneBrush.add(mesh);
						}
					}
				}
			}
		}
		return this.sceneBrush;
	}

	setMasks(masks: ?Array<Mask>): void {
		if (this.masks == null && masks == null) {
			// nothing changed
			return;
		}
		
		if (this.masks != null && masks != null) {
			// check if the new mask is different
			if (JSON.stringify(this.masks) == JSON.stringify(masks)) {
				// nothing changed
				return;
			}
		}

		this.masks = masks;
		this.masksUpdated = true;
	}

	getMaskScene() {
		if (this.sceneMask == null) {
			this.sceneMask = new THREE.Scene();
		}

		if (this.masksUpdated) {
			this.masksUpdated = false;
			
			clearScene(this.sceneMask);
			this.sceneMask = new THREE.Scene();

			const material = new THREE.MeshBasicMaterial({
				color: 0xffff00,
				opacity: 0.3,
				transparent: true,
				depthWrite: false,
			});

			/* TEST mask:
			let mask: Mask;
			mask.voxels = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
			], 
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
					1, 1, 1, 1, 1,	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
					2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
					3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 
			],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
				2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
				3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
			]];
			masks = [mask];	
			*/
			
			// the brush voxels are expected to be in world coordinates, therefore these are not integer values but floats. 
			// for the mask/brush query, ideally we would send the voxel coordinates, but we need to convert them to the world coordinates for rendering
			// so they are transformed by the API (int -> float), and then send by query to the spatialindex (float->int) and there transformed back to the world coordinates
			// this for sure included some numerical instabilities AND is slows down here the creation of the mask rendering because of the roundings.
			if (this.masks != null) {

				for (let mask of this.masks) {
					let cubeCount = 0;
					let cubeTotal = new THREE.BoxGeometry(mask.BoundingBoxScaleX, mask.BoundingBoxScaleY, mask.BoundingBoxScaleZ);
					let cube = new THREE.BoxGeometry(mask.BoundingBoxScaleX, mask.BoundingBoxScaleY, mask.BoundingBoxScaleZ);
					var m = new THREE.Matrix4();

					if (mask.hasOwnProperty("Data")) { // MASK2
						
						//decode the coordinates
						const binaryString = atob(mask.Data);
						let bitfield = new Uint8Array(binaryString.length);
						for (let i = 0; i < binaryString.length; i++) {
							bitfield[i] = binaryString.charCodeAt(i);
						}

						let isSet = function(x, y, z) {
							if (x < 0 || x > mask.SizeX)
								return false;
							if (y < 0 || y > mask.SizeY)
								return false;
							if (z < 0 || z > mask.SizeZ)
								return false;
							let bitindex = x + mask.SizeX*y + mask.SizeX*mask.SizeY*z;
							let byteindex = bitindex >> 3;
							let bitoffset = bitindex & 7;
							
							let byteval = bitfield[byteindex];
							let bitval = byteval & (1 << bitoffset);
							if (bitval > 0) {
								return true;
							} 
							return false;
						};

						let startX = mask.StartX * mask.BoundingBoxScaleX;
						let startY = mask.StartY * mask.BoundingBoxScaleY;
						let startZ = mask.StartZ * mask.BoundingBoxScaleZ;

						for  (let z = 0; z < mask.SizeZ; z++) {
							for  (let y = 0; y < mask.SizeY; y++) {
								for  (let x = 0; x < mask.SizeX; x++) {
									
									if (isSet(x, y, z) == false) {
										continue; // not set, nothing to draw
									}
									// we only want to draw the outer border... so we only draw cubes there, where at least one neighbor voxel is unset
									if (
										isSet(x-1, y, z) == false ||
										isSet(x+1, y, z) == false ||
										isSet(x, y+1, z) == false ||
										isSet(x, y-1, z) == false ||
										isSet(x, y, z+1) == false || 
										isSet(x, y, z-1) == false
									){
										const xc = startX + x * mask.BoundingBoxScaleX;
										const yc = startY + y * mask.BoundingBoxScaleY;
										const zc = startZ + z * mask.BoundingBoxScaleZ;
										/*console.log("CUBE: ", xc, yc, zc, "x+1:" , isSet(x+1, y, z), "x-1: ", isSet(x-1, y, z),
										"y+1:" , isSet(x, y+1, z), "y-1: ", isSet(x, y-1, z),
										"z+1:" , isSet(x, y, z+1), "z-1: ", isSet(x, y, z-1));*/
										m.elements=[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, xc, yc, zc, 1];
										cubeTotal.merge(cube,m);
										cubeCount++;
									}/* else {
										console.log("NOT: ", x, y, z);
									}*/
								}
							}
						}

					} else {

						// MASK
						if (mask.x != null && Array.isArray(mask.x)) {
							let maxX = Math.round(mask.maxX);
							let maxY = Math.round(mask.maxY);
							let maxZ = Math.round(mask.maxZ);
							let minX = Math.round(mask.minX);
							let minY = Math.round(mask.minY);
							let minZ = Math.round(mask.minZ);
							let cubeSideLengthX = 1.0;
							let cubeSideLengthY = 1.0;
							let cubeSideLengthZ = 1.0;
							// the scaling only works for scaling higher than 1... 
							// else the coordinate rounding process in the next after the grid initialization will create holes.
							if (mask.boundingBoxScaleX != null && mask.boundingBoxScaleX > 1) 
								cubeSideLengthX *= mask.boundingBoxScaleX; 
							if (mask.boundingBoxScaleY != null && mask.boundingBoxScaleY > 1)
								cubeSideLengthY *= mask.boundingBoxScaleY;
							if (mask.boundingBoxScaleZ != null && mask.boundingBoxScaleZ > 1)
								cubeSideLengthZ *= mask.boundingBoxScaleZ;

							if(maxX>0 && maxY>0 && maxZ>0){
								let multiArray: Array<Array<Array<boolean>>>;
								let x: number, y: number, z: number;
								// this inits a 3d boolearn array with 'false'
								multiArray= Array(maxX);
								for (multiArray, x = minX; x <= maxX+1; x++)
									for (multiArray[x] = Array(maxY), y = minY; y <= maxY+1; y++)
										for (multiArray[x][y] = Array(maxZ), z = minZ; z <= maxZ+1; z++)
											multiArray[x][y][z] = false; 
								
								// now we set the actual voxels to true
								for (let i = 0; i < mask.x.length; i++) {
									// the voxels array looks like that [[xcoods], [ycoords], zcoords]]
									const xc = Math.round(mask.x[i]);
									const yc = Math.round(mask.y[i]);
									const zc = Math.round(mask.z[i]);
									//console.log("X: ", mask.x[i], xc, " Y: ", mask.y[i], yc, " Z: ", mask.z[i], zc);
									multiArray[xc][yc][zc]=true;
								}
							
								for (let x = minX+1; x < maxX; x++) {
									for (let y = minY+1; y < maxY; y++) {
										for (let z = minZ+1; z < maxZ; z++) {
											if(multiArray [x][y][z] == false){
												continue; //not set, nothing to draw
											}

											if(
												multiArray [x-1][y][z]==false ||
												multiArray [x][y-1][z]==false ||
												multiArray [x][y][z-1]==false ||
												multiArray [x+1][y][z]==false ||
												multiArray [x][y+1][z]==false ||
												multiArray [x][y][z+1]==false
											 ){
													m.elements=[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
													cubeTotal.merge(cube,m);
													cubeCount++;
												}
											}
										}
									}
								}
						}
					} // old mask

					// as mask mesh of cubes to the scene
					const cubeMesh = new THREE.Mesh(cubeTotal, material);
					if (this.sceneMask != null && cubeCount > 0) {
						this.sceneMask.add(cubeMesh);
					}

				}  // end for mask of masks
			}
		}
		return this.sceneMask;
	}

}