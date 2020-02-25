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

// author: Florian Schulze <fschulze@vrvis.at>
// author: Nicolas Swoboda <swoboda@vrvis.at>
// author: Markus Toepfer <toepfer@vrvis.at>
// author: Florian Ganglberger <ganglberger@vrvis.at>


import * as THREE from 'three';
THREE.TrackballControls = require('imports-loader?THREE=three!exports-loader?THREE.TrackballControls!../node_modules/three/examples/js/controls/TrackballControls');
import RenderPassOpaqueMesh from './RenderPassOpaqueMesh.js';
import RenderPassDepthBuffer from './RenderPassDepthBuffer.js';
import RenderPassWorldPos from './RenderPassWorldPos';
import RenderPassSilhouette from './RenderPassSilhouette.js';
import RenderPassHologramMesh from './RenderPassHologramMesh.js';
import { shaderSmartComposition } from './shaders/shaderSmartComposition';
import MeshSceneManager from './MeshSceneManager.js';
import ConnectivityManager from './ConnectivityManager';
import BrushAndMaskManager from './BrushAndMaskManager';
import { shaderVolume } from './shaders/shaderVolume';
import chroma from 'chroma-js';
import type { Job, Brush, Mask, AtlasBoundFile, Region, Connection } from './flowTypes';
import { clearScene, getOS } from './util.js';


export default class Renderer {
	width: number;
	height: number;
	canvas: HTMLCanvasElement;
	downsamplefactor: number;
	lastRenderTimeStamp: number;
	lastRenderTimeStamps: Array<number>;
	lastRenderTimeStampsIndex: number;
	bShowBoundingBox: boolean;
	backgroundColour: number;

	mouse: THREE.Vector2;
	mouseDown: THREE.Vector2;
	raycaster: THREE.Raycaster;
	onMouseInteraction: (e: Event) => void;
	onMouseDown: (e: Event) => void;
	onMouseUp: (e: Event) => void;
	onMouseOut: (e: Event) => void;

	setAppearance: (
		channel: number,
		colorHex: string,
		contrast: number,
		brightness: number,
		transparency: number,
		visible: boolean,
	) => void;

	render: () => void;
	updateAtlas: () => void;
	setSize: (width: number, height: number) => void;

	atlasWidth: number;
	atlasHeight: number;
	atlasColumns: number;
	atlasRows: number;
	atlasSliceNum: number;
	volumeSize: ?Array<number>;
	defineVolume: (
		atlasWidth: number,
		atlasHeight: number,
		atlasColumns: number,
		atlasRows: number,
		atlasSliceNum: number,
		volumeSize: Array<number>,
	) => void;
	atlasData: Uint8Array;

	cursor: ?Array<number>;
	setCursor: (newCursor?: Array<number>) => void;

	mousePickingCallback: (
		intersects: Array<{
			point: Array<number>,
			meshIdentifier: string,
			distance: number,
		}>,
	) => void;

	camera: ?THREE.PerspectiveCamera;
	getCamera: () => THREE.PerspectiveCamera;
	cameraOrtho: ?THREE.OrthographicCamera;
	cameraControls: ?THREE.TrackballControls;

	sceneVolumes: ?THREE.Scene;
	getSceneVolumes: () => THREE.Scene;

	sceneBoundingBoxes: ?THREE.Scene;
	getSceneBoundingBoxes: () => THREE.Scene;

	sceneNearPlane: ?THREE.Scene;
	getSceneNearPlane: (camera: THREE.PerspectiveCamera) => THREE.Scene;

	atlasTex: ?THREE.DataTexture;
	getAtlasTex: () => THREE.DataTexture;

	hideVolume: (channel: number) => void;

	lineBoxMesh: ?THREE.LineSegments;
	getLineBoxMesh: () => THREE.LineSegments;

	cursorCrosshairMesh: ?THREE.LineSegments;
	getCursorCrosshairMesh: () => THREE.LineSegments;

	sceneDownsampledResultPass: ?THREE.Scene;
	getSceneDownsampledResultPass: () => THREE.Scene;

	downsampledResultTargetTexture: ?THREE.WebGLRenderTarget;
	getDownsampledResultTargetTexture: () => THREE.WebGLRenderTarget;

	sceneOverlays: ?THREE.Scene;
	getSceneOverlays: () => THREE.Scene;

	setBrush: (brush: ?Brush) => void;
	setMasks: (masks: ?Array<Mask>) => void;
	setConnectivityData: (connectivityConnections: ?Array<Connection>, connectivityRegions: ?Array<Region>, connectivityIsDirected: ?{}, volumeSize: Array<number>) => void;

	destroy: () => void;

	sm_volumes: ?THREE.ShaderMaterial;
	meshVolumes: ?THREE.Mesh;
	materialDownsampledResult: ?THREE.MeshBasicMaterial;

	atlasProcessQueue: {
		working: boolean, // is processing currently active
		currentJob: ?Job,
		queue: Array<Job>,
	};
	atlasBoundFiles: { [channel_id: number]: ?AtlasBoundFile };

	traceSteps: number;
	alphaCorrection: number;
	renderer: THREE.WebGLRenderer;
	RenderPassEntry: RenderPassWorldPos;
	RenderPassExit: RenderPassWorldPos;
	RenderPassOpaqueMesh: RenderPassOpaqueMesh;
	RenderPassDepthBuffer: RenderPassDepthBuffer;
	RenderPassSilhouette: RenderPassSilhouette;
	RenderPassHologramMesh: RenderPassHologramMesh;
	MeshSceneManager: MeshSceneManager;
	ConnectivityManager: ConnectivityManager;
	BrushAndMaskManager: BrushAndMaskManager;
	downsampledResultCamera: ?THREE.OrthographicCamera;
	allowDownsampling: boolean;

	tfData: Uint8Array;
	tfTex: THREE.DataTexture;
	imageDataCanvas: ?HTMLCanvasElement;
 	
