import * as THREE from 'three';
window.THREE = THREE;
import * as React from 'react';
import ReactDOM from 'react-dom';
import MultiVolumeRenderView from '../src';
import { AppContainer } from 'react-hot-loader';
import { maxHeaderSize } from 'http';
import { Resizable } from 'react-resizable';
import 'style-loader!css-loader!../node_modules/react-resizable/css/styles.css';
import { SketchPicker } from 'react-color';
THREE.OBJLoader = require('imports-loader?THREE=three!exports-loader?THREE.OBJLoader!../node_modules/three/examples/js/loaders/OBJLoader');


import { MeshStandardMaterial } from 'three';


//const manager = new THREE.LoadingManager();
const loader = new THREE.OBJLoader();
function loadObj (path) {
	return new Promise(function(resolve, reject) {
		loader.load(
			path,
			// success callback
			fetchedObject => {
				resolve(fetchedObject);
			},
			// progress callback
			(/* xhr */) => {
				/* if ( xhr.lengthComputable ) {
					var percentComplete = xhr.loaded / xhr.total * 100;
					console.log( Math.round(percentComplete, 2) + '% downloaded' );
				} */
			},
			// error callback
			xhr => {
				reject(xhr);
			},
		);
	});
}

/* var material = new THREE.MeshLambertMaterial({
	color: 0xfBfBff,
	//emissive: 0x050505,
	//emissiveIntensity: 0.7,
	transparent: true,
	opacity: 0.3,
	//colorWrite: false
});

var customUniforms = {
	glowColor: { type: "c", value: new THREE.Color(0xcf9999) }
};

var customMaterial = new THREE.ShaderMaterial(customBrainShader());
 */
class Test extends React.Component<{}, { meshes: Array<THREE.TriangleMesh> }> {
	constructor(props: {}) {
		super(props);
		this.state = {
			meshes_left: [],
			meshes_right: [],
			meshes: [],
			//volumeSize: [420.99679687,420.99679687,164],
			volumeSize: [120,80,120],
			connectivityConnections: [],
			connectivityRegions: [],
			connectivityIsDirected: {},
			brush: {},
			masks: [],
			widthR: 800,
			heightR: 800,
			templateColor: '#f00',
			brightness: 0,
			contrast: 1,
			transparency: 0.05,
		};
		this.changeTemplateSize = this.changeTemplateSize.bind(this);
		this.onResizeR = this.onResizeR.bind(this);
	}

	onResizeR (event, {element, size}) {
		this.setState({widthR: size.width, heightR: size.height});
	}
	changeTemplateSize() {
	}

	componentDidMount() {

		loadObj('models/Mouse_Simplifyed.obj')
			.then((triangleMesh)=>{
				var brain = new THREE.Mesh;
				brain = triangleMesh.children[0];
				//brain.material = customMaterial;
				//brain.renderOrder = 1;
				//brain.material.colorWrite = false;
				//scene.add( brain );
 
			/* 	var brainCopy = new THREE.Mesh;
				brainCopy = brain.clone();
				brainCopy.material = customMaterial.clone();
				brainCopy.renderOrder = 2;
				brainCopy.material.colorWrite = true;  */

				const m = this.state.meshes.slice();
				const ml = this.state.meshes_left.slice();
				const mr = this.state.meshes_right.slice();

				triangleMesh.children = [triangleMesh.children[0]];

				const mesh = triangleMesh.children[0];
				mesh.userData.id = 102;
				mesh.userData.txtLabel = 'Mouse Template Hologram';
				mesh.userData.color = new THREE.Vector3( 0.0, 0.0, 0.0 );
				mesh.userData.opacity = 0;
				//mesh.userData.position = new THREE.Vector3 (200, -200, 200);
				mesh.userData.renderStyles = ['hologram'];

				m.push(triangleMesh);
				ml.push(triangleMesh.clone());
				mr.push(triangleMesh.clone());

				this.setState({ meshes: m, meshes_left: ml, meshes_right: mr });
			}); 
	

		// load test network
		function loadFile(filePath) {
			var result = null;
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("GET", filePath, false);
			xmlhttp.send();
			if (xmlhttp.status==200) {
				result = xmlhttp.responseText;
			}
			return result;
		};

		new Promise((resolve, reject)=>{
			const connections = loadFile('./connections3.json');
			if (connections == undefined) {
				reject('connections == undefined');
			}
			const regions = loadFile('./regions3.json');
			if (regions == undefined) {
				reject('regions == undefined');
			}

			const connectivityConnections = JSON.parse(connections);
			const connectivityRegions = JSON.parse(regions);

			this.setState({
				connectivityIsDirected: {"#121:0": true},
				connectivityConnections,
				connectivityRegions,
			});
			resolve();
		});
		
	}

	render() {

		return(
			<div>
				<button onClick={this.changeTemplateSize}>debug: change template size</button>
							
				<div style={{display:'flex'}}>
		
					{/* <SketchPicker color={ window.color1 } onChange={ (c)=>window.color1 = c } /> */}
				</div>
				{/* <canvas ref={(c)=>{this.canvas = c}} width={800} height={20} ></canvas> */}
				
				<MultiVolumeRenderView
					rendererID={'bottom'}
					volumeSize={ [140,80,120] }
					//imageURLs={ ['4096.jpg']}
					atlasGrid={ [10, 9]}
					sliceNum={ 90 }
					atlasSize={ {width:4090, height:4095} }
					colors={[this.state.templateColor]} // '#888' is not so bad on white
					contrasts={[this.state.contrast]}
					brightnesses={[this.state.brightness]}
					transparencies={[0.965]}
					visibilities={[true]} 
					width={1020}
					height={800}
					meshes={this.state.meshes}
					showBoundingBox={true}
					backgroundColour={0x151515}
					showTextbookLabels={false}
					mousePickingCallback={()=>{}}
					connectivityConnections={this.state.connectivityConnections}
					connectivityRegions={this.state.connectivityRegions}
					connectivityIsDirected={this.state.connectivityIsDirected}
					brush={this.state.brush}
					masks={this.state.masks}
				/>
			</div>
		);
	}
}

const element = document.getElementById('reactContainer');
if (element == null) {
	throw new Error('React container not found');
}

ReactDOM.render(
	<AppContainer>
		<Test/>
	</AppContainer>,
	element
);