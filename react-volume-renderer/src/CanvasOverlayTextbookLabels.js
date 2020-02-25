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

import * as React from 'react';
import styles from './CanvasOverlayTextbookLabels.css';
import type Renderer from './renderer';
//import type THREE from 'three';
import * as THREE from 'three'; 
import type { Region } from './flowTypes';

type Props = {
	width: number,
	height: number,
	renderer: Renderer,
	meshes: Array<THREE.Mesh>,
	regions: Array<Region>,
};
type State = {
	hasEventListener: boolean,
	cameraControls: ?THREE.TrackballControls,
};

export default class CanvasOverlayTextbookLabels extends React.Component<Props, State> {
	
	handleChange: ()=>void;
	registerEventListener: ()=>void;
	delayedUpdate: ?TimeoutID;
	
	constructor(props: Props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
		this.registerEventListener = this.registerEventListener.bind(this);
		this.state = {
			hasEventListener: false,
			cameraControls: undefined,
		};
	}

	handleChange() {

		this.forceUpdate();

		// fast moves of the camera may not trigger a handleChange
		if (this.delayedUpdate != null) {
			clearTimeout(this.delayedUpdate);
		}
		this.delayedUpdate = setTimeout(()=>{this.forceUpdate();}, 400);
	}

	shouldComponentUpdate(nextProps: Props/* , _nextState */) {
		if (this.props.width !== nextProps.width || this.props.height !== nextProps.height) {
			if (this.delayedUpdate != null) {
				clearTimeout(this.delayedUpdate);
			}
			this.delayedUpdate = setTimeout(()=>{this.forceUpdate();}, 30);
			return false;
		}
		return true;
	}

	componentWillUnmount() {
		
		if (this.delayedUpdate != null) {
			clearTimeout(this.delayedUpdate);
		}
		if (this.state.cameraControls) {
			this.state.cameraControls.removeEventListener('change', this.handleChange);
		}
		this.setState({ hasEventListener: false, cameraControls: undefined });
	}

	registerEventListener() {

		const { renderer } = this.props;

		if (this.state.hasEventListener || !renderer || !renderer.camera || !renderer.cameraControls) {
			return;
		}

		renderer.cameraControls.addEventListener('change', this.handleChange);
		this.setState({ hasEventListener: true, cameraControls: renderer.cameraControls });
	}

	componentDidMount() {
		this.registerEventListener();
	}
	
	componentDidUpdate() {
		this.registerEventListener();
	}

	getMeshLabels(camera: THREE.Camera, meshes: Array<THREE.Mesh>, widthHalf: number, heightHalf: number): Array<React.Node> | React.Node {
		if (!meshes || meshes.length<1 || !meshes[0].children[0].geometry.boundingSphere) {
			return (<div/>);
		}

		return meshes.map((v,k)=>{

			if (!v.children['0'].geometry.boundingSphere) {
				return (<span key={k} />);
			}

			const pos = v.children['0'].geometry.boundingSphere.center.clone();
			const txtLabel = v.children['0'].userData.txtLabel;
			pos.project(camera);

			pos.x = (pos.x * widthHalf) + widthHalf;
			pos.y = - (pos.y * heightHalf) + heightHalf;
			pos.z = 0;

			return (
				<span key={'m'+k} style={{top:pos.y, left:pos.x}} className={styles.textbooklabel}>
					{txtLabel}
				</span>
			);
		});
	}

	getNetworkRegionLabels(camera: THREE.Camera, regions: Array<Region>, widthHalf: number, heightHalf: number): Array<React.Node> | React.Node {
		if (!regions || regions.length<1) {
			return (<div/>);
		}
		return regions.map((v,k)=>{

			if (!v.CenterNodeCoordinates) {
				return (<span key={k} />);
			}

			var regionCoordinates = v.CenterNodeCoordinates.split(",");

			const pos = new THREE.Vector3( regionCoordinates[0], regionCoordinates[1], regionCoordinates[2] );
			const txtLabel =  v.ShortName;
			pos.project(camera);

			pos.x = (pos.x * widthHalf) + widthHalf;
			pos.y = - (pos.y * heightHalf) + heightHalf;
			pos.z = 0;

			return (
				<span key={'r'+k} style={{top:pos.y, left:pos.x}} className={styles.textbooklabel}>
					{txtLabel}
				</span>
			);
		});
	}

	render() {
		const { renderer, meshes, regions, width, height } = this.props;

		if (!renderer || !renderer.camera) {
			return (<div/>);
		}

		const widthHalf = width / 2;
		const heightHalf = height / 2;

		const meshLabels = this.getMeshLabels(renderer.camera, meshes, widthHalf, heightHalf);
		const networkRegionLabels = this.getNetworkRegionLabels(renderer.camera, regions, widthHalf, heightHalf);
		
		return (
			<div style={{pointerEvents:'none',position:'absolute',width:width,height:height,overflow:'hidden'}}>
				{meshLabels}
				{networkRegionLabels}
			</div>
		);
	}
}