	constructor(canvas: HTMLCanvasElement, width: number, height: number) {
		this.width = width;
		this.height = height;
		this.canvas = canvas;

		this.downsamplefactor = 0.5;

		// taking rendering frame time
		this.lastRenderTimeStamp = Date.now();
		// circular buffer to store last couple of frame times
		this.lastRenderTimeStamps = [50.0, 50.0, 50.0, 50.0, 50.0];
		this.lastRenderTimeStampsIndex = 0;

		// Binding 'this' to functions (these functions may be called from outside of the renderer class!)
		this.onMouseInteraction = this.onMouseInteraction.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
		this.onMouseOut = this.onMouseOut.bind(this);
		this.setAppearance = this.setAppearance.bind(this);
		this.render = this.render.bind(this);
		this.updateAtlas = this.updateAtlas.bind(this);
		this.setSize = this.setSize.bind(this);
		this.defineVolume = this.defineVolume.bind(this);
		this.setCursor = this.setCursor.bind(this);
		this.setBrush = this.setBrush.bind(this);
		this.setMasks = this.setMasks.bind(this);
		this.hideVolume = this.hideVolume.bind(this);
		this.destroy = this.destroy.bind(this);

		this.sceneDownsampledResultPass = undefined;
		this.sceneBoundingBoxes = undefined;
		this.sm_volumes = undefined;
		this.volumeSize = undefined;
		this.cursor = undefined;

		// the atlas process queue is used to update the atlasTexture
		// Asynchronously so that the webapp does not freeze
		// the updateAtlas method computes always only a small portion
		// of the work and then yields
		this.atlasProcessQueue = {
			working: false, // is processing currently active
			currentJob: undefined,
			queue: [],
		};

		this.atlasBoundFiles = {}; //this is the atlasTex files
		this.atlasBoundFiles[0] = undefined; //r/x
		this.atlasBoundFiles[1] = undefined; //g/y
		this.atlasBoundFiles[2] = undefined; //b/z
		this.atlasBoundFiles[3] = undefined; //a/w

		// Parameters
		this.traceSteps = 256;
		this.alphaCorrection = 1.6;

		// Create THREE Renderer
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			//antialias: true,
			//alpha: true,
			logarithmicDepthBuffer: false,
		});

		//this.renderer.context.getExtension('OES_standard_derivatives');

		this.renderer.setSize(this.width, this.height);
		this.renderer.setClearColor(0x000000);

		this.renderer.domElement.onmousemove = this.onMouseInteraction;
		this.renderer.domElement.onmouseup = this.onMouseUp;
		this.renderer.domElement.onmousedown = this.onMouseDown;
		this.renderer.domElement.onwheel = this.onMouseInteraction;
		this.renderer.domElement.onmouseout = this.onMouseOut;

		this.RenderPassEntry = new RenderPassWorldPos();
		this.RenderPassExit = new RenderPassWorldPos();
		this.RenderPassSilhouette = new RenderPassSilhouette();
		this.RenderPassOpaqueMesh = new RenderPassOpaqueMesh();
		this.RenderPassDepthBuffer = new RenderPassDepthBuffer();
		this.RenderPassHologramMesh = new RenderPassHologramMesh();
		this.MeshSceneManager = new MeshSceneManager();
		this.ConnectivityManager = new ConnectivityManager();
		this.BrushAndMaskManager = new BrushAndMaskManager();

		// Setup Camera for blitting downsampled image on screen
		// prettier-ignore
		this.downsampledResultCamera = new THREE.OrthographicCamera(-1,1,1,-1,-1,1);

		// Transferfunction lookup table for four channels
		this.tfData = new Uint8Array(256 * 4 * 4); // 256 RGBA values for 4 channels
		this.tfTex = new THREE.DataTexture(
			this.tfData,
			256,
			4,
			THREE.RGBAFormat,
			THREE.UnsignedByteType,
			THREE.UVMapping,
			THREE.ClampToEdgeWrapping,
			THREE.ClampToEdgeWrapping,
			THREE.NearestFilter,
			THREE.NearestFilter,
			1,
		);
	}

	destroy(): void {
		clearScene(this.getSceneBoundingBoxes());
		clearScene(this.sceneNearPlane);
		clearScene(this.getSceneDownsampledResultPass());
		clearScene(this.getSceneOverlays());
		clearScene(this.getSceneVolumes());

		if (this.cameraControls != null) {
			this.cameraControls.dispose();
		}
		this.MeshSceneManager.destroy();
		this.ConnectivityManager.destroy();
		this.BrushAndMaskManager.destroy();
	}

	defineVolume(
		atlasWidth: number,
		atlasHeight: number,
		atlasColumns: number,
		atlasRows: number,
		atlasSliceNum: number,
		volumeSize: Array<number>,
	): void {
		const volumeChanged: boolean = !(
			this.atlasWidth == atlasWidth &&
			this.atlasHeight == atlasHeight &&
			this.atlasColumns == atlasColumns &&
			this.atlasRows == atlasRows &&
			this.atlasSliceNum == atlasSliceNum &&
			this.volumeSize != null &&
			this.volumeSize.join() == volumeSize.join()
		);

		if (!volumeChanged) {
			return;
		}

		this.atlasWidth = atlasWidth;
		this.atlasHeight = atlasHeight;
		this.atlasColumns = atlasColumns;
		this.atlasRows = atlasRows;
		this.atlasSliceNum = atlasSliceNum;
		this.volumeSize = volumeSize;

		if (this.sceneBoundingBoxes !== undefined) {
			// bounding box for volume renderer will have to be recreated
			clearScene(this.sceneBoundingBoxes);
			this.sceneBoundingBoxes = undefined;
			// outlines of the bounding box will have to be recreated as well
			this.lineBoxMesh = undefined;
		}
		this.resetCamera(); // template has changed, re-center camera for convenience
	}

	setShowBoundingBox(bShowBoundingBox: boolean): void {
		this.bShowBoundingBox = bShowBoundingBox;
	}

	setBackgroundColour(c: number = 0x000000): void {
		this.backgroundColour = c;
	}

	setCursor(cursor?: Array<number>): void {
		this.cursor = cursor;
	}

	/**
	 *getSceneBoundingBoxes returns a simple scene without shader materials.
	 *The only geometry inside are the bounding boxes of all volumes.
	 *(ATM this is only one boundingBox, derived from this.volumeSize)
	 */
	getSceneBoundingBoxes(): THREE.Scene {
		if (!this.sceneBoundingBoxes) {
			if (!this.volumeSize) {
				throw new Error('renderer.getSceneBoundingBoxes: volumeSize must not be null');
			}
			this.sceneBoundingBoxes = new THREE.Scene();

			const meshBBox = new THREE.Mesh(
				makeVolumeBox(this.volumeSize),
				undefined,
			);
			if (this.sceneBoundingBoxes) this.sceneBoundingBoxes.add(meshBBox);
		}
		return this.sceneBoundingBoxes;
	}

	/**
	 * getSceneNearPlane returns a scene with only one plane mesh. The plane is approximately where the near plane of the perspective camera is.
	 * It provides (backup) entry points for the volume shader when the bounding box is clipped away by the near plane.
	 * @param {*} camera The perspective camera used for all the rendering.
	 */
	getSceneNearPlane(camera: THREE.Camera): THREE.Scene {
		if (camera == undefined) {
			throw new Error('renderer.getSceneNearPlane: THREE.Camera is undefined');
		}
	
		if (this.sceneNearPlane == null) {
			this.sceneNearPlane = new THREE.Scene();
			this.sceneNearPlane.add(
				new THREE.Mesh(
					new THREE.PlaneGeometry(1, 1),
					undefined,
				)
			);
		}
		if (this.sceneNearPlane == undefined) {
			throw new Error('renderer.getSceneNearPlane: sceneNearPlane is undefined');
		}
		if (this.sceneNearPlane.children == undefined) {
			throw new Error('renderer.getSceneNearPlane: sceneNearPlane.children is undefined');
		}

		const meshNearPlane = this.sceneNearPlane.children[0];

		meshNearPlane.position.copy(camera.position); // move plane to camera origin
		const vecCameraDirection = new THREE.Vector3(0, 0, -1);
		vecCameraDirection.applyEuler(camera.rotation, camera.rotation.order);
		meshNearPlane.position.add(vecCameraDirection.multiplyScalar(1.0)); // translate plane to some point behind the near plane
		meshNearPlane.rotation.copy(camera.rotation); // rotate plane to align with near plane
		
		camera.near = 1.0; // set near plane to 1 b/c that's approximately where I draw my own plane
		return this.sceneNearPlane;
	}

	getAtlasTex(): THREE.DataTexture {
		if (this.atlasWidth == undefined || this.atlasHeight == undefined) {
			throw new Error('renderer.getAtlasTex: atlasWidth or atlasHeight undefined');
		}
		
		if (
			!this.atlasTex ||
			this.atlasTex.image.width != this.atlasWidth ||
			this.atlasTex.image.height != this.atlasHeight
		) {
			// Create Atlas Textures
			const atlasDataSize = this.atlasWidth * this.atlasHeight * 4;
			if (!this.atlasData || this.atlasData.length < atlasDataSize)
				this.atlasData = new Uint8Array(atlasDataSize);

			if (this.atlasTex) {
				this.atlasTex.dispose();
			}

			this.atlasTex = new THREE.DataTexture(
				this.atlasData,
				this.atlasWidth,
				this.atlasHeight,
				THREE.RGBAFormat,
				THREE.UnsignedByteType,
				THREE.UVMapping,
				THREE.ClampToEdgeWrapping,
				THREE.ClampToEdgeWrapping,
				THREE.LinearFilter,
				THREE.LinearFilter,
				1,
			);
		}
		return this.atlasTex;
	}

	getSceneVolumes(): THREE.Scene {
		const atlasTex = this.getAtlasTex();

		const rt_opaque = this.RenderPassOpaqueMesh.getRenderTarget(
			this.width,
			this.height,
		);
		const rt_depthBuffer = this.RenderPassDepthBuffer.getRenderTarget(
			this.width,
			this.height,
		);

		const rt_hologram = this.RenderPassHologramMesh.getRenderTarget(
			this.width,
			this.height,
		);

		const rt_exitPass = this.RenderPassExit.getRenderTarget(
			this.width,
			this.height,
			false,
		);
		const rt_entryPass = this.RenderPassEntry.getRenderTarget(
			this.width,
			this.height,
			true,
		);

		const rt_silhouette = this.RenderPassSilhouette.getRenderTargetPass2(this.width, this.height);
		const rt_silDepth = this.RenderPassSilhouette.getRenderTargetPass1(this.width, this.height); 

		if (
			!atlasTex ||
			!rt_exitPass ||
			!rt_entryPass ||
			!this.volumeSize ||
			!this.atlasColumns ||
			!this.atlasRows ||
			!this.tfTex ||
			!this.atlasSliceNum
		)
			return undefined; // FIXME: there should be a flow error here

		const stepLength =
			1.0 /
			Math.min(
				this.volumeSize[0],
				Math.min(this.volumeSize[1], this.volumeSize[2]),
			); // dependent on volume size

		if (!this.sm_volumes || !this.sceneVolumes) {
			this.sceneVolumes = new THREE.Scene();
			this.sm_volumes = new THREE.ShaderMaterial(shaderVolume());
			
			this.sm_volumes.uniforms.meshRendererTex.value = rt_opaque.texture;
			this.sm_volumes.uniforms.meshRendererDepthTex.value =
				rt_depthBuffer.depthTexture;
			this.sm_volumes.uniforms.tfTex.value = this.tfTex;

			this.sm_volumes.uniforms.hologramTex.value = rt_hologram.texture;

			atlasTex.needsUpdate = true;
			this.tfTex.needsUpdate = true;

			this.sm_volumes.uniforms.silhouetteTex.value = rt_silhouette;// rt_opaque.texture;
			this.sm_volumes.uniforms.silhouetteDepthTex.value = rt_silDepth.depthTexture;// rt_opaque.texture;

			this.meshVolumes = new THREE.Mesh( // this is a full screen quad
				new THREE.PlaneBufferGeometry(2, 2),
				this.sm_volumes,
			);
			this.meshVolumes.name = 'FullScreen Quad Volumes Scene';

			if (this.sceneVolumes != null) {
				this.sceneVolumes.add(this.meshVolumes);
				//this.sceneVolumes.add(lineBoxMesh);
				//this.sceneVolumes.add(cursorCrosshairMesh);
			} 

			if (this.sm_volumes) {
				this.sm_volumes.uniforms.channel0visible.value = false;
				this.sm_volumes.uniforms.channel1visible.value = false;
				this.sm_volumes.uniforms.channel2visible.value = false;
				this.sm_volumes.uniforms.channel3visible.value = false;
			}
		}

		if (!this.sm_volumes) 
			return;
		this.sm_volumes.uniforms.volumeSize.value = this.volumeSize;

		let rgb = [];
		if (this.backgroundColour != null) {
			//console.warn('BGCOL=', chroma(this.backgroundColour).gl());
			const rgba = chroma(this.backgroundColour).gl();
			rgb = rgba.slice(0, 3);
		}
		if (rgb.length == 3)
			this.sm_volumes.uniforms.backgroundColour.value = rgb;

		if (this.sm_volumes.uniforms.atlasTex.value != atlasTex) {
			this.sm_volumes.uniforms.atlasTex.value = atlasTex;
			this.sm_volumes.uniforms.atlasTex.value.needsUpdate = true;
		}

		this.sm_volumes.uniforms.backgroundTex.value = rt_exitPass.texture;
		this.sm_volumes.uniforms.foregroundTex.value = rt_entryPass.texture;
		this.sm_volumes.uniforms.atlasColumns.value = this.atlasColumns;
		this.sm_volumes.uniforms.atlasRows.value = this.atlasRows;
		this.sm_volumes.uniforms.atlasSliceNum.value = this.atlasSliceNum;
		this.sm_volumes.uniforms.stepLength.value = stepLength;
		//this.sm_volumes.uniforms.alphaCorrection.value = this.alphaCorrection; // the shader does not use this ATM

		const camera = this.getCamera(); // i do hope the camera is up-to-date at this point
		const matrix = new THREE.Matrix4();
		matrix.multiplyMatrices(
			camera.matrixWorld,
			matrix.getInverse(camera.projectionMatrix),
		);
		//matrix.multiplyMatrices( matrix.getInverse( camera.projectionMatrix ), camera.matrixWorld );
		if (this.sm_volumes)
			this.sm_volumes.uniforms.viewProjectionInverse.value = matrix;
	
		this.sceneVolumes.name = 'VolumesScene';
		return this.sceneVolumes;
	}

	/**resetCamera sets the camera back to its default position */
	resetCamera(): void {
		this.getCamera();
		this._initCamera();
		this.render();
	}

	/**_initCamera sets camera positions and cameraControls settings */
	_initCamera(): void {
		if (this.volumeSize == null || this.camera == null || this.cameraControls == null) {
			return;
		}
		const cam = this.camera;
		const cc: THREE.TrackballControls = this.cameraControls;

		const [volX, volY, volZ] = this.volumeSize;
		const volMax = Math.max(...this.volumeSize);
		//this.camera.position.z =  -max * 1.8;

		cam.position.set(
			volX / 2.0, // center the camera in x
			volY / 2.0, // center the camera in y
			-volMax * 1.3, // set the camera far into negative z
		);

		// flip y axis
		cam.up.x = 0;
		cam.up.y = -1;
		cam.up.z = 0;

		//do not use cam.lookAt, the cameraControls overwrite it
		cc.target = new THREE.Vector3(
			volX / 2.0,
			volY / 2.0,
			volZ / 2.0,
		);

		cc.rotateSpeed = 10.0;
		cc.zoomSpeed = 1.5;
		cc.panSpeed = 1;
		cc.noZoom = false;
		cc.noPan = false;
		cc.staticMoving = true;
		cc.dynamicDampingFactor = 0.3;

		if (getOS() == 'Mac OS') {
			cc.rotateSpeed = 3.0;
			cc.dynamicDampingFactor = 5.0;
		}

		cc.keys = [65, 83, 68];
	}

	/**getCamera creates the camera and its cameraControls, then returns the camera.
	 * It will fail with an error if volumeSize or canvas are null.
	*/
	getCamera(): THREE.PerspectiveCamera {
		if (!this.volumeSize || !this.canvas) {
			throw new Error('renderer.getCamera: volumeSize or canvas are undefined');
			//return undefined;
		}
		if (this.camera == null) {
			this.camera = new THREE.PerspectiveCamera(
				40,
				this.width / this.height,
				1.0, // this is where we draw the near plane for the entry points of the volume shader (was 100)
				Math.max(...this.volumeSize) * 3.0,
			);

			this.cameraControls = new THREE.TrackballControls(
				this.camera,
				this.canvas,
			);

			this.raycaster = new THREE.Raycaster();
			this.mouse = new THREE.Vector2();
			this.mouseDown = new THREE.Vector2();

			this._initCamera();

			//this.cameraControls.addEventListener( 'change', this.render );
		} else if (this.camera.aspect != this.width / this.height) {
			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();
		}

		if (this.cameraControls != null) {
			this.cameraControls.update();
		}
		return this.camera;
	}

	getDownsampledResultTargetTexture(): THREE.WebGLRenderTarget {
		if (!this.width || !this.height) return undefined;

		const twidth = this.width * this.downsamplefactor;
		const theight = this.height * this.downsamplefactor;
		if (
			!this.downsampledResultTargetTexture ||
			this.downsampledResultTargetTexture.width != twidth ||
			this.downsampledResultTargetTexture.height != theight
		) {
			// Final downsampled target
			this.downsampledResultTargetTexture = new THREE.WebGLRenderTarget(
				twidth,
				theight,
				{
					minFilter: THREE.LinearFilter,
					magFilter: THREE.LinearFilter,
					wrapS: THREE.ClampToEdgeWrapping,
					wrapT: THREE.ClampToEdgeWrapping,
					type: THREE.UnsignedByteType,
					generateMipmaps: false,
				},
			);
		}

		return this.downsampledResultTargetTexture;
	}

	getSceneDownsampledResultPass(): THREE.Scene {
		let downsampledResultTargetTexture = this.getDownsampledResultTargetTexture();
		if (!downsampledResultTargetTexture) return undefined;

		if (!this.sceneDownsampledResultPass) {
			this.materialDownsampledResult = new THREE.MeshBasicMaterial({
				map: downsampledResultTargetTexture.texture,
				depthWrite: false,
			});
			let meshDownsampledResult = new THREE.Mesh(
				new THREE.PlaneGeometry(2, 2, 1, 1),
				this.materialDownsampledResult,
			);

			this.sceneDownsampledResultPass = new THREE.Scene();
			this.sceneDownsampledResultPass.add(meshDownsampledResult);
		}
		if (this.materialDownsampledResult == null) {
			throw new Error('renderer.getSceneDownsampledResultPass: materialDownsampledResult is null');
		}
		this.materialDownsampledResult.map = downsampledResultTargetTexture.texture;

		return this.sceneDownsampledResultPass;
	}

	setConnectivityData(connectivityConnections: ?Array<Connection>, connectivityRegions: ?Array<Region>, connectivityIsDirected: ?{}, volumeSize: Array<number>) {
		if (this.volumeSize == null || this.canvas == null) { // safeguard for getCamera // TODO: remove
			return;
		}

		this.ConnectivityManager.setConnectivityData(connectivityConnections, connectivityRegions, connectivityIsDirected, this.getCamera(), this.volumeSize);
	}

	getLineBoxMesh(): THREE.LineSegments {
		if (this.volumeSize == undefined) {
			throw new Error('renderer.getLineBoxMesh: volumeSize must not be undefined');
			//return undefined;
		}

		if (this.lineBoxMesh == null) {
			const geo = new THREE.BufferGeometry();
			const x0 = 0;
			const x1 = this.volumeSize[0];
			const y0 = 0;
			const y1 = this.volumeSize[1];
			const z0 = 0;
			const z1 = this.volumeSize[2];
			// prettier-ignore
			const verts = new Float32Array([
				x0, y0, z0,   x1, y0, z0, // x - lines
				x0, y0, z1,   x1, y0, z1,
				x0, y1, z0,   x1, y1, z0,
				x0, y1, z1,   x1, y1, z1,

				x0, y0, z0,   x0, y1, z0, // y - lines
				x0, y0, z1,   x0, y1, z1,
				x1, y0, z0,   x1, y1, z0,
				x1, y0, z1,   x1, y1, z1,

				x0, y0, z0,   x0, y0, z1, // z - lines
				x0, y1, z0,   x0, y1, z1,
				x1, y0, z0,   x1, y0, z1,
				x1, y1, z0,   x1, y1, z1,
			]);

			geo.addAttribute('position', new THREE.BufferAttribute(verts, 3));
			this.lineBoxMesh = new THREE.LineSegments(
				geo,
				new THREE.LineBasicMaterial({
					color: '#ffffff',
					depthWrite: false,
					depthTest: false,
				}),
			);
		}

		if (this.lineBoxMesh == null) {
			throw new Error('renderer.getLineBoxMesh: lineBoxMesh is null');
		}
		const mesh = this.lineBoxMesh;
		if (this.backgroundColour !== undefined) {
			const lightness = chroma(this.backgroundColour).get('hsl.l');
			if (lightness < 0.5) {
				// white box
				mesh.material.color.setHex(0xffffff);
			} else {
				// black box
				mesh.material.color.setHex(0x000000);
			}
		}	

		return mesh;
	}

	getCursorCrosshairMesh(): THREE.LineSegments {
		if (!this.volumeSize) {
			throw new Error('renderer.getCursorCrosshairMesh: volumeSize must not be null');
		}
		if (!this.cursor) {
			return new THREE.LineSegments();
		}

		// if cursor is undefined set it right in the middle
		/*if(this.cursor == undefined)
			this.cursor = [this.volumeSize[0]/2, this.volumeSize[1]/2, this.volumeSize[2]/3];
			*/
		// DO NOT set the cursor in the renderer - if it is undefined then there is no cursor

		if (this.cursorCrosshairMesh == undefined) {
			const [vx, vy, vz] = this.volumeSize;
			const geo = new THREE.BufferGeometry();

			// prettier-ignore
			const verts = new Float32Array([
				0.0, 0.0, -vz,
				0.0, 0.0,  vz,
				0.0, -vy, 0.0,
				0.0,  vy, 0.0,
				-vx, 0.0, 0.0,
				vx, 0.0, 0.0,
			]);

			geo.addAttribute('position', new THREE.BufferAttribute(verts, 3));

			this.cursorCrosshairMesh = new THREE.LineSegments(
				geo,
				new THREE.LineBasicMaterial({
					linewidth: 1.0,
					color: '#ffff00',
					depthWrite: false,
					depthTest: false,
				}),
			);
		}

		const [px, py, pz] = this.cursor;
		this.cursorCrosshairMesh.position.set(px, py, pz);

		return this.cursorCrosshairMesh;
	}

	determineDownsamplingRate(): void {
		// accumulate the last couple of time differences and build an average
		// to smoothly vary the downsampling rate
		let timeDiffAvg = this.lastRenderTimeStamps.reduce((prev, curr) => {
			return prev + curr;
		});
		timeDiffAvg /= this.lastRenderTimeStamps.length;

		const timeDiffLowerBound = 67; // 50ms=20fps 67ms=15ps 100ms=10fps before starting to downsample 
		const downsamplefactorLowerLimit = 0.1;
		const downsamplefactorChangeRate = 0.05;

		if (timeDiffAvg <= timeDiffLowerBound && this.downsamplefactor < 1.0) {
			this.downsamplefactor += downsamplefactorChangeRate;
			//console.log("increasing factor to " + this.downsamplefactor)
		} else if (
			timeDiffAvg > timeDiffLowerBound &&
			this.downsamplefactor > downsamplefactorLowerLimit
		) {
			this.downsamplefactor -= downsamplefactorChangeRate;
			//console.log("decreasing factor to " + this.downsamplefactor)
		}

		if (this.downsamplefactor < downsamplefactorLowerLimit) {
			this.downsamplefactor = downsamplefactorLowerLimit;
		} else if (this.downsamplefactor > 1.0) {
			this.downsamplefactor = 1.0;
		}
	}

	getSceneOverlays(): THREE.Scene {
		if (this.sceneOverlays == null) {
			this.sceneOverlays = new THREE.Scene();
		}
		const scene: THREE.Scene = this.sceneOverlays;

		clearScene(scene);

		if (this.bShowBoundingBox) {
			const lineBoxMesh = this.getLineBoxMesh();
			if (lineBoxMesh !== undefined) {
				scene.add(lineBoxMesh);
			}
		}

		const cursorCrosshairMesh: THREE.LineSegments = this.getCursorCrosshairMesh();
		//if (cursorCrosshairMesh !== undefined) {
		scene.add(cursorCrosshairMesh);
		//}

		return scene;
	}

	// set objects for the THREE.Scene
	// this should be the only option to set triangle meshes for the renderer
	setObjects(objects: Array<THREE.TriangleMesh>): void {
		this.MeshSceneManager.setObjects(objects);
	}

	render(): void {
		const timestamp = Date.now();
		const timeDiff = timestamp - this.lastRenderTimeStamp;
		// Limit refresh rate to a maximum of ~30fps to avoid high GPU load
		if (timeDiff < 34) {
			//window.requestAnimationFrame(this.render);
			return;
		}
		this.lastRenderTimeStamp = timestamp;

		if (this.volumeSize == null || this.canvas == null) {
			return;
		}
		const camera: THREE.PerspectiveCamera = this.getCamera();
		const sceneNearPlane = this.getSceneNearPlane(camera);
		const sceneBoundingBoxes = this.getSceneBoundingBoxes();
		const sceneVolumes = this.getSceneVolumes();
		const rt_exitPass = this.RenderPassExit.getRenderTarget(
			this.width,
			this.height,
			false,
		);
		const rt_entryPass = this.RenderPassEntry.getRenderTarget(
			this.width,
			this.height,
			true,
		);

		const sceneOverlays = this.getSceneOverlays();

		// disabling sorting if necessary to be able to specify render order
		this.renderer.sortObjects = false;

		if (
			!(
				camera &&
				sceneBoundingBoxes &&
				sceneNearPlane &&
				rt_exitPass &&
				rt_entryPass &&
				sceneVolumes
			)
		) {
			return;
		}

		this.renderer.setRenderTarget(null);

		this.RenderPassEntry.renderEntryPoints(
			this.renderer,
			sceneBoundingBoxes,
			sceneNearPlane,
			camera,
			rt_entryPass,
		);
		this.RenderPassExit.renderExitPoints(
			this.renderer,
			sceneBoundingBoxes,
			camera,
			rt_exitPass,
		);

		this.renderer.setRenderTarget(null);

		// set scene visibilities with MeshSceneManager
		const sceneOpaque = this.MeshSceneManager.getScene('opaque');
		/**
		 * render opaque meshes to rt_opaque
		 */
		if (this.backgroundColour !== undefined) {
			this.renderer.setClearColor(this.backgroundColour);
		}
		const rt_opaque = this.RenderPassOpaqueMesh.getRenderTarget(
			this.width,
			this.height,
		);
		
		this.RenderPassOpaqueMesh.render(
			this.renderer,
			sceneOpaque,
			camera,
			rt_opaque,
		);

		this.renderer.setRenderTarget(null);

		this.renderer.setClearColor(0x000000); // reset background colour

		/**
		 * render opaque meshes to rt_depthBuffer
		 */
		let rt_depthBuffer = this.RenderPassDepthBuffer.getRenderTarget(
			this.width,
			this.height,
		);
		this.RenderPassDepthBuffer.render(
			this.renderer,
			sceneOpaque,
			camera,
			rt_depthBuffer,
		);

		this.renderer.setRenderTarget(null);
		



		// set scene visibilities with MeshSceneManager
		const sceneHologram = this.MeshSceneManager.getScene('hologram');

		if (this.backgroundColour !== undefined) {
			this.renderer.setClearColor(this.backgroundColour);
		}
		const rt_hologram = this.RenderPassHologramMesh.getRenderTarget(
			this.width,
			this.height,
		);


		this.RenderPassHologramMesh.render1(this.renderer, sceneHologram, camera, rt_hologram, false);
		this.renderer.autoClear = false;
		this.RenderPassHologramMesh.render1(this.renderer, sceneHologram, camera, rt_hologram, true);
		
		this.renderer.autoClear = true;
		this.renderer.setRenderTarget(null);
		/*** end hologram */		


		/*** render silhouettes */
		const sceneSilhouettes = this.MeshSceneManager.getScene('silhouetteAndCreases');

		const rt_silDepth = this.RenderPassSilhouette.getRenderTargetPass1(this.width, this.height);
		//const rt_silDepthBlur = this.RenderPassSilhouette.getRenderTargetPass1b(this.width, this.height);
		const rt_silhouette = this.RenderPassSilhouette.getRenderTargetPass2(this.width, this.height);

		this.RenderPassSilhouette.render1(this.renderer, sceneSilhouettes, camera, rt_silDepth);
		//this.RenderPassSilhouette.render1b(this.renderer, rt_silDepth.texture, this.cameraOrtho, rt_silDepthBlur);
		this.RenderPassSilhouette.render2(this.renderer, rt_silDepth.texture, rt_silDepth.depthTexture, this.cameraOrtho, rt_silhouette);

		this.renderer.setRenderTarget(null);
		/** END silhouette */

		if (this.mousePickingCallback) {
			// update the picking ray with the camera and mouse position
			this.raycaster.setFromCamera(this.mouse, this.camera);
			// calculate objects intersecting the picking ray
			const intersects = this.raycaster.intersectObjects(sceneOpaque.children, true);

			const out = intersects.map(v => {
				return {
					distance: v.distance,
					meshIdentifier: v.object.parent.name,
					point: v.point.toArray(),
				};
			});

			//console.log(intersects);
			this.mousePickingCallback(out);
		}

		/**
		 * render volumes
		 */
		this.cameraOrtho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		if (this.allowDownsampling) {
			this.determineDownsamplingRate();
			const sceneDownsampledResultPass = this.getSceneDownsampledResultPass();
			const downsampledResultTargetTexture = this.getDownsampledResultTargetTexture();

			if (downsampledResultTargetTexture && sceneDownsampledResultPass) {
				// render to the downsampled target
				this.renderer.setRenderTarget(downsampledResultTargetTexture);
				this.renderer.render(
					sceneVolumes,
					this.cameraOrtho,
				);
				// render the renderresult out
				this.renderer.setRenderTarget(null);
				this.renderer.render(
					sceneDownsampledResultPass,
					this.downsampledResultCamera,
				);
			}
		} else {
			// render at normal resolution
			this.renderer.render(sceneVolumes, this.cameraOrtho);
		}

		/** render overlays on top */
		this.renderer.autoClear = false;
		this.renderer.render(sceneOverlays, camera); // crosshair + white box
		this.renderer.autoClear = true;

		const sceneBrush = this.BrushAndMaskManager.getSceneBrush();
		this.renderer.autoClear = false;
		this.renderer.render(sceneBrush, camera);
		this.renderer.autoClear = true;

		const sceneMasks = this.BrushAndMaskManager.getMaskScene();
		this.renderer.autoClear = false;
		this.renderer.render(sceneMasks, camera);
		this.renderer.autoClear = true;

		/** render network scene  */
		const cameraPos: THREE.Vector3 = camera.position;
		const sceneNetwork = this.ConnectivityManager.getScene(cameraPos);
		this.renderer.autoClear = false;
		this.renderer.render(sceneNetwork, camera);
		this.renderer.autoClear = true;
		
		/** render other things that have custom material */
		const sceneCustomMaterial = this.MeshSceneManager.getScene('customMaterial');
		this.renderer.autoClear = false;
		this.renderer.render(sceneCustomMaterial, camera);//, undefined, false);
		this.renderer.autoClear = true;

		/** record render times for potential downsampling */
		const timeFrameRender = Date.now() - timestamp; // time to render this frame
		this.lastRenderTimeStamps[this.lastRenderTimeStampsIndex++] = timeFrameRender; // record the frame render time
		if (this.lastRenderTimeStampsIndex >= this.lastRenderTimeStamps.length) {
			this.lastRenderTimeStampsIndex = 0;
			//console.log("this.lastRenderTimeStamps", this.lastRenderTimeStamps)
		}
		
	}

	setSize(width: number, height: number) {
		this.width = width;
		this.height = height;
		this.renderer.setSize(width, height);

		//to keep the correct controls we need set the new resolution also in the cameraControls (Markus)
		//this is also to avoid the bug at the initialization when we use the 3d as first seen view... in which the parentsize
		//gives an faulty canvas size of 0, 0. Parentsize sets it to either 10, or like I did we provide a size.
		//But in the parent elements we used '90vw' as size, which cannot be handles by the trackball controller.
		//Wheter it is 0/0 or 90vw/60vw the result is a unusable trackball controller.
		//Setting the sizes here avoids the problem, but also changes the rotation and movement speed. This could be avoided like that:
		//if(typeof this.cameraControls.screen.height === 'string' || this.cameraControls.screen.height <= 10) {
		if (this.cameraControls != undefined)
			this.cameraControls.screen.height = height;
		//}
		//if(typeof this.cameraControls.screen.width === 'string' || this.cameraControls.screen.width <= 10) {
		if (this.cameraControls != undefined)
			this.cameraControls.screen.width = width;
		//}

		window.requestAnimationFrame(this.render);
	}

	setVolume(channel: number, img: ?HTMLImageElement): void {
		if (channel < 0 || channel >= 4) {
			console.warn('Tried to set Volume to not existing channel.', channel);
			return;
		}

		const atlasTex = this.getAtlasTex(); // <-- just to ensure everything is setup right
		if (!atlasTex) return;

		// if img is undefined set the channel to zero
		if (!img) {
			for (let i = 0; i < this.atlasWidth * this.atlasHeight * 4; i += 4) {
				this.atlasData[i + channel] = 0;
			}
			this.atlasBoundFiles[channel] = undefined;
			atlasTex.needsUpdate = true;
		} else {
			if (img.width != this.atlasWidth || img.height !== this.atlasHeight) {
				console.warn(
					'Image does not fit to the current atlas dimensions.',
					img.width,
					img.height,
				);
				return;
			}

			// Multiplex ImageData if img into the atlasData Array
			// then set atlasTex.needsUpdate = true to force the new upload of the texture

			this.atlasProcessQueue.queue.push({
				type: 'SET_VOLUME',
				img: img,
				channel: channel,
				step: 0,
				stepNum: 100,
			});

			this.atlasBoundFiles[channel] = {
				image: img.src,
				visible: true,
			};

			window.setTimeout(this.updateAtlas, 0);
		}
	}

	setTransferFunction(
		channel: number,
		tf: Uint8Array /* UInt8Array length 4*256 rgba*/,
	) {
		if (channel < 0 || channel >= 4) {
			console.warn(
				'Tried to set transfer function into not existing channel',
				channel,
			);
			return;
		}
		if (tf.length !== 256 * 4) {
			console.warn('transfer function must be of length 256*4');
			return;
		}

		// Copy transfer function
		const destOffset = channel * 256 * 4;
		for (let i = 0; i < 256 * 4; i++) {
			this.tfData[i + destOffset] = tf[i];
		}

		// force new data into the texture
		this.tfTex.needsUpdate = true;
	}

	// simple version to define a transferfunction without providing the full
	// look up table
	// creates a colour map interpolating between the three colours lightgrey->colorHex->lightgrey
	setAppearance(
		channel: number,
		colorHex: string,
		contrast: number,
		brightness: number,
		transparency: number,
		visible: boolean,
	) {
		if (visible) {
			const offset = channel * 256 * 4;
			/* const color = chroma(colorHex).gl();
			const fgColor = [0.9,0.9,0.9];
			const bgColor = [0.1,0.1,0.1]; */
			let from = 127 - 127 / contrast - brightness;
			let to = 127 + 128 / contrast - brightness;
			if (from < 0) from = 0;
			else if (from > 255) from = 255;
			if (to < 1) to = 1;
			else if (to > 256) to = 256;
			
			const brightHighlights = '#efefef';
			const desaturatedLow = '#000';
			// colour mixing in RGB colour space is just wrong... we'll use chroma instead! // TODO: test the colour scale
			//const scale = chroma.scale([neutral, colorHex, neutral]).mode('lrgb');
			//const scale = chroma.scale([neutral, colorHex, neutral]).domain([0,0.25,0.75,1]).mode('lrgb');
			const scale = chroma.scale([desaturatedLow, colorHex, brightHighlights]).domain([0,0.2,0.8,1]).mode('lrgb');
			//const scale = chroma.scale([neutral, colorHex, neutral]).mode('lrgb');
			//const scale = chroma.scale([colorHex, neutral]).domain([0,0.8,1]).mode('lab');
			//const scale = chroma.scale([neutral, colorHex, neutral]).mode('lrgb');
			//console.log(from, to)

			for (let i = 0; i < 256; i++) {
				let t = (i - from) / (to - from);
				if (t < 0.0) t = 0.0;
				else if (t > 1.0) t = 1.0;

				const c = scale(t).rgb();
				this.tfData[offset + i * 4 + 0] = c[0];
				this.tfData[offset + i * 4 + 1] = c[1];
				this.tfData[offset + i * 4 + 2] = c[2];
				
				// old color mixing
				/* if (t < 0.5) {
					let t1 = t * 2;
					this.tfData[offset + i * 4 + 0] =
						((1 - t1) * bgColor[0] + t1 * color[0]) * 255;
					this.tfData[offset + i * 4 + 1] =
						((1 - t1) * bgColor[1] + t1 * color[1]) * 255;
					this.tfData[offset + i * 4 + 2] =
						((1 - t1) * bgColor[2] + t1 * color[2]) * 255;
				} else {
					let t2 = (t - 0.5) * 2;
					this.tfData[offset + i * 4 + 0] =
						((1 - t2) * color[0] + t2 * fgColor[0]) * 255;
					this.tfData[offset + i * 4 + 1] =
						((1 - t2) * color[1] + t2 * fgColor[1]) * 255;
					this.tfData[offset + i * 4 + 2] =
						((1 - t2) * color[2] + t2 * fgColor[2]) * 255;
				} */
				// END old color mixing

				// set alpha to [0..1-transparency]
				this.tfData[offset + i * 4 + 3] = t * (1.0 - transparency) * 255;
			}
			if (this.sm_volumes != undefined)
				this.sm_volumes.uniforms['channel' + channel + 'visible'].value = 1;
		} else {
			// if not visible turn down the transfer function
			this.hideVolume(channel);
		}

		// force new data into the texture
		this.tfTex.needsUpdate = true;
	}
	setBrush(brush: ?Brush): void {
		this.BrushAndMaskManager.setBrush(brush);
	}
	setMasks(masks: ?Array<Mask>): void {
		this.BrushAndMaskManager.setMasks(masks);
	}

	setMousePickingCallback(
		mousePickingCallback: (
			intersects: Array<{
				point: Array<number>,
				meshIdentifier: string,
				distance: number,
			}>,
		) => void,
	): void {
		this.mousePickingCallback = mousePickingCallback;
	}

	// hide the volume of a given channel, this will just zeroing the
	// transferfunction
	hideVolume(channel: number): void {
		let offset = channel * 256 * 4;
		let limit = offset + 256 * 4;
		for (let i = offset; i < limit; i++) {
			this.tfData[i] = 0;
		}
		if (this.sm_volumes)
			this.sm_volumes.uniforms['channel' + channel + 'visible'].value = 0;
		this.tfTex.needsUpdate = true;
		if (this.atlasBoundFiles[channel]) {
			this.atlasBoundFiles[channel].visible = false;
		}
		window.requestAnimationFrame(this.render);
	}

	onMouseInteraction(e: MouseEvent): void {
		if (e) e.preventDefault();

		if (this.mousePickingCallback) {
			if (this.mouse === undefined) {
				console.log('Mouse undefined');
			} else {
				this.mouse.x = e.offsetX / this.width * 2 - 1;
				this.mouse.y = -(e.offsetY / this.height) * 2 + 1;
				//console.log(this.mouse);
			}
		}
		this.ConnectivityManager.updateConnectivityInScene(this.getCamera());
		window.requestAnimationFrame(this.render);
	}
	onMouseDown(e: Event): void {
		if (e) e.preventDefault();
		this.mouseDown.x = this.mouse.x;
		this.mouseDown.y = this.mouse.y;
		this.allowDownsampling = true;
		this.lastRenderTimeStamp = Date.now();
		window.requestAnimationFrame(this.render);
		
	}
	onMouseUp(e: Event): void {
		if (e) e.preventDefault();
		this.allowDownsampling = false;
		window.requestAnimationFrame(this.render);
		if(this.mouse.x==this.mouseDown.x && this.mouse.y==this.mouseDown.y){
			//console.log("this was a click");
		}else{
			//console.log("this was a pan");
			this.ConnectivityManager.updateConnectivityInScene(this.getCamera());
		}

	}
	onMouseOut(e: Event): void {
		if (e) e.preventDefault();
		this.allowDownsampling = false;
		window.requestAnimationFrame(this.render);
	}

	updateAtlas() {
		if (!this.imageDataCanvas)
			this.imageDataCanvas = document.createElement('canvas');
			
		if (this.atlasProcessQueue.currentJob) {
			// if there is a current job work on it
			let job = this.atlasProcessQueue.currentJob;
			if (
				!this.atlasBoundFiles[job.channel] ||
				this.atlasBoundFiles[job.channel].image != job.img.src
			) {
				delete this.atlasProcessQueue.currentJob;
				window.setTimeout(this.updateAtlas, 0); // Yield
			}

			/* if (!job.stepNum) {
				job.stepNum = 100;
				job.step = 0;
			} */

			const ctx = this.imageDataCanvas.getContext('2d');
			const minHeight = Math.floor(job.img.height / job.stepNum);
			let height = minHeight;
			if (job.step == job.stepNum - 1) {
				// the last slap might be of different hight because of flooring
				// height
				let y = job.step * height;
				height = job.img.height - y;
			}
			if (this.imageDataCanvas) {
				this.imageDataCanvas.width = job.img.width;
				this.imageDataCanvas.height = height;
			}
			ctx.drawImage(job.img, 0, -job.step * minHeight);
			const imgData = ctx.getImageData(0, 0, job.img.width, height);

			const offset = job.step * minHeight * job.img.width * 4;
			for (let i = 0; i < height * job.img.width * 4; i += 4) {
				this.atlasData[i + Number(job.channel) + offset] = imgData.data[i];
			}

			job.step++;
			if (job.step === job.stepNum) {
				// if job is finished
				this.atlasProcessQueue.currentJob = undefined;
			}
			const atlasTex = this.getAtlasTex();
			atlasTex.needsUpdate = true;
			if (job.step % 10 == 0) window.requestAnimationFrame(this.render); // show progress
			window.setTimeout(this.updateAtlas, 0); // Yield
		} else if (this.atlasProcessQueue.queue.length > 0) {
			// if there is a job in the queue make it current
			const [first, ...rest] = this.atlasProcessQueue.queue;
			this.atlasProcessQueue.currentJob = first;
			this.atlasProcessQueue.queue = rest;
			this.atlasProcessQueue.working = true;
			window.setTimeout(this.updateAtlas, 0); // Yield
		} else {
			// nothing to be done
			this.atlasProcessQueue.working = false;
		}
	}
}

