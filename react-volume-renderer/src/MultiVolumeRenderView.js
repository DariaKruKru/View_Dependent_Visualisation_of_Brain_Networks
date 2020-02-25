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

import * as React from 'react';
import Renderer from './renderer';
import type { Brush, Mask, Region, Connection } from './flowTypes';
import CanvasOverlayTextbookLabels from './CanvasOverlayTextbookLabels';
import styles from './CanvasOverlayButton.css';
import type THREE from 'three';

type Props = {
	width: number,
	height: number,
	rendererID?: ?string, // you may set this to a certain string for all your renderers, they will RE-USE the renderer over multiple tabs TODO: EXPERIMENTAL

	volumeSize?: Array<number>, // e.g. [420.5, 420.53, 165.0]
	atlasGrid?: Array<number>, // rows and colums of the slice atlas e.g. [12, 14]
	atlasSize: { width: number, height: number }, // resolution of the atlas, e.g. {width:4096, height:4096}

	meshes: Array<THREE.TriangleMesh>, // these are mesh objects which will be rendered by mesh shaders

	imageURLs: Array<string>,
	colors: Array<string>, // colors: array of hex strings
	contrasts: Array<number>,
	brightnesses: Array<number>,
	transparencies: Array<number>,
	visibilities: Array<boolean>,

	sliceNum?: number, // not sure what that is...

	cursor?: Array<number>, // Position of the cursor: [120.01, 98.23, 12.7]
	brush?: Brush,
	masks?: Array<Mask>,

	showTextbookLabels: boolean,
	showBoundingBox: boolean,
	backgroundColour: number,

	mousePickingCallback: (intersects: Array<{
		point: Array<number>,
		meshIdentifier: string,
		distance: number,
	}>,) => void,
	
	//Brain Connectivity Data
	connectivityConnections?: Array<Connection>,
	connectivityRegions?: Array<Region>,
	connectivityIsDirected?: {},
};
type State = { flashWarn: ?string };
type RenderListItem = ?{
	url: string,
	contrast: number,
	brightness: number,
	transparency: number,
	visible: boolean,
	color: string,
};
type RenderList = { [slot_id: number]: RenderListItem, maxSlots: number }; // the programmer must ensure that a slot is not undefined at runtime


export default class MultiVolumeRenderView extends React.Component<Props, State> {
	canvas: ?HTMLCanvasElement;
	renderList: RenderList;
	doesRenderURL: (url: string) => number;
	freeRenderSlot: () => number;
	resetCamera: () => void;
	renderer: ?Renderer;
	flashTimeout: ?TimeoutID;
	rendererID: string;

	static defaultProps = {
		showTextbookLabels: false,
		backgroundColour: 0x000000,
	};

	constructor(props: Props) {
		super(props);

		// renderlist with four slots
		this.renderList = { maxSlots: 4 };
		this.renderList[0] = undefined;
		this.renderList[1] = undefined;
		this.renderList[2] = undefined;
		this.renderList[3] = undefined;
		
		this.doesRenderURL = this.doesRenderURL.bind(this);
		this.freeRenderSlot = this.freeRenderSlot.bind(this);
		this.resetCamera = this.resetCamera.bind(this);

		this.rendererID = props.rendererID != undefined ? props.rendererID : Math.random().toString(36).substring(7);
		//this.updateRenderList = this.updateRenderList.bind(this); // Does not appear to be necessary for some reason!
		//
		this.state = {
			flashWarn: undefined,
		};
	}

	render() {
		let flash;
		if (this.state.flashWarn) {
			flash = <div className={styles.flash}>{this.state.flashWarn}</div>;
		}
		let canvasOverlayTextbookLabels;
		let canvasOverlayTextbookNetwork;
		if (this.props.showTextbookLabels &&
			 this.renderer != null
			 ) {
				 const connectivityRegions = this.props.connectivityRegions == null ? [] : this.props.connectivityRegions;
			canvasOverlayTextbookLabels = (
				<CanvasOverlayTextbookLabels
					renderer={this.renderer}
					meshes={this.props.meshes}
					regions={connectivityRegions}
					width={this.props.width}
					height={this.props.height}
				/>
			);
		}
		return (
			<div>
				{canvasOverlayTextbookLabels}
				<div style={{ position: 'absolute', padding: '2px' }}>
					<button
						type="button"
						className={'btn ' + styles.btnCanvasOverlay}
						onClick={this.resetCamera}
					>
						<span className="glyphicon glyphicon-home" aria-hidden="true" />
					</button>
					{flash}
				</div>
				<canvas
					ref={canvas => {
						this.canvas = canvas;
					}}
				/>
			</div>
		);
	}

	componentDidMount() {
		// Init renderer
		this.initRenderer();
		if (this.renderer) {
			this.renderer.render();
		}
		if (this.renderer) {
			this.renderer.setSize(this.props.width, this.props.height);
		}
	}

	componentDidUpdate() {
		this.updateRendererProps(this.props);
		if (this.renderer) {
			this.renderer.setSize(this.props.width, this.props.height);
		}

		// Render
		if (this.renderer) {
			this.renderer.render();
		}
	}
	/* 
	componentWillUnmount() {
		// We will never destroy old renderers now because they MAY be RE-USED somewhere
		if (this.renderer) {
			this.renderer.destroy();
		}
		this.renderer = undefined;
	} */
	/* 
	UNSAFE_componentWillReceiveProps(nextProps: Props) {
		//this.updateRendererProps(nextProps);

		if (
			this.renderer &&
			(nextProps.width !== this.props.width ||
				nextProps.height !== this.props.height) &&
			nextProps.height &&
			nextProps.width
		) {
			this.renderer.setSize(nextProps.width, nextProps.height);
		}
	} */

