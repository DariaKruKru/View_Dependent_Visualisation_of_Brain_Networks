import * as THREE from 'three';
window.THREE = THREE;

require('three/examples/js/loaders/GLTFLoader.js');
require('three/examples/js/loaders/OBJLoader.js');
require('three/examples/js/controls/OrbitControls.js');

require('three/examples/js/libs/stats.min.js');
require('three/examples/js/utils/GeometryUtils.js');

require('three/examples/js/lines/LineSegmentsGeometry.js');
require('three/examples/js/lines/LineGeometry.js');
require('three/examples/js/lines/WireframeGeometry2.js');
require('three/examples/js/lines/LineMaterial.js'); 
require('three/examples/js/lines/LineSegments2.js');
require('three/examples/js/lines/Line2.js');

var dat = require ('three/examples/js/libs/dat.gui.min.js');

export default THREE;
import { customBrainShader } from '../src/shaders/customBrainShader.js';
import { MeshStandardMaterial } from 'three';


var brain = new THREE.Mesh;
var brainCopy = new THREE.Mesh;
const brainSize = new THREE.Vector3;
var scene = new THREE.Scene();
var connectivityIsDirected = true;
var loaderOBJ = new THREE.OBJLoader().setPath( 'models/' );

var width = window.innerWidth;
var height = window.innerHeight;
var camera = new THREE.PerspectiveCamera( 75, width / height, 0.1, 1000 );
//var camera = new THREE.OrthographicCamera(window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 1, 1000);
camera.position.set(0,20,110);
//camera.lookAt(scene.position);	
scene.add(camera);


//fog, show the depth of connection
var gui = new dat.GUI();
var fogGui = gui.addFolder('Fog');

class FogGUIHelper {
    constructor(fog, backgroundColor) {
      this.fog = fog;
      this.backgroundColor = backgroundColor;
    }
    get near() {
      return this.fog.near;
    }
    set near(v) {
      this.fog.near = v;
      this.fog.far = Math.max(this.fog.far, v);
    }
    get far() {
      return this.fog.far;
    }
    set far(v) {
      this.fog.far = v;
      this.fog.near = Math.min(this.fog.near, v);
    }
    get color() {
      return `#${this.fog.color.getHexString()}`;
    }
    set color(hexString) {
      this.fog.color.set(hexString);
      this.backgroundColor.set(hexString);
    }
}

const near = 0.000001;
const far = 350;
var fogColor = new THREE.Color(0x121212);
const color = fogColor;
scene.fog = new THREE.Fog(color, near, 270);
scene.background = new THREE.Color(color);

const fogGUIHelper = new FogGUIHelper(scene.fog, scene.background);
fogGui.add(fogGUIHelper, 'near', near, far).listen();
fogGui.add(fogGUIHelper, 'far', near, far).listen();
fogGui.addColor(fogGUIHelper, 'color');
fogGui.open();

//cuvature parameters conttrol
var curvatureParameter = 1;
var curveWidthParameter = 1;
var curvesGui = gui.addFolder('Curves Parameters');
var curveParams = {
	curvature: 1,
	curveWidth: 1
};
curvesGui.add(curveParams, 'curvature',0,2).step(0.01).listen();
curvesGui.add(curveParams, 'curveWidth',0,2).step(0.01).name('width').listen();
curvesGui.open();


var controls = new THREE.OrbitControls( camera );
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;
controls.target.set( 0, - 0.2, - 0.2 );
controls.addEventListener( 'change', render );

var resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
//renderer.setClearColor("rgb(10, 10, 10)");
renderer.setFaceCulling (true);
document.body.appendChild( renderer.domElement );

 
/* var geometry = new THREE.CircleGeometry( 2, 16 );
//var material = new THREE.MeshBasicMaterial( { color: 0xa7ba00 } );
var material = new THREE.LineBasicMaterial( { color: 0xcccc22 } );
var circle = new THREE.Mesh( geometry, material );
circle.position.set(-42,10,23);
scene.add( circle ); */