/////////////////////////////////////////////////////////////
//
// Utility Funtions
//



// TODO: create a boundingBox from the volume boundingBox, not from volumeSize
function makeVolumeBox(volumeSize: Array<number>): THREE.BufferGeometry {
	let geo = new THREE.BufferGeometry();

	let v = volumeSize;
	// prettier-ignore
	let verts = new Float32Array([
		0, 		0, 		0,
		0, 		0, 		v[2],
		0, 		v[1], 0,
		0,		v[1], v[2],
		v[0], 0, 		0,
		v[0], 0,  	v[2],
		v[0], v[1], 0,
		v[0], v[1], v[2],
	]);

	geo.addAttribute('position', new THREE.BufferAttribute(verts, 3));
	//geo.addAttribute('texCoords', new THREE.BufferAttribute(texCoords, 3));

	// prettier-ignore
	let indices = new Uint32Array([
		0, 1, 3,
		0, 3, 2,
		1, 5, 7,
		1, 7, 3,
		4, 6, 7,
		4, 7, 5,
		0, 2, 6,
		0, 6, 4,
		2, 3, 7,
		2, 7, 6,
		0, 4, 5,
		0, 5, 1,
	]);

	geo.setIndex(new THREE.BufferAttribute(indices, 1));

	return geo;
}

