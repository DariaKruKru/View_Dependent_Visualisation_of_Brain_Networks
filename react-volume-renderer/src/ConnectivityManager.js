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
// author: Florian Ganglberger <ganglberger@vrvis.at>

import * as THREE from 'three';
import { clearScene } from './util.js';
import type { Region, Connection } from './flowTypes';
import {BowyConnectionGeometry, GetIntermediatePoints, getScreenCoordinates} from './BowyConnectivity';

export default class ConnectivityManager {

	setConnectivityData: (connectivityConnections: ?Array<Connection>, connectivityRegions: ?Array<Region>, connectivityIsDirected: ?{}, camera: THREE.PerspectiveCamera, volumeSize: Array<number>) => void;
	geometrySphereCached: {};
	sceneNetwork: ?THREE.Scene;
	getScene: (cameraPos: THREE.Vector3)=>THREE.Scene;

	connectivityConnections: Array<Connection>;
	connectivityRegions: Array<Region>;
	connectivityIsDirected: {};
	volumeSize: Array<number>;

	constructor() {
		this.geometrySphereCached = {}; // remembers THREE.Spheres, one for each radius (performance!)
		this.setConnectivityData = this.setConnectivityData.bind(this);
		this.updateConnectivityInScene = this.updateConnectivityInScene.bind(this);
		this.sceneNetwork = undefined;
		this.volumeSize = undefined;
		
		this.curvatureParameter = 1; //manipulate with radius of bows
		this.curveWidthParameter = 1; //adjust width of all bows
		this.isBows = true; //true – connections are presented as bows, false – as straight 
	}
	destroy() {
		clearScene(this.sceneNetwork);
	}
	
	getScene(cameraPos: ?THREE.Vector3): THREE.Scene {
		if (this.sceneNetwork == null) {
			this.sceneNetwork = new THREE.Scene();
			const spotLight = new THREE.SpotLight( 0xffffff );
			this.sceneNetwork.add( spotLight );
		}
		const s: THREE.Scene = this.sceneNetwork;

		/* if (this.volumeSize == null || this.canvas == null) {
			return s;
		} */
		// update spotlight position to camera center
		//const c = this.getCamera();
		if (cameraPos != null) {
			s.children[0].position.set(cameraPos.x, cameraPos.y, cameraPos.z );
		}

		return s;
	}

	/**
	 * setConnectivityData sets networks
	 * @param {*} connectivityConnections connections represented as lines/arrow-lines
	 * @param {*} connectivityRegions nodes represented as spheres
	 * @param {*} connectivityIsDirected 
	 */
	setConnectivityData(connectivityConnections: ?Array<Connection>, connectivityRegions: ?Array<Region>, connectivityIsDirected: ?{},  camera: THREE.PerspectiveCamera, volumeSize: Array<number>): void {
		this.connectivityConnections = connectivityConnections;
		this.connectivityRegions = connectivityRegions;
		this.connectivityIsDirected = connectivityIsDirected;
		this.volumeSize = volumeSize;
		//var t0 = performance.now();

		this.updateConnectivityInScene(camera);
		//var t1 = performance.now();
		//console.log("Call to updateConnectivity took " + (t1 - t0) + " milliseconds.");
	} // END setConnectivityData