//LIGHTING

//var keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
//keyLight.position.set(-100, 0, 100);

var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
fillLight.position.set(100, 0, 100);

var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
backLight.position.set(100, 0, -100).normalize();

var ambientLight = new THREE.AmbientLight(0x91919a);
scene.add(ambientLight);

//scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);

//3D MESHES

var material = new THREE.MeshLambertMaterial({
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

/* var loaderGLTF = new THREE.GLTFLoader().setPath( 'models/' );
loaderGLTF.load( 'isosphere.gltf', function ( gltf ) {
 //loaderGLTF.load( 'MouseBrain_OneMesh.gltf', function ( gltf ) {
	gltf.scene.traverse( function ( child ) {

			
			child.material = customMaterial;
			isosphere = child.children[0];
			isosphere.scale.set(4,4,4);
			//console.log(child);
			//child.visible = false;	

			//scene.add(child)	
	} );
	//gltf.scene.children[0].children[0].visible = false;
	scene.add(isosphere);
} );  */

//LOAD THE BRAIN
loaderOBJ.load('oneMeshSimplifyed_2.obj', function ( object ) {
	brain = object.children[0];
	brain.material = customMaterial;
	brain.renderOrder = 1;
    brain.material.colorWrite = false;
	//scene.add( brain );

	brain.geometry.computeBoundingBox();
	var boundBox = brain.geometry.boundingBox.clone();

	var material = new THREE.LineBasicMaterial({
		color: 0x0000ff
	});
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		boundBox.max,
		boundBox.min
	);

	var geometry2 = new THREE.Geometry();
	geometry2.vertices.push(
		new THREE.Vector3(boundBox.max.x -127, boundBox.max.y, boundBox.max.z),
		new THREE.Vector3(boundBox.min.x +127, boundBox.min.y, boundBox.min.z)
	);
	
	var line = new THREE.Line( geometry, material );
	var line2 = new THREE.Line( geometry2, material );
	scene.add( line );
	scene.add( line2 );
	
	boundBox.getSize(brainSize);
	var box = new THREE.BoxHelper( brain, 0xffff00 );
	scene.add( box );

	brainCopy = brain.clone();
	brainCopy.material = customMaterial.clone();
	brainCopy.renderOrder = 2;
	brainCopy.material.colorWrite = true;
	scene.add( brainCopy );

	var center = new THREE.Vector3();
	brain.geometry.computeBoundingBox();
	brain.geometry.boundingBox.getCenter(center);
	brain.geometry.center();
	//return brain;
} ); 


//NODES and regions' shapes 
var regionsShapes = [];

class Node {
    constructor(regionName = noName, position = new THREE.Vector3(0, 0, 0), color = new THREE.Color(0xaaaaaa), strength = 1) {
        this.regionName = regionName;
		this.position = position;
		this.nodeColor = color;
		this.strength = strength;
	}
	
	DrawNode(){
		var geometry = new THREE.SphereGeometry( 1.8*this.strength, 32, 32);
		var nodeMaterial = new THREE.MeshBasicMaterial( { color: this.nodeColor });
		var sphere = new THREE.Mesh( geometry, nodeMaterial );
		sphere.position.set(this.position.x,this.position.y, this.position.z);
		scene.add( sphere );
		var outlineMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, side: THREE.BackSide } );
		var outlineMesh = new THREE.Mesh( geometry, outlineMaterial );
		outlineMesh.position.set(this.position.x,this.position.y, this.position.z);
		outlineMesh.scale.multiplyScalar(1.1);
		scene.add( outlineMesh );
	};

	LoadRegion (fileName, position = this.position, color = this.nodeColor){
		loaderOBJ.load(fileName, function ( object ) {
			var region = new THREE.Mesh;
			region = object.children[0];
	
			var center = new THREE.Vector3();
			region.geometry.computeBoundingBox();
			region.geometry.boundingBox.getCenter(center);
			region.geometry.center();
			region.position.copy(center);
	
			region.material = customMaterial.clone();
			region.position.set(position.x, position.y, position.z);
			region.material.uniforms.glowColor.value = color;
			scene.add( region );
			regionsShapes.push (region);
		} );
	}
}

