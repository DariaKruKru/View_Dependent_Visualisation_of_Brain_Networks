'use strict';

import React from 'react'
import ReactDOM from 'react-dom'
import ParallelCoordinatesComponent from '../'//react-parallel-coordinates.js'


class PCTest extends React.Component {
	constructor (props) {
		super(props)
		this.state={
			brushing: {},
			width: props.minWidth,
		}
		this._bind('brushUpdated', 'handleResize');
	}
	_bind(...methods) {
		methods.forEach( (method) => this[method] = this[method].bind(this) );
	}
	debugOutput () {
		return (
			<p>Number of brushed images: {this.state.brushing.length}</p>
		)
	}
	handleResize(e) {
		let newWidth = ReactDOM.findDOMNode(this).offsetWidth;
		this.setState({width: newWidth});
	}
	componentDidMount() {
		this.handleResize()
		window.addEventListener('resize', this.handleResize);
	}
	componentWillUnmount() {
		window.removeEventListener('resize', this.handleResize);
	}
	brushUpdated (data) {
		this.setState({brushing: data})
	}
	render () {
		let {
			data,
			dimensions, // object of objects; compare example below
			brushExtents, // set initial brush extents, change them with ??? ParallelCoordinatesComponent. ???
			onBrush_extents, // this is called with current brush extents
			onBrushEnd_extents, // same
			onBrushEnd_data, // this is called with the complete data of all brushed items
			onLineHover, // returns full datum of hovered line
			colour, // a function that returns for each line index a html colour
		} = this.props



		return (
			<div>
				<ParallelCoordinatesComponent
					data={data}
					height={this.props.height}
					width={this.state.width}
					dimensions={dimensions}
					dimensionTitleRotation={-50}
					brushExtents={brushExtents}
					onBrush_extents={onBrush_extents}
					onBrushEnd_extents={onBrushEnd_extents}
					onBrushEnd_data={this.brushUpdated}
					onLineHover={onLineHover}
					colour={colour}
				/>
				<div className='debugOutput'>{this.debugOutput()}</div>
			</div>
		)
	}
}

/* // example
var dimensions = {
		'displacement (cc)': {
				title: "Displacement (cc)",
				yscale: log,
				tickFormat: function(d){
						return log.tickFormat(4,d3.format(",d"))(d);
				}
		},
		'power (hp)': {
				title: "MMhhm Power",
				innerTickSize: 10,
				outerTickSize: 20
		},
		'year': {
				orient: 'right',
				type: 'string',
				tickPadding: 0,
				innerTickSize: 8
		}
};*/

let _dimensions={
	0: {
		title: "dim0",
		type: "number",
	},
	1: {
		title: "dim1",
		type: "number",
	},
	2: {
		title: "dim2",
		type: "number",
	},
	3: {
		title: "dim3",
		type: "number",
		domain: [0.0,100.1],
	},
	4: {
		title: "dim4",
		type: "string",
	},
	5: {
		title: "dim5",
		type: "number",
		//domain: [0.0,10.1],
	},
}

let _data=[
	[0,-0,0,0,"yes",1,0],
	[2,-1,1,2,"no",1,1],
	[2,-3,4,4,"yes",1.0,2],
	[3,-4,16,8,"yes",1.0,3]
]; // the last entry may be used to identify the datum, see colour function below. It is not drawn on a dimension.

let _colour = (d, i) => {
	// do not use index i, because it changes for brushed data (reindexes brushed data)
	let c = [
		'#f11',
		'#123',
		'#abc',
		'#567',
		'#345',
		'#345',
		'#345',
	]
	let id = d[d.length-1]
	return c[id]
}

let _initialBrushExtents={1:[-1.75,-0.8]};
let _onBrush = function(d) {};
let _onBrushEnd = function(d) {console.log(d)};
let _onLineHover = function(d) {
	if (d !== undefined)
		console.log('mouse hover on datum', d);
}

ReactDOM.render(
	<PCTest
		height={150}
		minWidth={200}
		dimensions={_dimensions}
		brushExtents={_initialBrushExtents}
		data={_data}
		colour={_colour}
		onBrush_extents={_onBrush}
		onBrushEnd_extents={_onBrushEnd}
		onBrushEnd_data={_onBrushEnd}
		onLineHover={_onLineHover}
	/>,
	document.querySelectorAll('.mygraph')[0]
)
