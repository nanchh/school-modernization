'use strict';

// UTILITY SELECTION FUNCTION
var $ = function(sel){return document.querySelector(sel);},
  asMoney = d3.format('$,.2f'),
  asPercent = d3.format('%'),
  csvData,
  wardData,
  wards
  ;

// **************************************
// SVG SETUP
// **************************************

var sizes = {
		h: 1200,
		w: 700,
		p: 3,
		multiplier: 3
	},
	rectProperties = {
		width: 15,
		color: 'green'
	},

	lineFor = {
		elementarySchool: 200,
		middleSchool: 300,
		highSchool: 400
	},
	pathColor = "#f0f0f0",
	pathHoverColor = '#d0d0d0',

	rectsTowardsWardsProperties = {
		x: 15,
		width: 185

	};

var svg = d3.select('#chart')
	.append('svg')
	.attr('height', sizes.h)
	.attr('width', sizes.w)
	.attr('class', 'svgChart')
	;

// **************************************
// AJAX CALL FOR CSV
// **************************************

d3.csv('DCPS-schools-types_onlyESMSHS.csv', function(data){
	
	// Data Accessors
	csvData = data;
	data.sort(function(a,b){return a.Ward - b.Ward;});
	wards = propogateAllWards();
	wardData = (function(){
		var data = [];
		for(var i = 1; i <= 8; i++){
			data.push(getExpenditureByWard(i));
		}
		return data;
	}());


	// **************************************
	// SCALES
	// **************************************
	
	var maxExpend = d3.max(csvData, function(d){ return d.FakeExpend; }),
		minExpend = d3.min(csvData, function(d){ return d.FakeExpend; }),
		toScale = d3.scale.linear().domain([minExpend, getTotalExpenditure()]).rangeRound([0, sizes.h]);

	// **************************************
	// BUILDING THE GRAPH
	// **************************************

	// Build general funds rectangle
	var rect = svg.append('rect')
		.attr({
			class: 'genFundsRect',
			width: rectProperties.width,
			height: toScale(getTotalExpenditure()),
			fill: 'green'
		});
	
	var rectsTowardsWards = svg.append('g').selectAll('rect')
		.data(wardData)
		.enter()
		.append('rect')
		.attr({
			class:'rectsTowardsWards',
			wardNum: function(d,i){ return i + 1; }
		})
		.attr({
			width: rectsTowardsWardsProperties.width,
			height: function(d){ return toScale(d) - sizes.p; },
			fill: pathColor,
			x: rectsTowardsWardsProperties.x,
			y: function(d,i){ 
				return toScale(getSum(wardData, (i-1)) - getExpenditureByWard(0)); 
			} 
		});


	// Builds rects for the ward rectangles
	var rectsForWards = svg.append('g').selectAll('rect')
		.data(wardData)
		.enter()
		.append('rect')
		.attr({
			class:'rectsForWards',
			id: function(d,i){ return 'wardNum' + (i + 1); }
		})
		.attr({
			width: rectProperties.width,
			height: function(d){ return toScale(d) - sizes.p; },
			fill: "green",
			x: 200, // dummy figure
			y: function(d,i){ 
				return toScale(getSum(wardData, (i-1)) - getExpenditureByWard(0)); 
			} 
		});
	
	// Builds the lines for the individual schools	
	var lines = svg.append('g').attr('class', 'ward1Lines')
		.selectAll('rect')
		.data(wards[0])
		.enter()
		.append('rect')
		.attr({
			class: 'wardLine',
			height: 5,
			width: function(d){
				if(d.SchoolType === 'ES'){ return lineFor.elementarySchool;} 
					else if(d.SchoolType === 'MS'){ return lineFor.middleSchool;} 
					else if(d.SchoolType === 'HS'){ return lineFor.highSchool; } 
					else { return 75; }
	        },
	      x: getRightEdge($('#wardNum1')) +
	      	getRightEdge($('.genFundsRect')) + 
	      	getRightEdge($('.rectsTowardsWards')),
	      y: function(d, i){
	      	
	      	// console.log(getSvgHeight($('#wardNum1')));
	      	var h = getSvgHeight($('#wardNum1'));
	      	return i * (h / wards[0].length);
	      	// return i * 5;
	      }


		})
		;

//####################################################################################
//
//    UTILITY FUNCTIONS
//
//####################################################################################
	
	// function getXofSVG(svgEl){
	// 	svgEl.x.animVal
	// }

	function getWard(ward){
		var arr = [];
		for(var i=0, j=data.length; i < j; i++){
			if(csvData.Ward === +ward){
				arr.push(csvData.Ward);
			}
		}
		return arr;
	};

	
	function getSvgHeight(svg){
		try {
			return svg.height.animVal.value;
		}
		catch(err) {
			console.log('not svg');
		}

	}

	function getSum(arr, index){
	  if(index > arr.length){
		 return 'Second arg is out of range.';
	  } 
	  var i = 0,
			j = index + 1,
			sum = 0;
	  for(; i < j; i++){
		 sum += arr[i];
	  } 
	  return sum;
	}

	function getExpenditureByWard(ward){
	 var i = 0,
		  j = csvData.length,
		  wardTotal = 0,
		  enteredWard = parseInt(ward);

	 for(; i < j; i++){
		if(parseInt(csvData[i].Ward) === enteredWard){
		  wardTotal += parseInt(csvData[i].FakeExpend);
		}
	 }
	 return wardTotal;
	};

	// Returns the sum off all FakeExpends
	function getTotalExpenditure(){
		var totalExpenditures = 0,
			i = 0,
			j = data.length;
		for(; i < j; i++){
			totalExpenditures += parseInt(data[i].FakeExpend);
		}
		return totalExpenditures;
	}

	function getRightEdge(el){
	  var bounds =  el.getBoundingClientRect();
	  return bounds.right - bounds.left;
	}

	function getHeight(el){
	  var bounds =  el.getBoundingClientRect();
	  return bounds.top - bounds.bottom;
	}

	// Returns an array of an array of objects of the indicated ward
	// wards[ward-1][school]
	function propogateAllWards(){
		var allWards = [];
		for(var i=0, j=getNumWards(); i<j; i++){
			allWards.push(propogateWard(i+1));
		}
		function getNumWards(){
			var len = 0,
				i = 0,
				j = data.length;
			for(; i<j; i++){
				if(+data[i].Ward > len){
					len = +data[i].Ward;
				}
			}
			return len;
		}

		// returns an array of objects of all appropiate schools of an indicated ward
		function propogateWard(ward){
			var arr = [],
				i = 0,
				j = data.length;

			for(; i<j; i++){
				if(+data[i].Ward === parseInt(ward)){
					arr.push(data[i]);
				}
			}
			return arr;
		}
		return allWards;
	}
	
});