const node1 = new Node('region1', new THREE.Vector3(5, 0, 10), new THREE.Color(0x5555fa));
node1.DrawNode();//blue
node1.LoadRegion('L_100_mesh_51.obj'); 
const node2 = new Node('region2', new THREE.Vector3(-42,10,23), new THREE.Color(0xcccc22));
node2.DrawNode(); //yellow
node2.LoadRegion('L_100_mesh_119.obj'); 
const node3 = new Node('region3', new THREE.Vector3(-8,-12,35), new THREE.Color(0xc55a349));
node3.DrawNode(); //light green
node3.LoadRegion('L_100_mesh_38.obj');
const node4 = new Node('region4', new THREE.Vector3(36, 1, 21), new THREE.Color('pink'));
node4.DrawNode(); //LavenderBlush 
node4.LoadRegion ('L_100_mesh_218.obj');
const node5 = new Node('region5', new THREE.Vector3(-2, 21, 39), new THREE.Color(0xcaaaa));
node5.DrawNode();//teal
node5.LoadRegion('L_100_mesh_311.obj');
const node6 = new Node('region6', new THREE.Vector3(-20, 20, -20), new THREE.Color(0xfaad70));
node6.DrawNode();//orange
node6.LoadRegion('R_100_mesh_637.obj');
const node7 = new Node('region7', new THREE.Vector3(26, -9, -25), new THREE.Color(0x05858C));
node7.DrawNode();//teal2
node7.LoadRegion('R_100_mesh_701.obj');


//white center of the brain
const centerBrain = new Node('center', new THREE.Vector3(0,0,0), new THREE.Color(0xffffff));
centerBrain.DrawNode();


//NETWORKS

var maxDist = 400; //calculate distance between tho the farest poits of the brain
var maxD = 45; //define the biggest curvature (length)
var maxDistCenter;
var showedLines = [];
 
function getScreenCoordinates (point) {

	var p1 = point.clone();
	camera.updateMatrixWorld();
	p1.project(camera);
	p1.x = ( p1.x + 1) * width / 2;
	p1.y = - ( p1.y - 1) * height / 2;
	//p1.z = 0;
	return p1;
};

//this is needed for previous failed method – define curve in 2D and unproject in 3D

function Draw2DCircle(point){
	var geometry = new THREE.CircleGeometry( 1, 16 );
	var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
	var circle = new THREE.Mesh( geometry, material );
	circle.position.set(point.x, point.y, point.z);
	scene.add( circle ); 
	showedLines.push(circle);
}

var cameraDist = 117;

