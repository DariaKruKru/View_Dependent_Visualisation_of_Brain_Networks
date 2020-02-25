'use strict';
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

var React = require ('react');
var ReactDOM = require ('react-dom');
var PropTypes = require ('prop-types');
var createReactClass = require('create-react-class'); //If you don’t use ES6 yet, you may use the create-react-class module instead:
var d3 = require ('d3');
var parcoords = require ('./parallel-coordinates/d3.parcoords.js');

require('./parallel-coordinates/d3.parcoords.css'); // TODO: find a css solution that refrains from using globals

/**
 * compares scalar arrays
 */
var isEqualArrays = function(a1, a2) {
	return (a1 === undefined && a2 === undefined) || (a1 !== undefined && a2 !== undefined && a1.length==a2.length && a1.every(function(v,i) { return v === a2[i]}))
};

var ParallelCoordinatesComponent = createReactClass ({
	getDefaultProps: function () {
		return {
			state: {
				centroids: [],
				activeData: [],
				//brushExtents: undefined,
			},
		};
	},
	getAdaptiveAlpha: function (data) {
		if (data == undefined)
			return 1;
		var ratio = 100/data.length;
		return Math.min(1, Math.max(ratio, 0.04));
	},
	onBrushEnd: function (data) {
		this.props.onBrushEnd_data(data);
		this.pc = this.pc.alpha( this.getAdaptiveAlpha(data) ).render();
		this.props.onBrushEnd_extents(this.pc.brushExtents());
		this.recalculateCentroids();
	},
	/**
	 * onBrush(data) is all the time while brushing. It recomputes the alpha for the lines and
	 * puts current brushExtents into the callback onBrush_extents.
	 */
	onBrush: function (data) {
		this.pc = this.pc.alpha( this.getAdaptiveAlpha(data) ).render();
		this.props.onBrush_extents(this.pc.brushExtents());
	},
	isOnLine: function (startPt, endPt, testPt, tol) { // from http://bl.ocks.org/mostaphaRoudsari/b4e090bb50146d88aec4
		// check if test point is close enough to a line
		// between startPt and endPt. close enough means smaller than tolerance
		var x0 = testPt[0];
		var	y0 = testPt[1];
		var x1 = startPt[0];
		var	y1 = startPt[1];
		var x2 = endPt[0];
		var	y2 = endPt[1];
		var Dx = x2 - x1;
		var Dy = y2 - y1;
		var delta = Math.abs(Dy*x0 - Dx*y0 - x1*y2+x2*y1)/Math.sqrt(Math.pow(Dx, 2) + Math.pow(Dy, 2));
		//console.log(delta);
		if (delta <= tol) return true;
		return false;
	},
	findAxes: function (testPt, cenPts) { // from http://bl.ocks.org/mostaphaRoudsari/b4e090bb50146d88aec4
		// finds between which two axis the mouse is
		var x = testPt[0];
		var y = testPt[1];

		// make sure it is inside the range of x
		if (cenPts[0][0] > x) return false;
		if (cenPts[cenPts.length-1][0] < x) return false;

		// find between which segment the point is
		for (var i=0; i<cenPts.length; i++){
			if (cenPts[i][0] > x) return i;
		}
	},
	getLines: function (mousePosition) { // from http://bl.ocks.org/mostaphaRoudsari/b4e090bb50146d88aec4
		var clicked = [];
		var clickedCenPts = [];

		if (this.state===undefined || this.state===null || this.state.centroids.length==0) return false;

		// find between which axes the point is
		var axeNum = this.findAxes(mousePosition, this.state.centroids[0]);
		if (!axeNum) return false;

		this.state.centroids.forEach(function(d, i){
			if (this.isOnLine(d[axeNum-1], d[axeNum], mousePosition, 2)){
				clicked.push(this.state.activeData[i]);
				clickedCenPts.push(this.state.centroids[i]); // for tooltip
			}
		}.bind(this));

		return [clicked, clickedCenPts];
	},
	hoverLine: function (mousePosition) {

		var linesAndPositions = this.getLines(mousePosition);
		var linesData = linesAndPositions[0];
		if (linesData === undefined) {
			this.props.onLineHover(undefined);
		} else {
			var firstLineData = linesData[0];
			this.props.onLineHover(firstLineData);
		}
	},
	recalculateCentroids: function () {
		// recalculate centroids
		var activeData = this.pc.brushed();
		var centroids = [];
		for (var i = 0; i<activeData.length; i++) {
			centroids[i] = this.pc.compute_real_centroids(activeData[i]);
		}
		this.setState({ centroids: centroids, activeData: activeData });
	},
	/**updatePC sets new brush*/
	updateBrushExtents: function (brushExtents) {
		var self = this;
		
		if (brushExtents === undefined) {
			brushExtents = [];
		}
		
		this.pc = this.pc
			//.on('brushend', function (d) { }) // has already been reset to empty function
			.brushMode('None') // enable brushing
			.brushMode('1D-axes') // enable brushing
			//.brushExtents([])
			.on('brushend', function (d) { self.onBrushEnd(d); }) // reset the old function
			.brushExtents(brushExtents)
			.on('brush', function (d) { self.onBrush(d); }); // reset the old function
		
		// after changing brush mode: set styles for brushes to replace those set by 'install' function
		this.pc.g().selectAll('.resize rect')
			.style('fill', 'none');
		this.pc.g().selectAll('rect.extent') // for some reason these styles are hardcoded so we cannot overwrite them with css
			.style('fill', 'rgba(0,0,0,0.3)')
			.style('stroke', 'rgba(255,255,255,1.0)');
		this.pc.g().selectAll('rect')
			.style('visibility', null)
			.attr('x', -8)
			.attr('width', 16);
		/*.on('mouseover', function() { // TODO tooltip for both thresholds
				d3.select(this).enter().append('text')
					.text(function(d) {return d.x;})
					.attr('x', function(d) {return x(d.x);})
					.attr('y', function (d) {return y(d.y);});
			});*/
	},
	/**updatePC sets new brush and new data --- it remembers the old brushing
	 * and OPTIONALLY overrides it with props.brushExtents
	 */
	updatePC: function () {
		var self = this;

		// no data, only dimensions: do nothing
		var numDimensions = Object.keys(this.props.dimensions).length;
		if (this.props.data === undefined || this.props.data[0] === undefined || numDimensions > this.props.data[0].length) {
			console.warn('Not updating: not enough data for '+ numDimensions+' dimensions.');
			return;
		}

		// else: set data + brushes

		// keep brush
		var brushExtents = undefined;
		if (this.pc.brushExtents !== undefined) {
			brushExtents = this.pc.brushExtents();
		}
		if (this.props.brushExtents !== undefined) {
			brushExtents = this.props.brushExtents; // overwrite current brushExtents with props
		}

		this.pc = this.pc
			.on('brushend', function () { })
			.on('brush', function () { })
			.width(this.props.width)
			.height(this.props.height)
			.data(this.props.data) // set data again
			.alpha( self.getAdaptiveAlpha(this.props.data) )
			.dimensions(this.props.dimensions)
			.color(this.props.colour)
			.unhighlight([])
			.autoscale();

		// use custom domain if it is set
		var dimKeys = Object.keys(this.props.dimensions);
		dimKeys.forEach(
			function(value, index) {
				if (this.props.dimensions[value].hasOwnProperty('domain') && this.props.dimensions[value].preferredScale !== 'log') {
					//console.log('setting domain', this.props.dimensions[value].domain, 'for dimension', this.props.dimensions[value]);
					this.pc = this.pc.scale(value, this.props.dimensions[value].domain)
				}
			}.bind(this)
		);
		
		// use custom scale if preferredScale != 'linear' // this modifies this.props.dimensions
		dimKeys.forEach(
			function(value, index) {
				if (this.props.dimensions[value].hasOwnProperty('preferredScale') && this.props.dimensions[value].preferredScale != 'linear') {
					//console.log('setting domain', this.props.dimensions[value].domain, 'for dimension', this.props.dimensions[value]);
					this.props.dimensions[value].yscale = this.makeCustomScale(
						this.props.dimensions[value].preferredScale,
						this.props.dimensions[value].yscale.domain(),
						this.props.dimensions[value].yscale.range()
					);
				}
			}.bind(this)
		);

		// render plot
		this.pc = this.pc
			.composite('source-over') // globalCompositeOperation 'darken' may be broken in chrome, 'source-over' is boring
			.mode('queue')
			.dimensions(this.props.dimensions)
			.createAxes()
			.render()
			.shadows();
		
		this.updateBrushExtents(brushExtents);
		
		// for the mouse-over
		this.recalculateCentroids();
	},
	/**
	 * makeCustomScale returns a special log scale
	 */
	makeCustomScale: function (preferredScale, domain, range) {
		
		if (preferredScale != 'log') {
			return undefined;
		}
		//  d3.scale.log() // Constructs a new log scale with the default domain [1,10], the default range [0,1], and the base 10.
		var linearScale2 = d3.scale.linear().domain( domain ).range(range);
		var logScale = d3.scale.log().clamp(true).domain([1,50]).range( domain );//.nice(); // this scales 1-10 logarithmically down to 0-1 which is the default!
		var linearScale = d3.scale.linear().domain(domain).range([1,50]);
		
		var scale = function scale(x) { return linearScale2(logScale(linearScale(x))); };
		scale.nice = function nice(x) { return linearScale2(logScale(linearScale(x))); };
		scale.ticks = function ticks() { return [0, 0.1, 0.2, 0.3, 0.5, 1]; }; // TODO improve the ticks function?
		scale.range = linearScale2.range;
		scale.invert = function invert(x) { return linearScale.invert(logScale.invert(linearScale2.invert(x))); };

		scale.domain = linearScale2.domain;
			
		scale.copy = function copy () { return this; }.bind(scale); // yes, I do not provide a copy. Too lazy.
		return scale;
	},
	/**
	 * initial set-up of the d3.parcoords and the first call to this.updatePC
	 */
	componentDidMount: function () { // component is now in the DOM
	
		var self = this;
		var DOMNode = ReactDOM.findDOMNode(this);
		var data = self.props.data;
		var colour = self.props.colour;
		this.pc = d3.parcoords({
			//alpha: 0.2,
			color: '#069',
			shadowColor: '#f3f3f3', // does not exist in current PC version
			width: this.props.width,
			height: this.props.height,
			dimensionTitleRotation: this.props.dimensionTitleRotation,
			//margin: { top: 33, right: 0, bottom: 12, left: 0 },
			//nullValueSeparator: 'bottom',
		})( DOMNode );

		/*this.pc.flip = function (d) {
			
			var newYScale = undefined;
			if (this.state.dimensions[d].otherYScale !== undefined) {
				newYScale = this.state.dimensions[d].otherYScale;
			} else {
				var extent = this.state.dimensions[d].yscale.domain(); // [0,1]
				var range = this.state.dimensions[d].yscale.range(); // [197, 1]
				
				//  d3.scale.log() // Constructs a new log scale with the default domain [1,10], the default range [0,1], and the base 10.
				var linearScale2 = d3.scale.linear().domain( [0,1] ).range(range);
				var logScale = d3.scale.log().clamp(true).domain([1,50]).range( [0,1] );//.nice(); // this scales 1-10 logarithmically down to 0-1 which is the default!
				var linearScale = d3.scale.linear().domain(extent).range([1,50]);
				
				newYScale = function scale(x) { return linearScale2(logScale(linearScale(x))) };
				newYScale.nice = function nice(x) { return linearScale2(logScale(linearScale(x))) };
				newYScale.ticks = function ticks() { return [0, 0.1, 0.2, 0.3, 0.5, 1] }; // TODO improve the ticks function?
				newYScale.range = linearScale2.range;
				newYScale.invert = function invert(x) { return linearScale.invert(logScale.invert(linearScale2.invert(x))) }
				newYScale.linearScale2 = linearScale2;
				newYScale.logScale = logScale;
				newYScale.linearScale = linearScale;
				
				newYScale.copy = function copy () { return this; }.bind(newYScale); // yes, I do not provide a copy. Too lazy.
			}
			
			this.state.dimensions[d].otherYScale = this.state.dimensions[d].yscale;
			this.state.dimensions[d].yscale = newYScale;
			this.updateAxes(0); // this will set the new scale for brushing actions
			return this;
		}.bind(this.pc);*/
		
		this.pc = this.pc
			.createAxes()
			.render(); // create the svg

		//attach mouse listeners for mouse-over
		d3.select(DOMNode).select('svg')
			.on('mousemove', function() {
				var mousePosition = d3.mouse(this);
				//mousePosition[1] = mousePosition[1] - 33; // this is margin top at the moment...
				self.hoverLine(mousePosition);
				//highlightLineOnClick(mousePosition, true); //true will also add tooltip
			})
			.on('mouseout', function(){
				self.props.onLineHover(undefined);
			});

		this.updatePC();
		return;
	},
	componentDidUpdate: function () { // update w/ new data http://blog.siftscience.com/blog/2015/4/6/d-threeact-how-sift-science-made-d3-react-besties
	
		this.updatePC();
		return;
	},/*,
	componentWillUnmount: function () { // clean up
		console.log('componentWillUnmount')
	},*/
	shouldComponentUpdate: function (nextProps, nextState) {
		var bDimensionsChanged = JSON.stringify(nextProps.dimensions) !== JSON.stringify(this.props.dimensions);
		var bDataChanged = JSON.stringify(nextProps.data) !== JSON.stringify(this.props.data);
		var bDataHighlightedChanged = JSON.stringify(nextProps.dataHighlighted) !== JSON.stringify(this.props.dataHighlighted); // TODO do not ignore data highlight change
		var bBrushExtentsChanged = JSON.stringify(nextProps.brushExtents) !== JSON.stringify(this.props.brushExtents);

		var fullUpdateRequired = (nextProps.width != this.props.width) ||
			(nextProps.height != this.props.height) ||
			bDataChanged ||
			bDimensionsChanged;
		
		if (fullUpdateRequired) {
			return true;
		}
		if (bBrushExtentsChanged) {
			var brushExtents = undefined;
			if (this.pc.brushExtents !== undefined) {
				brushExtents = this.pc.brushExtents();
			}
			for (var i=0; i<nextProps.brushExtents.length; i++) {
				if (!brushExtents ||
					!isEqualArrays(brushExtents[i], nextProps.brushExtents[i])
				) {
					// we actually need a brush update b/c the new brushing data does not come from this parallel coordinates component
					this.updateBrushExtents(nextProps.brushExtents);
					
					// special case: if the new brushExtents are empty: rerender.
					for (var j=0; j<nextProps.brushExtents.length; j++) {
						if (nextProps.brushExtents[j] !== undefined) {
							return false;
						}
					}
					this.pc = this.pc.alpha( this.getAdaptiveAlpha(this.props.data) ).render();
					
					return false;
				}
			}
		}
		return false;
	},
	render: function () {
		var style = {
			width: this.props.width,
			height: this.props.height,
			position: 'relative',
		};
		var className = this.props.className === undefined ? 'parcoords' : this.props.className;
		//return (<div className={'parcoords'} style={style}></div>)
		return React.createElement('div', { className: className, style: style });
	},
});

ParallelCoordinatesComponent.propTypes = {
	dimensions: PropTypes.object.isRequired, // e.g. { 0:{title:'dim1', colour: '#00FFFF', type:'number', domain:[0,1], brushExtent:[0.0,0.2], preferredScale:'log'}, 1:{...} }
	data: PropTypes.array,
	dataHighlighted: PropTypes.array,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	brushExtents: PropTypes.array, // optionally overwrite current brush extents
	onBrush_extents: PropTypes.func,
	onBrushEnd_data: PropTypes.func,
	onBrushEnd_extents: PropTypes.func,
	onLineHover: PropTypes.func,
	colour: PropTypes.func,
	dimensionTitleRotation: PropTypes.number,
	className: PropTypes.string, // optionally use a different className, so we use a different css
};

ParallelCoordinatesComponent.defaultProps = {
	onBrush_extents: function() { },
	onBrushEnd_data: function() { },
	onBrushEnd_extents: function() { },
	onLineHover: function() { },
	colour: function() { return '#000000'; },
	dimensionTitleRotation: 0,
};

module.exports = ParallelCoordinatesComponent;
