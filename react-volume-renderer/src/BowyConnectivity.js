import * as THREE from 'three';
window.THREE = THREE;

require('three/examples/js/lines/LineSegmentsGeometry.js');
require('three/examples/js/lines/LineGeometry.js');
require('three/examples/js/lines/WireframeGeometry2.js');
require('three/examples/js/lines/LineMaterial.js'); 
require('three/examples/js/lines/LineSegments2.js');
require('three/examples/js/lines/Line2.js');

export function getScreenCoordinates (point, camera) {
	var p1 = point.clone();
	
	camera.updateMatrixWorld();
	p1.project(camera);
	p1.x = ( p1.x + 1) * window.innerWidth / 2;
	p1.y = - ( p1.y - 1) * window.innerHeight / 2;
	return p1;
}

export function	GetIntermediatePoints(startPoint, endPoint, camera, volumeSize, curvatureParameter = 1 , curveWidthParameter = 1){
	
	var brain2DSize = 950;
	//console.log(volumeSize);
	if (volumeSize !== undefined){
		brain2DSize = BrainProjection(volumeSize, camera);
	}

	//const cameraDist = Math.sqrt(Math.pow(camera.position.x ,2) + Math.pow(camera.position.y ,2) + Math.pow(camera.position.z,2));	
	var connectionVector = new THREE.Vector3;
	connectionVector.subVectors(startPoint, endPoint); //hypothetical straight line between the nodes
	//find center point between the nodes
	var centralPoint = new THREE.Vector3((parseInt(startPoint.x) + parseInt(endPoint.x)) /2, (parseInt(startPoint.y) + parseInt(endPoint.y)) /2, (parseInt(startPoint.z) + parseInt(endPoint.z)) /2);

	var intPoint1= new THREE.Vector3;
	var intPoint2 = new THREE.Vector3;

	var screenStartPoint = getScreenCoordinates (startPoint, camera);
	var screenEndPoint = getScreenCoordinates (endPoint, camera);

	//get euclidean distance between two nodes in view projection to define curvature
	var dist = Math.sqrt(Math.pow((screenStartPoint.x - screenEndPoint.x),2) + Math.pow((screenStartPoint.y - screenEndPoint.y),2));
	dist = dist * (950/brain2DSize);
	//dist = dist * (Math.sqrt(cameraDist/2)/8);;//* cameraDist; //robustness to camera distance
	var d = curvatureParameter * (0.0004 * Math.pow(dist, 2) - 0.0145 * dist);
	//console.log(window.innerWidth, window.innerHeight);

	//get the plane in which a connection should be
	var cameraViewVector = new THREE.Vector3(); // create once and reuse it!
	camera.getWorldDirection( cameraViewVector );
	var vectorD = new THREE.Vector3; // direction of bow
	vectorD.crossVectors(cameraViewVector, connectionVector); 
	vectorD.setLength(d);
	var pointM = new THREE.Vector3;

	//Euclidian distance from the centre of brain volume to nodes
	var centerBrain = new THREE.Vector3(volumeSize[0]/2, volumeSize[1]/2, volumeSize[2]/2);
	var centerBrain2D = getScreenCoordinates (centerBrain, camera);
	//var centerBrain2D = new THREE.Vector3(0, 0, 0);
	var centralPoint2D = getScreenCoordinates (centralPoint, camera);
	//to middle point between the nodes. Change to sum of distances to nodes
	var distFromCentre = Math.sqrt(Math.pow((centerBrain2D.x - centralPoint2D.x),2) + Math.pow((centerBrain2D.y - centralPoint2D.y),2));
	
	//switch between sub and add vector will define direction of curvature
	pointM.addVectors(centralPoint, vectorD);
	var pointM2D = getScreenCoordinates(pointM, camera);

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

	return [intPoint1, intPoint2];
}

function BrainProjection(volumeSize, camera){
	var brain2DSize;
	//console.log(volumeSize[0]);
	var brainDots = [new THREE.Vector3(volumeSize[0],volumeSize[1],volumeSize[2]),new THREE.Vector3(0,0,0), new THREE.Vector3(0, volumeSize[1],volumeSize[2]),new THREE.Vector3(volumeSize[0],0,0)];

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

export function	BowyConnectionGeometry(from, to, camera, volumeSize, divisions = 36){

	var interPoint = [];
	interPoint = GetIntermediatePoints(from, to, camera, volumeSize);
	var spline = new THREE.CubicBezierCurve3( 
		from,
		interPoint[0],
		interPoint[1],
		to
	);

	var points = spline.getPoints (divisions);
	var positions = [];
	for (var div = 0; div < divisions; div ++ ) {
		positions.push( points[div].x, points[div].y, points[div].z );
	}
	
	const geometryLine = new THREE.LineGeometry();
	geometryLine.setPositions( positions );

	return geometryLine;
}