function GetIntermediatePoints(startPoint, endPoint){
	cameraDist = Math.sqrt(Math.pow(camera.position.x ,2) + Math.pow(camera.position.y ,2) + Math.pow(camera.position.z,2));
	var connectionVector = new THREE.Vector3;
	connectionVector.subVectors(startPoint, endPoint); //hypothetical straight line between the nodes
	//find center point between the nodes
	var centralPoint = new THREE.Vector3((startPoint.x + endPoint.x) /2, (startPoint.y + endPoint.y) /2, (startPoint.z + endPoint.z) /2);

	var intPoint1= new THREE.Vector3;
	var intPoint2 = new THREE.Vector3;

	var screenStartPoint = getScreenCoordinates (startPoint);
	var screenEndPoint = getScreenCoordinates (endPoint);

	//get euclidean distance between two nodes in view projection to define curvature
	var dist = Math.sqrt(Math.pow((screenStartPoint.x - screenEndPoint.x),2) + Math.pow((screenStartPoint.y - screenEndPoint.y),2));
	dist = dist * (cameraDist/117);
	//var d = maxD *(Math.pow(dist, 2.3)/maxDist); //length of sector on vectorD
	//var d = maxD *dist/maxDist;
	var d = curvatureParameter * (0.00041 * Math.pow(dist, 2) - 0.0145 * dist) ;
	//when distance to camera is 117
	
	var cameraViewVector = new THREE.Vector3(); // create once and reuse it!
	camera.getWorldDirection( cameraViewVector );

	var vectorD = new THREE.Vector3; // direction of bow
	vectorD.crossVectors(cameraViewVector, connectionVector); 

	//test and visualise the direction of bow
/* 	vectorD.normalize(); //normalize the direction vector (convert to vector of length 1)
	var origin = centralPoint;
	var length = d;
	var hex = 0xffff00;
	var oppositeVectorD = new THREE.Vector3(-1 * vectorD.x, -1 * vectorD.y, -1 * vectorD.z );
	var arrowHelper = new THREE.ArrowHelper( vectorD, origin, length, hex );
	var arrowHelperOpposite = new THREE.ArrowHelper( oppositeVectorD, origin, length, hex );
	scene.add( arrowHelper );
	showedLines.push(arrowHelper);
	scene.add( arrowHelperOpposite );
	showedLines.push(arrowHelperOpposite);  */

	vectorD.setLength(d);
	var pointM = new THREE.Vector3;

	//Euclidian distance from the centre of brain volume to nodes
	var centerBrain2D = getScreenCoordinates (centerBrain.position);
	var centralPoint2D = getScreenCoordinates (centralPoint);
	//to middle point between the nodes. Change to sum of distances to nodes
	var distFromCentre = Math.sqrt(Math.pow((centerBrain2D.x - centralPoint2D.x),2) + Math.pow((centerBrain2D.y - centralPoint2D.y),2));
	
	//switch between sub and add vector will define direction of curvature
	pointM.addVectors(centralPoint, vectorD);
	var pointM2D = getScreenCoordinates(pointM);

	var diffFromCenterHor = centerBrain2D.x - centralPoint2D.x;
	var diffFromCenterVer = centerBrain2D.y - centralPoint2D.y;
	//Chose the biggest significant for us difference
	if (Math.abs(diffFromCenterHor) > Math.abs(diffFromCenterVer)) {
		// check horisonatal consistency
		if (diffFromCenterHor * (centralPoint2D.x - pointM2D.x) < 0){
			pointM.subVectors(centralPoint, vectorD);
		} 
	} else if (Math.abs(diffFromCenterHor) < Math.abs(diffFromCenterVer)) {
		// check vertical consistency
		if (diffFromCenterVer * (centralPoint2D.y - pointM2D.y) < 0){
			pointM.subVectors(centralPoint, vectorD);
		} 
	}

	//define flatness of the arc
	var curveWidth = curveWidthParameter * (dist/850);
	var halfConnectionVector = new THREE.Vector3(connectionVector.x * curveWidth, connectionVector.y * curveWidth, connectionVector.z * curveWidth);
	intPoint1.addVectors(pointM, halfConnectionVector);
	intPoint2.subVectors(pointM, halfConnectionVector);

	//console.log(dist, d);

	return [intPoint1, intPoint2];
};