	updateConnectivityInScene(camera: THREE.PerspectiveCamera): void {
		const scene: THREE.Scene = this.getScene();
		while(scene.children.length > 1) {
			// remove old lines and spheres, keep only the spotlight at position 0
			scene.remove(scene.children[1]); 
		}

		//FOG settings

		/* var fogColor = new THREE.Color(0x151515);
		scene.background = fogColor;
		scene.fog = new THREE.Fog(fogColor, 0.0001, 1000); */
		var t0 = performance.now();

		if (this.connectivityConnections != null && this.connectivityRegions != null && this.connectivityIsDirected != null) {
			
			const connections: Array<Connection> = this.connectivityConnections;
			const regions: Array<Region> = this.connectivityRegions;
			const isDirected: {} = this.connectivityIsDirected;
		
			//add network graph to the renderer here
			if(connections.length > 0 && regions.length > 0) {
				//console.time('renderConnections');
				
				let renderSpheres = []; 
				//let renderSpheresIsConnected = [];

				//render spheres
				for (let i=0; i<regions.length; i++) {
					if (regions[i].CenterNodeCoordinates != 'null'){
						const regionCoordinates = regions[i].CenterNodeCoordinates.split(',');
						const radius = ((regions[i].Size)*1.33067)/10.0; //Math.pow((3*Math.PI/4), 1/3); then divided by 8 which was small enough to render properly
						
						if (this.geometrySphereCached[radius]==undefined){
							this.geometrySphereCached[radius] =  new THREE.SphereGeometry(radius, 32, 32);
						}
						//var materialSphere = new THREE.MeshBasicMaterial( {color: new THREE.Color( "#"+regions[i].Color )} ); //This material is not affected by lights. 
						var materialSphere = new THREE.MeshBasicMaterial( {
							color: new THREE.Color('#'+regions[i].Color )
						} );

						var outlineMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.BackSide } );
						var outlineMesh = new THREE.Mesh( this.geometrySphereCached[radius], outlineMaterial );
						outlineMesh.scale.multiplyScalar(1.1);

						var sphere = new THREE.Mesh(this.geometrySphereCached[radius], materialSphere);

						sphere.position.x = regionCoordinates[0];
						sphere.position.y = regionCoordinates[1];
						sphere.position.z = regionCoordinates[2];

					 	outlineMesh.position.x = regionCoordinates[0];
						outlineMesh.position.y = regionCoordinates[1];
						outlineMesh.position.z = regionCoordinates[2]; 
						
						regions[i].regionCoordinates=regionCoordinates;
						renderSpheres.push(outlineMesh);
						renderSpheres.push(sphere);
						

					} else {
						renderSpheres.push(undefined);
					}
				}

				const cameraDir = new THREE.Vector3();
				camera.getWorldDirection(cameraDir);

				const headLength = 2;
				const headWidth = 1.5;

				for (let i=0; i<connections.length; i++) {
				
					const regionFrom = regions.find(o => o.Rid === connections[i].f);
					const regionTo = regions.find(o => o.Rid === connections[i].t);

					if (regionFrom != undefined && regionTo != undefined && regionFrom.regionCoordinates != regionTo.regionCoordinates) {

						const coordFrom = regionFrom.regionCoordinates;
						const coordTo = regionTo.regionCoordinates;
						//const sizeFrom = regionFrom.Size;
						const sizeTo = regionTo.Size;
						//const radiusFrom = ((sizeFrom)*1.33067)/10;
						const radiusTo = ((sizeTo)*1.33067)/10;

						const lineColor = new THREE.Color(new THREE.Color(connections[i].lineColor));
						
						const from = new THREE.Vector3( coordFrom[0], coordFrom[1], coordFrom[2] );
						const to = new THREE.Vector3( coordTo[0], coordTo[1], coordTo[2]);
						const arrowDir = new THREE.Vector3();

						//ARROW IN DIRECTION FROM => TO
						//from.y = +from.y + radiusTo/2; //convert to number and add half of radius
						//to.y = +to.y + radiusTo/2;
						arrowDir.subVectors(to, from);
						const length = arrowDir.length();

						let totalConnections=0;
						let positionOfConnection=1;
						let totalSameConnections=0;
						for (let j=0; j<connections.length; j++) {
							if (connections[j].f == connections[i].t && connections[i].f == connections[j].t) {
								totalConnections++;
							}
							if (connections[j].t == connections[i].t && connections[i].f == connections[j].f) {
								totalConnections++;
								totalSameConnections++;
								if (j<i) {
									positionOfConnection++;
								}
							}
						}
						
						if (totalConnections>1) {

							const movingVector = new THREE.Vector3();
							movingVector.crossVectors(arrowDir, cameraDir);

							const scale = 0.02;

							let totalScale = positionOfConnection*scale;
							totalScale = totalScale-(scale*Math.ceil(totalSameConnections/2.0));
							if (totalConnections%2 == 0) totalScale=totalScale-(scale/2.0);

							//  AV  
							// AA A=s1 A=-s1 verschub um 1 (2/2)
							//  AAV A=s1 A=s0 V=s1 //verschub um 1 = (2/2)
							//  AVV A=s1 V=s0 V=s1
							//  AAA A=s1 A=s0 A=-s1 verschub um 2 = ceiling(3/2)
							// AAVV A=s2 A=s1 V=s1 V=s2 
							// AAAV A=s2 A=s2 A=-s1 V=s2 verschub um 2  ceiling(3/2)
							// AAAAV A=s2 A=s1 A=s0 A=-s1 V=-s2 verschub um 2 ceiling(4/2)
							// AAAAA A=s2 A=s1 A=s0 A=-s1 A=-s2 verschub um 3 ceiling(5/2)

							from.x =+ from.x + (movingVector.x*totalScale);
							from.y =+ from.y + (movingVector.y*totalScale);
							from.z =+ from.z + (movingVector.z*totalScale);

							to.x =+ to.x + (movingVector.x*totalScale);
							to.y =+ to.y + (movingVector.y*totalScale);
							to.z =+ to.z + (movingVector.z*totalScale);
						}

						if (length > 0 && radiusTo > 0 && length > radiusTo) {

							if (this.isBows === true){
							
								const geometryLine = BowyConnectionGeometry(from, to, camera, this.volumeSize, 25);

								var lineMaterial = new THREE.LineMaterial( {
									color: lineColor,//0xffffff,
									linewidth: Math.pow(radiusTo, 1.7)*0.45, // in pixels
									//vertexColors: THREE.VertexColors,
									dashed: false,
									fog: true
								} ); 
								
								lineMaterial.resolution.set( window.innerWidth, window.innerHeight );
								const line = new THREE.Line2( geometryLine, lineMaterial );
								line.computeLineDistances(); 

								scene.add( line ); }

							else {
								if (!isDirected[connections[i].cm]) {
								const materialLine = new THREE.LineBasicMaterial({
										color: lineColor,
									});
									const straightLine = new THREE.Geometry();

									straightLine.vertices.push(
										new THREE.Vector3( from.x, from.y, from.z ), //from
										new THREE.Vector3( to.x, to.y, to.z )  //to
									); 

									const line = new THREE.Line( straightLine, materialLine ); 

									scene.add( line );  
									
								} else {
									//if headlength>length then there would be a warning, therfore we reduce headlength
									const arrowHelper = new THREE.ArrowHelper(arrowDir.normalize(), from, length-radiusTo, lineColor, ((length-radiusTo)<=headLength)?headLength*0.5:headLength, headWidth);
									scene.add( arrowHelper );
								}
							}
						}
					}
				
				}
				//console.timeEnd("renderConnections")

				for (let i=0;i<regions.length*2;i++) {
					//if(renderSpheresIsConnected[regions[i].Rid]!=undefined && renderSpheres[i]!=undefined)
					if (renderSpheres[i]!=undefined)
						scene.add(renderSpheres[i]);
				}
			}
		}
		var t1 = performance.now();
		console.log("Call to updateConnectivity took " + (t1 - t0) + " milliseconds.");
	} // END addConnectivityToScene

}