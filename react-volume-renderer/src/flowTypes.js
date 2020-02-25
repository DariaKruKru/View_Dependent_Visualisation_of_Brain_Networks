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


type Position = Array<number>;
type Segment = Array<Position>;
type Path = Array<Segment>;
export type Brush = { radius?: number, path?: Path };

export type Mask = {
	x: Array<number>,
	y: Array<number>,
	z: Array<number>,
	minX: number,
	minY: number,
	minZ: number,
	maxX: number,
	maxY: number,
	maxZ: number,
	// we need to scale the drawn cubes in the 3d rendering. for this we need to know the scaling of the voxel grid per dimension
	boundingBoxScaleX: number,
	boundingBoxScaleY: number,
	boundingBoxScaleZ: number,
};

// Another mask representation, much more memory efficient
// StartX/Y/Z is the starting coordinate in Voxel space of the mask... this can be transformed to world space by the boudingBoxScales
// SizeX/Y/Z tells how big the mask is in voxel coordinates...i.e. maxX - minX = SizeX
// DATA: base64 encoded char (uint8) bit-encoded mask volume data containing 1 where a voxel in the lattice is set and 0 if its unset
export type Mask2 = {
	StartX: number,
	StartY: number,
	StartZ: number,
	SizeX: number,
	SizeY: number,
	SizeZ: number,
	Data: string, 
	BoundingBoxScaleX: number,
	BoundingBoxScaleY: number,
	BoundingBoxScaleZ: number,
}

export type Job = {
	step: number,
	stepNum: number,
	channel: number,
	img: HTMLImageElement,
	type: string,
};
export type AtlasBoundFile = { image: string, visible: boolean };

export type Region = {
	Rid: string,
	ShortName: string,
	CenterNodeCoordinates: string,
	Size: number,
	Color: string,
	regionCoordinates: Array<string>,
};

export type Connection = {
	f: string,
	t: string,
	cm: string,
	w: number,
	lineColor: string,
}