function BrainProjection(){
	var brain2DSize;
	var brainDots = [new THREE.Vector3(131,77,110),new THREE.Vector3(2,2,7), new THREE.Vector3(3,77,110),new THREE.Vector3(129,2,7)];
	Draw2DCircle(brainDots[0]);
	Draw2DCircle(brainDots[1]);
	Draw2DCircle(brainDots[2]);
	Draw2DCircle(brainDots[3]);
	var brain2D = [];
	for (var i=0; i < brainDots.length; i++ ){
		brain2D[i] = brainDots[i].clone();
		camera.updateMatrixWorld();
		brain2D[i].project(camera);
		brain2D[i].x = ( brain2D[i].x + 1) * window.innerWidth / 2;
		brain2D[i].y = - ( brain2D[i].y - 1) * window.innerHeight / 2;
	}
	var brainDiag1 = Math.sqrt(Math.pow((brain2D[1].x - brain2D[0].x),2) + Math.pow((brain2D[1].y - brain2D[0].y),2));
	var brainDiag2 = Math.sqrt(Math.pow((brain2D[3].x - brain2D[2].x),2) + Math.pow((brain2D[3].y - brain2D[2].y),2));
	if (brainDiag1 > brainDiag2){
		brain2DSize = brainDiag1;
	} else {
		brain2DSize = brainDiag2;
	}
	return brain2DSize;
}

function DrawConnection(node1, node2, divisions = 36){
	
	var brain2DSize = BrainProjection();
	console.log(brain2DSize);
	var interPoint = [];
	interPoint = GetIntermediatePoints(node1.position, node2.position);
	var spline = new THREE.CubicBezierCurve3( 
		node1.position,
		interPoint[0],
		interPoint[1],
		node2.position
	 );
	var points = spline.getPoints (divisions);
	var positions = [];
	for ( var i = 0; i < divisions; i ++ ) {
		positions.push( points[i].x, points[i].y, points[i].z );
	}

	var geometryLine = new THREE.LineGeometry();
	geometryLine.setPositions( positions );

	var lineMaterial = new THREE.LineMaterial( {
		color: 0xffffff,
		linewidth: 4, // in pixels
		//vertexColors: THREE.VertexColors,
		dashed: false,
		fog: true
	} ); 

	lineMaterial.resolution.set( window.innerWidth, window.innerHeight );

	var line = new THREE.Line2( geometryLine, lineMaterial );
	line.computeLineDistances();
	scene.add( line ); 

	showedLines.push(line);

	//DrawStraighLine(node1, node2);

/* 	var line = new MeshLine.MeshLine();
	line.setGeometry( positions);
	var lineMaterial = new MeshLine.MeshLineMaterial({
			useMap: false,
			color: new THREE.Color(0xffffff ),
			opacity: 1,
			resolution: resolution,
			sizeAttenuation: !false,
			lineWidth: 0.7,
			dashArray: 1,
			dashOffset:1,
			fog: true		
	});
	var mesh = new THREE.Mesh( line.geometry, lineMaterial ); 
	scene.add( mesh );  */
}

function DrawStraighLine(node1, node2){
	var material = new THREE.LineBasicMaterial({
		color: 0xaaaaaa
	});
	
	var geometry = new THREE.Geometry();
	geometry.vertices.push(
		node1.position,
		node2.position
	);
	
	var line = new THREE.Line( geometry, material );
	scene.add( line );
	showedLines.push(line);
}

//recalculate all the connections
document.addEventListener("keyup", function(event) {
	if (event.code == 'KeyZ') {
		UpdateConnections();		
	}
  });

function UpdateConnections() {
	for (var i=0; i < showedLines.length; i++){
		var selectedObject = showedLines[i];
		scene.remove( selectedObject );
	}
	DrawConnection(node2, node6);
	DrawConnection(node7, node5);
	DrawConnection(node2, node3);
	DrawConnection(node4, node3);
	DrawConnection(node2, node4);
	DrawConnection(node1, node3);
	DrawConnection(node1, node5);
	DrawConnection(node2, node5);
	DrawConnection(node7, node3);
}

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	UpdateConnections();
	curveWidthParameter = curveParams.curveWidth;
	curvatureParameter = curveParams.curvature;
	//console.log(camera.position); //camera dist for good curvature 117, brain size 129-75-104
	render();
	console.log(cameraDist);
}

function render() 
{
	renderer.render( scene, camera );
}

animate();