	initRenderer() {
		if (this.canvas) {
			if (window.renderers == undefined) {
				window.renderers = {};
			}
			if (window.renderers != null && window.renderers[this.rendererID] != undefined) {
				this.renderer = window.renderers[this.rendererID];
			} else {
				this.renderer = new Renderer(
					this.canvas,
					this.props.width,
					this.props.height,
				);
				window.renderers[this.rendererID] = this.renderer; // keep this object global so it may be RE-USED in different pages
			}
		}

		this.updateRendererProps(this.props);
	}

	doesRenderURL(url: string): number {
		for (let i = 0; i < this.renderList.maxSlots; i++) {
			const x = this.renderList[i];
			if (x != null && x.url === url) return i;
		}
		return -1;
	}

	freeRenderSlot(): number {
		for (let i = 0; i < this.renderList.maxSlots; i++) {
			if (this.renderList[i] == undefined) return i;
		}
		return -1;
	}

	resetCamera() {
		if (this.renderer) {
			this.renderer.resetCamera();
		}
	}

	// set new Volume if something has changed
	updateRenderList(
		imageURLs: Array<string>,
		colors: Array<string>,
		contrasts: Array<number>,
		brightnesses: Array<number>,
		transparencies: Array<number>,
		visibilities: Array<boolean>,
	) {
		//function DEBUGlogRL(msg, rl) {
		//	console.log('RENDERLIST ',msg, ': [\n', 
		//			rl[0] ? rl[0].url : 'nil','\n',
		//			rl[1] ? rl[1].url : 'nil','\n',
		//			rl[2] ? rl[2].url : 'nil','\n',
		//			rl[3] ? rl[3].url : 'nil','\n]');
		//}

		//DEBUGlogRL('INIT', this.renderList);
		

		if (
			!(
				imageURLs &&
				colors &&
				contrasts &&
				brightnesses &&
				transparencies &&
				visibilities
			)
		) {
			// do nothing if a value is missing
			console.error("MultiVolumeRenderView updateRenderList value missing")
			return;
		}

		// remove images from renderlist that are not found in the new imageURLs or if the found image is not visible
		for (let i = 0; i < this.renderList.maxSlots; i++) {
			if (this.renderList[i]) {
				const idx = imageURLs.indexOf(this.renderList[i].url);
				if (idx == -1 || !visibilities[idx]) {
					if (this.renderer) this.renderer.hideVolume(i);
					if (this.renderer) this.renderer.setVolume(i, undefined);
					this.renderList[i] = undefined;
				}
			}
		}

		//DEBUGlogRL('After Remove', this.renderList);

		for (let index = 0; index < imageURLs.length; index++) {
			const url = imageURLs[index];
			const color = colors[index];
			const contrast = contrasts[index];
			const brightness = brightnesses[index];
			const transparency = transparencies[index];
			const visible = visibilities[index];

			if (!visible) continue;


			const idx = this.doesRenderURL(url);
			const item = this.renderList[idx];
			if (item != null) {
				//let item = this.renderList[idx];
				if (
					color != item.color ||
					contrast != item.contrast ||
					brightness != item.brightness ||
					transparency != item.transparency ||
					visible != item.visible
				) {
					item.contrast = contrast;
					item.brightness = brightness;
					item.transparency = transparency;
					item.visible = visible;

					if (this.renderer)
						this.renderer.setAppearance(
							idx,
							color,
							contrast,
							brightness,
							transparency,
							visible,
						);
				}
			} else {
				// doesNotRenderURL
				const freeId = this.freeRenderSlot();
				if (freeId >= 0) {
					this.renderList[freeId] = {
						url,
						color,
						contrast,
						brightness,
						transparency,
						visible,
					};
					const img = new Image();
					img.onload = () => {
						if (this.renderer) this.renderer.setVolume(freeId, img);
						if (this.renderer)
							this.renderer.setAppearance(
								freeId,
								color,
								contrast,
								brightness,
								transparency,
								visible,
							);
					};
					img.src = url;
				} else {
					this.setState({
						flashWarn: 'Only four images can be rendered at the same time!',
					});
					if (this.flashTimeout) clearTimeout(this.flashTimeout);
					this.flashTimeout = setTimeout(
						() => this.setState({ flashWarn: undefined }),
						10000,
					);
				}
			}
		}
	}

	updateRendererProps(props: Props) {
		if (
			this.renderer &&
			props.atlasSize &&
			props.atlasGrid &&
			props.sliceNum &&
			props.volumeSize
		) {
			this.renderer.defineVolume(
				props.atlasSize.width,
				props.atlasSize.height,
				props.atlasGrid[0],
				props.atlasGrid[1],
				props.sliceNum,
				props.volumeSize,
			);
		}
		
		this.updateRenderList(
			props.imageURLs,
			props.colors,
			props.contrasts,
			props.brightnesses,
			props.transparencies,
			props.visibilities,
		);
		
		if (this.renderer) {
			const r: Renderer = this.renderer;

			r.setObjects(props.meshes);
			r.setCursor(props.cursor);
			r.setShowBoundingBox(props.showBoundingBox);
			r.setBackgroundColour(props.backgroundColour);
			r.setMousePickingCallback(props.mousePickingCallback);
			r.setBrush(props.brush);
			r.setMasks(props.masks);
			
			//pass Brainconnectivity Data to the renderer
			r.setConnectivityData(props.connectivityConnections, props.connectivityRegions, props.connectivityIsDirected);
		}
	}
}