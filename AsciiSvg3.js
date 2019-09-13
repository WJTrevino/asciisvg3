/* AsciiSvg3.js ================================================================
JavaScript routines to dynamically generate Scalable Vector Graphics
using a mathematical xy-coordinate system (y increases upwards).

Originally written (C) 2009 by Peter Jipsen, http://www1.chapman.edu/~jipsen/
Heavily revised (C) 2016 by Murray Bourne, IntMath.com
Reimplemented (C) 2019 by Westley Trevino, trevino.pw

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or (at
your option) any later version.

This program is distributed in the hope that it will be useful, 
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
General Public License (at http://www.gnu.org/copyleft/gpl.html) 
for more details.
============================================================================= */

"use strict";

////////////////////////////////////////////////////////////////////////////////
// Namespaced Interface
////////////////////////////////////////////////////////////////////////////////

var ASVG = {};
(function(){

////////////////////////////////////////////////////////////////////////////////
// State and Helper Functions
////////////////////////////////////////////////////////////////////////////////

this.Boards = {};

/**
 * Repeatedly applies setAttribute() for every key-value pair in an object.
 * Overwrites existing attributes.
 *
 * @param {Object} attributeList One or more HTML attributes to apply.
 * @this {Element} The Element to modify.
 * @returns {Element} The Element with attributes applied.
 */
window.Element.prototype.setAttributeList = function(attributeList = {}) {
  var element = this;
  window.Object.keys(attributeList).forEach(function(key) {
    if (typeof attributeList[key] === "undefined") {
      console.warn(`Cannot add undefined attribute ${key} to element. Skipping.`)
    } else {
     element.setAttribute(key.toString(), attributeList[key].toString());
    }
  });
  return element;
}

this.log = {};
this.log.logLevels = {0:"SILENT", 1:"DEBUG", 2:"INFO", 3:"LOG", 4:"WARN", 5:"ERROR"};
this.log.debug = function(message) {
  window.console.debug(message);
}
this.log.info = function(message) {
  window.console.info(message);
}
this.log.log = function(message) {
  window.console.log(message);
}
this.log.warn = function(message) {
  window.console.warn(message);
}
this.log.error = function(message) {
  window.console.error(message);
}

////////////////////////////////////////////////////////////////////////////////
// Interface Part 1: Default Drawing Options
////////////////////////////////////////////////////////////////////////////////

this.Config = {};

this.Config.boardDefaults = {
  containerStyle: "",
  padding: 20,
  bgFill: "#FFFFFF",
  plotWindow: [-5,5,-5,5],
  zeroAxis: true,
};

this.Config.pathDefaults = {
  arrowFillColor: "#666666",
  axesStrokeColor: "#000000",
  dotRadius: 4,
  dotStrokeWidth: 1,
  fontSize: 14.4,
  gridStrokeColor: "#DDDDDD",
  fillOpacity: 1,
  markerWidth: 1,
  markerStroke: "#000000",
  markerFillColor: "#000000",
  markerSize: 4,
  markerType: "none",
  segmentStrokeWidth: 1,
  strokewidth: 2,
  strokeOpacity: 1,
  tickLength: 4 
};

////////////////////////////////////////////////////////////////////////////////
// Interface Part 2: Board Class Definition
////////////////////////////////////////////////////////////////////////////////

class Board {
  constructor(boardId,localBoardOptions,localPathOptions,contextArg=ASVG) {
    this.Context = contextArg;

    if (typeof boardId !== 'string') return null; // TODO exceptions?

    if (this.Context.Boards[boardId] instanceof Board) {
      this.log.warn(`Board already exists with same ID: ${boardId}`);
      return this.Context.Boards[boardId];
    }

    this.Context.log.info(`Creating Board ID: ${boardId}`)


    this.boardId = boardId;
    this.boardOptions = {
        ...this.Context.Config.boardDefaults,
        ...localBoardOptions
    };
    this.pathOptions = {
        ...this.Context.Config.pathDefaults,
        ...localPathOptions
    };

    this.boardElement = document.getElementById(boardId);
    if (this.boardElement === null) return null; // TODO exceptions?
    this.boardElement.classList.add("asvg-board");
    this.boardElement.style.cssText += `${this.boardOptions.containerStyle};`;

    this.xySystem = {
      xMin: this.boardOptions.plotWindow[0],
      xMax: this.boardOptions.plotWindow[1],
      yMin: this.boardOptions.plotWindow[2],
      yMax: this.boardOptions.plotWindow[3],
    };
    this.xySystem.xRange = this.xySystem.xMax-this.xySystem.xMin;
    this.xySystem.xScale = this.boardElement.clientWidth/this.xySystem.xRange;
    this.xySystem.yRange = this.xySystem.yMax-this.xySystem.yMin;
    this.xySystem.yScale = this.boardElement.clientHeight/this.xySystem.yRange;
    this.xySystem.origin = {x:0,y:0};

    this.pxSystem = {
      xMin: 0,
      xMax: this.boardElement.clientWidth,
      xRange: this.boardElement.clientWidth,
      xScale: 1,
      yMin: 0,
      yMax: this.boardElement.clientHeight,
      yRange: this.boardElement.clientHeight,
      yScale: 1,
    }
    this.pxSystem.origin = this.xyToPxPosition([0,0]);

    // TEMP DEBUGGING
    // Needs context for log and legacy V2 methods.
    this.svgElement =
        this.Context.V2.initBoard(boardId, ...this.boardOptions.plotWindow);
    this.Context.V2.axes(1,1,"TRUE",1,1);
    this.Context.V2.circle([0,0],1,"circle1");
    this.Context.V2.plot("arcsin(x)",-3,2);

    // TEMP DEBUGGING
    // var svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // svgElement.setAttributeList({
  //     width: '100%',
  //     height: '100%',
  //     transform: 'scale(1,-1)'
  //   });

    this.boardElement.appendChild(this.svgElement);
    

    this.Paths = {};

    var button = document.createElement("div");
    button.setAttribute("style",
        "position: absolute; right: 10px; bottom: 10px; background: white;")
    button.innerText = "A";
    this.boardElement.appendChild(button);
    button.addEventListener("mousedown",function(ev){alert("Click!");});

     this.Context.Boards[boardId] = this;
     return this;
  }
}

/**
 * Transforms an XY position coordinate to PX measures for SVG plotting.
 *
 * @param {Array} A [x,y] position array in XY coordinates.
 * @returns {Array} A [x,y] position array in PX coordinates.
 */
Board.prototype.xyToPxPosition = function(XY = [0,0]) {  
  var xPx = this.xySystem.xScale*(XY[0]-this.xySystem.xMin);
  var yPx = this.xySystem.yScale*(XY[1]-this.xySystem.yMin);
  return {x:xPx,y:yPx};
}

/**
 * Transforms an XY length coordinate to PX measures for SVG plotting.
 *
 * @param {Array} A [x,y] length array in XY coordinates.
 * @returns {Array} A [x,y] length array in PX coordinates.
 */
Board.prototype.xyToPxLength = function(LW = [0,0]) {
  var lengthPx = this.xySystem.xScale*LW[0];
  var widthPx = this.xySystem.yScale*LW[1];
  return {l:lengthPx,w:widthPx};
}

////////////////////////////////////////////////////////////////////////////////
// Interface Part 3: Path Class Definition
////////////////////////////////////////////////////////////////////////////////

class Path {
  constructor(pathId,boardObject,localOptions,context) {
    if(typeof pathId !== "string") return null; // TODO: Exceptions?
    this.boardObject = boardObject;
    this.context = boardObject.context;
    this.pathId = pathId;
    this.pathOptions = {...this.context.Config.pathDefaults,...localOptions};
    return this;
  }
}

Board.prototype.createPath = function(pathType, ...rest) {
  var a = new Path("test",this,{},this.context);
  return a;
}

////////////////////////////////////////////////////////////////////////////////
// Interface Part 4: Context-specific Operations
////////////////////////////////////////////////////////////////////////////////

this.createBoard = function(boardId,localBoardOptions={},localPathOptions={}) { // analogue: initBoard()
  var board = new Board(boardId,localBoardOptions,localPathOptions,this);
  return board;
}


this.getBoard = function(id) { // analogue: this.setBoardParams(), kind of
  if (!(this.Boards[id] instanceof Board)) {
    this.log.error(`Board ID does not exist: {$id}`);
    return null;
  }
  return this.Boards[id];
}

Board.prototype.deleteBoard = function() {
  this.context.log.info(`Deleting Board ID: ${this.boardId}`)
  this.boardElement.innerHTML = "";
  this.boardElement.
  delete(this.context.Boards[this.boardId]);
  return this.context;
}

this.deleteBoard = function (id) {
  var board = {};

  if (typeof id === 'string') {
    board = this.getBoard(id);
    board.deleteBoard();
  } else if (id instanceof Board) {
    board.deleteBoard();
  } else {
    this.log.error(`Invalid Board or Board ID: ${id}`)
  }
  return this;
}


// Method: compatibilityMode()?
// This method exposes the internal methods of AsciiSVG(-IM) in the global
// namespace, so those scripts can be run without modification.


// Method: polarAxes()?


// Change to drawing functions: should they accept XY positions (and convert them
// to PX positions via method)? Would make specifying curves easier.


// Legacy Interface: AsciiSVG (global namespace)
// Docs: http://www1.chapman.edu/~jipsen/svg/asciisvgcommands.html
//
// These commands must be called before initPicture:
// border = "25" // Margin around graph area
//
// initPicture(xmin,xmax{,ymin{,ymax}})
// line([x,y],[u,v])
// marker = type
//   type := {"dot","arrow","arrowdot","none"}
// path([p1,p2,p3,...,pn])
// curve([p1,p2,p3,...,pn])
// stroke = "color" // HTML color names only
// strokewidth = "value" // Pixel width
// fill = "color" // HTML color names only
// circle([x,y],r)
// ellipse([x,y],rx,ry)
// arc([x,y],[u,v],r) // smaller CCW angle; use two arcs for angle>180
// text([x,y],"label" {,position})
//   position := {"above","below","[above|below]left","[above|below]right"}
// axes() // No parameters
// grid() // No parameters


// Legacy Interface: AsciiSVG-IM (global namespace)
// No docs: from code inspection
//
// angleArc(p,radius,startAngle,endAngle[,id])  // allows angle>180
//   p := [x,y]
//   style := stroke,strokewidth,strokeopacity,fill,fillopacity // global
// arc(start,end[,radius,id])
//   start,end := [x,y]
//   style := stroke,strokewidth,strokeopacity=0.5,fill,fillopacity // global
// arrowhead(p,q[,id]) // does not allow modification by id
//   p,q := [x,y]
//   style := stroke,arrowfill // global
// makeDraggable(targ,func,curveId) // TODO
// ellipse(center,rx,ry[,id])
//   center := [x,y]
//   style := stroke,strokewidth,strokeopacity,fill,fillopacity // global
// circle(center,radius[,id]) == ellipse(center,radius,radius[,id])
// dot(center,typ[,label,pos="below",id])
//   center := [x,y]
//   typ := {"+","-","|","open"}
//   pos := {"above","below","[above|below]left","[above|below]right"}
//   style := dotradius,strokewidth,stroke,strokeopacity,fillopacity // global
// draggablePtsSegLineJoiner(lineSeg,lineSegType,PtsArray,ptNamesArr) // TODO
// line(p,q[,id,strokedasharray])
//   p,q := [x,y]
//   goToExtremeties = {TRUE,FALSE} // draws line through padding surrounding graph area, global
//   style := stroke,strokewidth,strokeopacity,fill,fillopacity
//   strokedasharray as in SVG standards
//   shaperendering as SVG standards, global
// segment(p,q,[id,strokedasharray]) // NOT implemented as case of line()
//   p,q := [x,y]
//   style := stroke,strokewidth,strokeopacity,fill,fillopacity
//   strokedasharray as in SVG standards
//   shaperendering as SVG standards, global
//   marker := {"dotdot","dotarrow","dot","arrowdot","arrow"}
// pathGivenD(d[,id]) // allows any path with precalculated d string
//   d as in SVG standards
//   style := stroke, strokewidth, strokeopacity,fill,fillopacity
// path(plist[,id,c]) // TODO: what is c?
// plot(fun,x_min,x_max,points,id) // TODO
// text(p,str,pos[,id,fontsty,fontfam]) // allows HTML in str
//   p := [x,y]
//   pos := {"above","below","[above|below]left","[above|below]right"}
//   fontsty := CSS style applied to containing div
//   fontfam: UNUSED
// axes(dx,dy,labels[,gdx,gdy])
//   dx,dy := unit length, ticks and labels
//   labels := any string other than "none" with show the axis tick labels
//   style := gridstroke,fill // global
// initBoard(divID,x_min,x_max,y_min,y_max) // contains lots of defaults

this.V2 = {};
(function(context) {

///////////////////////////////////////////
//
// Original AsciiSVG-IM module code below
//
///////////////////////////////////////////

var corpColor = "#165a71";
window.brdPropsNS = {};  // Global object container

var doc = document;
function gebi(ele) {  
  return doc.getElementById(ele);
}
function clog(item, lineNum) {
  console.log("lineNum="+lineNum);
  console.log(item);
//  window.debug = {info: window.console.info.bind(window.console, '%s')};
}
//clog(gebi("content"))
//debug.info(gebi("content"));

///////////////////////////////////////
//
// Default board variables 
//
///////////////////////////////////////

//////////////////////////////////////////////////////
// 
// brdID is the id of <div> containing SVG, e.g. asvg0
// svgID is id of the <svg> element, e.g. asvg0SVG
//
///////////////////////////////////////////////////////

var boundingDiv;
var brdID; 
var svgID;
var theSVG;
var boardPropsArr = [];
var brdPropsArr = [];
var viewPortWidth = window.innerWidth,
  clientWidth = document.body.clientWidth,
  viewPortHeight = window.innerHeight,
  clientHeight = document.body.clientHeight;
var clientWidthRem = clientWidth,
  viewPortWidthRem = viewPortWidth,
  clientHeightRem = clientHeight,
  viewPortHeightRem = viewPortHeight; 
var origin;
var cx, cy;
var dx,dy,labels,gdx,gdy;
var xAxisVble = "x", yAxisVble = "y";
var doAxes = 1;
var showYaxis = 1;
var doGrids = 1;
var boardWidth, boardHeight, boardWidthToHeight=1, boardLeft, boardTop;
var xMin, yMin, xMax, yMax, xunitlength, yunitlength;
var xmin, xmax, ymin, ymax,
    actualXmin, actualXmax, actualYmin, actualYmax,
    xgrid, ygrid, xtick, ytick, initialized, opacity, stroke, below;
var elementIdNum = 999; 
var padding = 20;
var curveLength = 0;
var txtLabelsClass = "intmath"; // For numbers. For axisVbls, uses "intmathItalic"
var dragCnt = 0;
var plotBeyondXVis = false;
var plotBeyondYVis = true;
var goToExtremities = false; // !!!!!!!!
var draggablePtsOnLine = false;
var labelDraggablePts = false;
  
///////////////////////////////////////
//
// Default graph element attribute variables 
//
///////////////////////////////////////

var fontsize = "14.4";
var fontstyle = "normal";
var fontfamily = 'KaTeX_Main,"Times New Roman",Times,serif';
var fontweight = "normal";
var fontstroke = "none";
var fontfill = "none"
var gridstroke = "#ddd";
var ticklength = 4;
var stroke = "black";
var axesstroke = corpColor;
var strokewidth = "1";
var markerstrokewidth = "1";
var strokedasharray = null;
var strokedashoffset = null;
var markerstroke = corpColor;
var markerfill = corpColor;
var markersize = 4;
var marker = "none";
var arrowfill = "#555";
var dotradius = 4;
var dotstrokewidth = 1;
var segstrokewidth = 1;
var strokeopacity = 1;
var fill = "none";
var fillopacity = 1;
var shaperendering = null;


/* deprecated */
var gliderOn = '';
var dotDraggable = false; // Has to be explicitly turned on for each board/dot
  
///////////////////////////////////////
//
// Math functions, symbols and constants
//
///////////////////////////////////////
var cpi = "\u03C0";
var ctheta = "\u03B8";
var pi = Math.PI;
var e = Math.E;
var ln = function(x) { return Math.log(x); };
var logten = function (x) { return Math.log10(x); };
var sin = function(x) { return Math.sin(x); };
var cos = function(x) { return Math.cos(x); };
var tan = function(x) { return Math.tan(x); };
var sec = function(x) { return 1/Math.cos(x); };
var csc = function(x) { return 1/Math.sin(x); };
var cot = function(x) { return 1/Math.tan(x); };
var arcsin = function(x) { return Math.asin(x); };
var arccos = function(x) { return Math.acos(x); };
var arctan = function(x) { return Math.atan(x); };
var arcsec = function(x) { return Math.acos(1/x); };
var arccsc = function(x) { return Math.asin(1/x); };
var arccot = function(x) { return Math.atan(1/x); };
var sinh = function(x) { return Math.sinh(x); };
var cosh = function(x) { return Math.cosh(x); };
var tanh = function(x) { return Math.tanh(x); };
var sech = function(x) { return 1/cosh(x); };
var csch = function(x) { return 1/sinh(x); };
var coth = function(x) { return 1/tanh(x); };
var arcsinh = function(x) { return Math.asinh(x); };
var arccosh = function(x) { return Math.acosh(x); };
var arctanh = function(x) { return Math.atanh(x); };
var arcsech = function(x) { return arccosh(1/x) };
var arccsch = function(x) { return arcsinh(1/x) };
var arccoth = function(x) { return arctanh(1/x) };
var sign = function(x) { return (x==0?0:(x<0?-1:1)) };
function factorial(x,n) {
  if (n==null) n=1;
  for (var i=x-n; i>0; i-=n) x*=i;
  return (x<0?NaN:(x==0?1:x));
}
function C(x,k) {
  var res=1;
  for (var i=0; i<k; i++) res*=(x-i)/(k-i);
  return res;
}
function chop(x,n) {
  if (n==null) n=0;
  return Math.floor(x*Math.pow(10,n))/Math.pow(10,n);
}
function ran(a,b,n) {
  if (n==null) n=0;
  return chop((b+Math.pow(10,-n)-a)*Math.random()+a,n);
}

// Source: http://mtdevans.com/2013/05/fourth-order-runge-kutta-algorithm-in-javascript-with-demo/
// Converted from Python version: http://doswa.com/2009/01/02/fourth-order-runge-kutta-numerical-integration.html
function rk4(x, v, a, dt) {
  // Returns final (position, velocity) array after time dt has passed.
  //        x: initial position
  //        v: initial velocity
  //        a: acceleration function a(x,v,dt) (must be callable)
  //        dt: timestep
//console.log("x="+x);  
  var x1 = x;
  var v1 = v;
  var a1 = a(x1, v1, 0);

  var x2 = x + 0.5*v1*dt;
  var v2 = v + 0.5*a1*dt;
  var a2 = a(x2, v2, dt/2);

  var x3 = x + 0.5*v2*dt;
  var v3 = v + 0.5*a2*dt;
  var a3 = a(x3, v3, dt/2);

  var x4 = x + v3*dt;
  var v4 = v + a3*dt;
  var a4 = a(x4, v4, dt);

  var xf = x + (dt/6)*(v1 + 2*v2 + 2*v3 + v4);
  var vf = v + (dt/6)*(a1 + 2*a2 + 2*a3 + a4);
//console.log(xf);
  return [xf, vf];
}

function pythag(p,q) {
  //console.log(p,q)
  return Math.sqrt( Math.pow(q[0] - p[0], 2) + Math.pow(q[1] - p[1], 2) );
}

// Source: http://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (-angleInDegrees) * Math.PI / 180.0;
  return {
  x: centerX + (radius * Math.cos(angleInRadians)),
  y: centerY + (radius * Math.sin(angleInRadians))
  };
}

// Source: http://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-an-object-in-javascript
function contains(arr, obj) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i][0] === obj[0] && arr[i][1] === obj[1]) {
            return true;
        }
    }
    return false;
}

///////////////////////////////////////
//
// Board graphing functions
//
///////////////////////////////////////

function makeSVG(tag, attrs, eleId) { 
  var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (var k in attrs) {  
    if(typeof attrs[k] !== 'undefined') {
      el.setAttribute(k, attrs[k]);
//console.log(attrs[k])     
    }
  }
  gebi(eleId).appendChild(el);
  return el;
}

function use(id, svgID, attrs) {  
  var useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', "#"+id);
  for (var k in attrs) {  
    if(typeof attrs[k] !== 'undefined') {
      useElem.setAttribute(k, attrs[k]);
    }
  }
  gebi(svgID).appendChild(useElem);
}

function removeEle(ele) {
  if(gebi(ele)) {
    gebi(ele).parentNode.removeChild(gebi(ele));
  } else if (document.getElementsByClassName(ele)[0]) {
    document.getElementsByClassName(ele)[0].parentNode.removeChild(document.getElementsByClassName(ele)[0]);
  }
}

//////////////////////////////////////
//
// For cases where script refers back to a previous board on page
//
/////////////////////////////////////
this.setBoardParams = function(brdID) {
  // console.log(brdPropsArr)  
  
  // Why this is necessary? (brdID is not global, for some reason)
  brdID = svgID.replace("SVG", "");
  // console.log(svgID, brdID, brdPropsArr[brdID]) 
  xmin = brdPropsArr[brdID]["xMin"];
  ymin = brdPropsArr[brdID]["yMin"];
  xmax = brdPropsArr[brdID]["xMax"];
  ymax = brdPropsArr[brdID]["yMax"];
  boardWidth = brdPropsArr[brdID]["brdWidth"];
  boardHeight = brdPropsArr[brdID]["brdHeight"];
  boardLeft = brdPropsArr[brdID]["Left"];
  boardTop = brdPropsArr[brdID]["Top"];
  xunitlength = brdPropsArr[brdID]["XuL"];
  yunitlength = brdPropsArr[brdID]["YuL"];
  // console.log(yunitlength)  
  origin[0] = brdPropsArr[brdID]["ox"];
  origin[1] = brdPropsArr[brdID]["oy"];
  padding = brdPropsArr[brdID]["pad"];
  actualXmin = brdPropsArr[brdID]["actualXmin"];
  actualXmax = brdPropsArr[brdID]["actualXmax"];
  actualYmin = brdPropsArr[brdID]["actualYmin"];
  actualYmax = brdPropsArr[brdID]["actualYmax"];
  // console.log(brdPropsArr)  
};

//////////////////////////////////////////////
//
// Graph elements
//
//////////////////////////////////////////////

// Source: http://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
// Angles in degrees
this.angleArc = function(p, radius, startAngle, endAngle, id) { 
  var node;
  if (id!=null) node = doc.getElementById(id);
  if (node==null) {   
    node = makeSVG("path", {"id":id,
                "stroke":stroke,
                "stroke-width": strokewidth,
                "stroke-opacity":strokeopacity,
                "fill":fill,
                "fill-opacity": fillopacity               
                }, svgID);
  }
  var start = polarToCartesian(p[0]*xunitlength+origin[0], p[1]*yunitlength+(boardHeight - origin[1]), radius, startAngle);
  var end = polarToCartesian(p[0]*xunitlength+origin[0], p[1]*yunitlength+(boardHeight - origin[1]), radius, endAngle);
  var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  var d = "M"+ (start.x).toFixed(2) + "," + (start.y).toFixed(2) + " " + "A" + radius + "," + radius + " 0 " + largeArcFlag + " 0 " + (end.x).toFixed(2) + "," + (end.y).toFixed(2) + 
      " L" +  (end.x).toFixed(2) + "," + (end.y).toFixed(2) + " " + p[0]*xunitlength+origin[0] + "," + p[1]*yunitlength+(boardHeight - origin[1]) + " Z";       
  node.setAttribute("d", d);       
}

this.arc = function(start,end,radius,id) { // coordinates in cartesian units
  var node, v;
  if (id!=null) node = doc.getElementById(id);
  if (radius==null) {
    v=[end[0]-start[0],end[1]-start[1]];
    radius = Math.sqrt(v[0]*v[0]+v[1]*v[1]);
  }
  if (node==null) {
  node = makeSVG("path", {"id":id,
              "fill":fill,
              "fill-opacity":fillopacity,
              "stroke-width":strokewidth,
              "stroke":stroke,
              "stroke-opacity":0.5,
              }, svgID);
  }
  node.setAttribute("d","M"+(start[0]*xunitlength+origin[0])+","+
    (boardHeight-start[1]*yunitlength-origin[1])+" A"+radius*xunitlength+","+
     radius*yunitlength+" 0 0,0 "+(end[0]*xunitlength+origin[0])+","+
    (boardHeight-end[1]*yunitlength-origin[1]));

  if (marker=="arrow" || marker=="arrowdot") {
    u = [(end[1]-start[1])/4,(start[0]-end[0])/4];
    v = [(end[0]-start[0])/2,(end[1]-start[1])/2];
    v = [start[0]+v[0]+u[0],start[1]+v[1]+u[1]];
  } else v=[start[0],start[1]];
  if (marker=="dot" || marker=="arrowdot") {
    this.ASdot(start,markersize,markerstroke,markerfill);
    if (marker=="arrowdot") this.arrowhead(v,end);
    this.ASdot(end,markersize,markerstroke,markerfill);
  } else if (marker=="arrow") this.arrowhead(v,end);
}

this.arrowhead = function(p,q,id) { 
  if(typeof id === 'undefined') id="arrHead"+Math.floor(Math.random() * 1000);
  var ox = origin[0];
  var oy = origin[1];
  var rotateAngleRad = 0;
  var rotateAngleDeg = 0;
  var triRotate = 0;
  var triWidth = 7;
  var triHeight = 12;
  var st = "";
  var rot = "";
  
  if (q[0] == p[0]) {
    if(q[1] > p[1]) { 
      rotateAngleRad = 0;
    } else {
      rotateAngleRad = Math.PI;  
    }
  } else {
    rotateAngleRad = Math.PI/2 - Math.atan( ((q[1] - p[1])*yunitlength) / ((q[0] - p[0])*xunitlength) );
  }
  if(q[0] < p[0]) { 
    rotateAngleRad = Math.PI + rotateAngleRad;
  } 
  rotateAngleDeg = (180/Math.PI)*rotateAngleRad;
  triRotate = Math.round(rotateAngleDeg);
  rot = "rotate("+triRotate+" "+Math.round(ox+q[0]*xunitlength)+" "+Math.round(boardHeight-oy-q[1]*yunitlength)+")";
  st = 'M '+Math.round(ox+q[0]*xunitlength)+' '+Math.round(boardHeight-oy-q[1]*yunitlength)+' L '+Math.round(ox+q[0]*xunitlength-triWidth/2)+' '+Math.round(boardHeight-oy+triHeight-q[1]*yunitlength)+' L '+Math.round(ox+q[0]*xunitlength+triWidth/2)+' '+Math.round(boardHeight-oy+triHeight-q[1]*yunitlength)+' Z';  
  var arrHead = makeSVG('path', {
        d:st,
        transform:rot,       
        stroke:stroke, 
        fill: arrowfill,
        id: id
        }, svgID);  
}

/////////////////////////////////////////////
//
// DRAG (current)
// Functions based on Event.js
// https://github.com/mudcube/Event.js
//
/////////////////////////////////////////////

function addListeners( brdSvgEle ){
  brdSvgEle.addEventListener( 'pointerdown', doOnPointerDown, false );
  brdSvgEle.addEventListener( 'pointermove', doOnPointerMove, false );
  brdSvgEle.addEventListener( 'pointerup', doOnPointerUp, false );
}

////////////////////////
//
// Made transX, transY, transXRem, transYRem, xCart, yCart, xPix, yPix GLOBAL 
// so can change them after e.g. animation in Work spring
//
////////////////////////
var transX, transY;
var transXRem, transYRem;
var xCart, yCart;
var xPix, yPix;
var cx,cy;


this.makeDraggable = function(targ, func, curveId) {
  
  // Do all the following ONCE for each draggable dot create
  
  targID = targ.id;
  //gebi(targID).style.fill = "#f0f";
  gebi(targID).style.strokeOpacity = 0.01;
  addListeners( targ.parentNode );
  brdID = targ.parentNode.id.replace("SVG", "");
  
  // Must set these here, with "var"
  // TODO: Use: this.setBoardParams(brdID)..?
  
  var xunitlength = brdPropsArr[brdID]["XuL"];
  var yunitlength = brdPropsArr[brdID]["YuL"];
  var boardWidth = brdPropsArr[brdID]["brdWidth"];
  var boardHeight = brdPropsArr[brdID]["brdHeight"];
  var padding = brdPropsArr[brdID]["pad"];
  var xmin = brdPropsArr[brdID]["xMin"];
  var xmax = brdPropsArr[brdID]["xMax"];  
  var ymin = brdPropsArr[brdID]["yMin"];
  var ymax = brdPropsArr[brdID]["yMax"];
  var ox = brdPropsArr[brdID]["ox"]
  var oy = brdPropsArr[brdID]["oy"];
  var cx = brdPropsArr[brdID][targID]["cx"];  
  var cy = brdPropsArr[brdID][targID]["cy"];
  var r = brdPropsArr[brdID][targID]["r"];  
  
  if(typeof func !== 'undefined' && func != "vert") {
    var g;
    eval("g = function(x){ with(Math) return "+mathjs(func)+"; }");
    ///////////////////////////////////
    //
    // For cases where user didn't enter y value correctly
    // (so dot not on curve)
    //
    /////////////////////////////////////////
    var qForGlider = g(brdPropsArr[brdID][targID]["cart"][0]);
    brdPropsArr[brdID][targID]["cart"][1] = qForGlider;
    targ.setAttribute("cy", (boardHeight - oy - qForGlider*yunitlength));
  } 
  var x_0 = brdPropsArr[brdID][targID]["cart"][0];
  targID = '';
  
  /////////////////////////////////////////////////////
  //
  // DRAG EVENTS
  //
  ///////////////////////////////////////////////////// 
  
  eventjs.add(targ, "drag", function(event, self) {
    svgID = self.target.parentNode.id;
    brdID = svgID.replace("SVG", "");
    targID = targ.id;
    
    var boardWidth = brdPropsArr[brdID]["brdWidth"];  
    var boardHeight = brdPropsArr[brdID]["brdHeight"];
    
    // So target is on top of all other elements
    gebi(svgID).appendChild(gebi(targID));
    
    if(typeof brdPropsArr[brdID][targID]["trans"] === 'undefined') { 
      brdPropsArr[brdID][targID]["trans"] = [0, 0];
    }   
    if(typeof brdPropsArr[brdID][targID]["transRem"] === 'undefined') {  
      brdPropsArr[brdID][targID]["transRem"] = [0,0];
    }   
    
    //////////////////////////////////////////////////////////
    //
    // transX, transY continue to change as cursor leaves board.
    // transXRem, transYRem are used for actual transformation.
    // They are limited to the padding inner edge,
    // as are xPix, yPix.
    //
    /////////////////////////////////////////////////////////
  
    transX = brdPropsArr[brdID][targID]["trans"][0] + self.x - r;
    transY = brdPropsArr[brdID][targID]["trans"][1] + self.y - r;
//console.log("the TRANS!!!!______ "+transX, transY, brdPropsArr['asvg1']['mass']["cx"])    
    xPix = brdPropsArr[brdID][targID]["cx"] + transX;
    yPix = cy + transY;

//console.log(xPix, cx, transX)

    
    if( xPix > boardWidth - padding) {
      xPix = boardWidth - padding;      
      xCart = xmax;
      transXRem = boardWidth - padding - cx;
    } else if( xPix < padding) {
      xPix = padding;
      xCart = xmin ;
      transXRem = -cx + padding;
    } else {
      transXRem = transX;
      xCart = xmin + (xPix - padding) / xunitlength;
    }
    if( yPix <= padding) {
      yPix = padding;
      transYRem = yPix - cy;
    } else if( yPix > boardHeight  - padding) {
      yPix = boardHeight  - padding;
      transYRem = yPix - cy;
    } else {
      transYRem = transY;
    }
    yCart = (boardHeight - yPix - oy) / yunitlength;
//console.log("xCart in drag "+xCart)
    ///////////////////////////////////////////////////////
    //
    // CASE 0: Dot is draggable (includes glider and if on a function cases)
    // Cannot drag within padding area
    //
    ///////////////////////////////////////////////////////

    if(typeof func === 'undefined') {
      self.target.setAttribute("transform", "translate(" +(transXRem)+","+(transYRem)+")");
    }   
    brdPropsArr[brdID][targID]["cart"] = [xCart, yCart];
//console.log(brdPropsArr[brdID][targID]["cart"][0])    
    brdPropsArr[brdID][targID]["pix"] = [xPix, yPix];

    /////////////////////////////////////////////////
    //
    // CASE 1: Segment joining 2 draggable points
    //
    /////////////////////////////////////////////////
    
    if(typeof brdPropsArr[brdID][targID]["segment"] !== 'undefined')  {
      joinSegID = brdPropsArr[brdID][targID]["segment"];
      firstPt = brdPropsArr[brdID][joinSegID][0];
      secondPt = brdPropsArr[brdID][joinSegID][1];
      ptP = brdPropsArr[brdID][firstPt]["cart"];
      ptQ = brdPropsArr[brdID][secondPt]["cart"];
      this.segment( ptP, ptQ, joinSegID);   
    }   
    
    /////////////////////////////////////////////////
    //
    // CASE 2: Line joining 2 draggable points
    //
    /////////////////////////////////////////////////
    
    if(typeof brdPropsArr[brdID][targID]["line"] !== 'undefined') {
      joinLineID = brdPropsArr[brdID][targID]["line"];
      firstPt = brdPropsArr[brdID][joinLineID][0];
      secondPt = brdPropsArr[brdID][joinLineID][1]
      ptP = brdPropsArr[brdID][firstPt]["cart"];
      ptQ = brdPropsArr[brdID][secondPt]["cart"];
      this.line( ptP, ptQ, joinLineID); 
    } 
        
    ///////////////////////////////////////////////////////
    //
    // CASE 3: Dot is a glider on a function
    //
    ///////////////////////////////////////////////////////

    if(typeof func !== 'undefined' && func !== "vert") {
      
      //////////////////////////////////////////////
      //
      // LOGIC
      // For small slopes:
      // Get xCart from main eventjs "drag" function
      // Define yCart from the g(x) function.
      // Translate in the y-direction appropriately
      //
      // TODO: Should this be pixel slope...?
      //
      //////////////////////////////////////////////
      var slope =   (g(xCart-0.01)-g(xCart))/-0.01;
      
      var screenSlope = slope*(brdPropsArr[brdID]["YuL"]/brdPropsArr[brdID]["XuL"])
//console.log(slope,screenSlope)      
      if(Math.abs(screenSlope) < 3 ) {
        var yCart = Math.max(ymin, Math.min(g(xCart), ymax));
        var boardWidth = brdPropsArr[brdID]["brdWidth"];
        if( yPix <= r) {
          transYRem = r - cy;
        } else if( yPix >= boardHeight - r) {
          transYRem = yPix - cy;
        } else {
          transYRem = (-yCart+g(x_0))*yunitlength ;
        }       
        if (xCart > brdPropsArr[brdID][curveId]["minX"]
            && xCart < brdPropsArr[brdID][curveId]["maxX"] ) {
          gebi(targID).setAttribute("transform", "translate(" +(transXRem)+","+( transYRem )+")");  
        }
      } else {
        
        newXcart = xCart - (g(xCart) - yCart)/slope; //-(yCart - g(xCart))/slope;
        transXRem = 0;
        transXRem = ox - cx +(newXcart)*xunitlength;
        gebi(targID).setAttribute("transform", "translate(" +(transXRem)+","+(transYRem)+")");
        brdPropsArr[brdID][targID]["cart"] = [newXcart, yCart];
        brdPropsArr[brdID][targID]["pix"] = [xPix, yPix];
        xCart = newXcart;
      }
      if(gebi("eventsInfo1")) {
        if(dragCnt%5 == 1) {
          gebi("eventsInfo1").innerHTML = "<b>Cartesian:</b> ("+(xCart.toFixed(2))+", "+yCart.toFixed(2)+")";     
        }
      }
    }

    ///////////////////////////////////////////////////////
    //
    // CASE 4: Dot is a glider on a vertical line
    //
    ///////////////////////////////////////////////////////

    if(typeof brdPropsArr[brdID][curveId] !== 'undefined' 
        && typeof brdPropsArr[brdID][curveId]["vert"] !== 'undefined'
        && brdPropsArr[brdID][curveId]["vert"][0][0] == brdPropsArr[brdID][curveId]["vert"][1][0] ) {
      
      xCart = brdPropsArr[brdID][curveId]["vert"][0][0];
      transXRem = 0;
      gebi(targID).setAttribute("transform", "translate(" +(transXRem)+","+(transYRem)+")");
      brdPropsArr[brdID][targID]["cart"] = [xCart, yCart];
      brdPropsArr[brdID][targID]["pix"] = [xPix, yPix];
      if(gebi("eventsInfo1")) {
        if(dragCnt%5 == 1) {
          gebi("eventsInfo1").innerHTML = "<b>Cartesian:</b> ("+(xCart.toFixed(2))+", "+yCart.toFixed(2)+")";
        }
      }     
    }
    
    //////////////////////////////////////////////////////////
    //
    // Translations need to be remembered and then re-applied on pointer down
    // O/wise, the dx, dy are applied multiple times
    //
    /////////////////////////////////////////////////////////
    
    brdPropsArr[brdID][targID]["transRem"] = [transXRem, transYRem];

    if(gebi("eventsInfo0")) {
      if(dragCnt%5 == 0) {
        gebi("eventsInfo0").innerHTML = "<b>Board:</b> "+brdID+", <b>target:</b> "+targID;
      }
    }
    if(typeof func === 'undefined') {
      yCart = (boardHeight - yPix - oy) / yunitlength;
      if(gebi("eventsInfo1")) {
        if(dragCnt%5 == 1) {
          gebi("eventsInfo1").innerHTML = "<b>Cartesian:</b> ("+(xCart.toFixed(2))+", "+yCart.toFixed(2)+")";
        }
      }
    }
    if(gebi("eventsInfo2") && dragCnt%5 == 2) {
      gebi("eventsInfo2").innerHTML = "<b>Pixels:</b> ("+(xPix.toFixed(1))+", "+yPix.toFixed(1)+")";
    }
    if(gebi("eventsInfo3") && dragCnt%5 == 3) {
      gebi("eventsInfo3").innerHTML = "<b>self.x, self.y:</b> ("+(self.x.toFixed(2))+","+(self.y.toFixed(2)) + ")";
    }
    if(gebi("eventsInfo4") && dragCnt%5 == 4) {
      gebi("eventsInfo4").innerHTML = "<b>translateRem:</b> "+brdPropsArr[brdID][targID]["trans"][0].toFixed(2) + ", "+brdPropsArr[brdID][targID]["trans"][1].toFixed(2);
    }
    dragCnt++;
    
  }); 
}



/////////////////////////////////////////////
//
// !!!! DRAG (deprecated)
// Functions based on
// https://stackoverflow.com/questions/40276529/spawn-drag-of-svg-elements-approach
//
/////////////////////////////////////////////

var eTarg, targetId, et,  mseTchPosi;
var drag = null, dragging = false;
var currCartMatrix = [];
var slicedSVG;
  // If true, this resets the cx and cy values on mousedown 
  // Transform is also removed.
  // For cases like springs where transform needs to start from scratch.
  // Applies to all boards on the page (for now)
var resetCxCy = false;
var isTouch = false;
var etTxt = document.getElementById("etTxt");
var tchX, tchY, tchPos; 

function Drag(evt) {
  eTarg = evt.target, targetId = eTarg.id, et = evt.type,  mseTchPosi = mseTchPos(evt);
  var svgID = evt.target.parentNode.id;
  slicedSVG = svgID.slice(0,-3);

  // Repeated in stopGoButt in single spring (7. Work) in case drag not first

  if(typeof  currCartMatrix[slicedSVG][targetId] === 'undefined') {
    currCartMatrix[slicedSVG][targetId] = [];
  }
  
  ////////////////////////
  //
  // For testing
  //
  ///////////////////////
  if(etTxt) {
    etTxt.innerHTML = et;
  } 
  
  if ( (!drag || !dragging) &&  (et == "mousedown" || et == "touchstart" )) {
    // So selected dot moves above all other elements on board, so can drag over them
    thisSVGNode = document.getElementById(svgID);
    thisSVGNode.appendChild(eTarg);
    if (typeof window.doFirstOnElementSelect === 'function') {
      doFirstOnElementSelect();
    }   
    if (eTarg.className.baseVal=="draggable") { 
      drag = eTarg;
      if(typeof drag._x === 'undefined' && !resetCxCy) {
        drag._x = 0;
        drag._y = 0;
      }
      
      dPoint = mseTchPosi;

      if(resetCxCy) { 
        // 'transX' part is there in case it was just a click on dot, followed by another click (no drag)
        // 'transform' part is if click on dot after a drag followed by another click (no subsequent drag)
        if(typeof currCartMatrix[slicedSVG][targetId]['currCx'] === 'undefined' || typeof currCartMatrix[slicedSVG][targetId]['currCy'] === 'undefined'
            || typeof currCartMatrix[slicedSVG][targetId]['transX'] === 'undefined' || typeof currCartMatrix[slicedSVG][targetId]['transY'] === 'undefined'
            || eTarg.getAttribute("transform") == null ) {
          currCartMatrix[slicedSVG][targetId]['currCx'] = Number(eTarg.getAttribute("cx"));
          currCartMatrix[slicedSVG][targetId]['currCy'] = Number(eTarg.getAttribute("cy"));
        } else {
          currCartMatrix[slicedSVG][targetId]['currCx'] = Number(eTarg.getAttribute("cx")) + Number(currCartMatrix[slicedSVG][targetId]['transX']);
          currCartMatrix[slicedSVG][targetId]['currCy'] = Number(eTarg.getAttribute("cy")) + Number(currCartMatrix[slicedSVG][targetId]['transY']);           

          eTarg.removeAttribute("transform");
          eTarg.setAttribute("cx", currCartMatrix[slicedSVG][targetId]['currCx']);
          var glideOn = eTarg.getAttribute('data-gliderOn');
          if(glideOn) {
            eTarg.setAttribute("cy", boardPropsArr[slicedSVG+"Height"] - boardPropsArr[slicedSVG+"oy"] + Number(glideOn)*boardPropsArr[slicedSVG+"YuL"]);
          } else {
            eTarg.setAttribute("cy", currCartMatrix[slicedSVG][targetId]['currCy']);
          }
        }
        drag._x = 0;
        drag._y = 0;
      } else {
        // Allow for existing transform
        // Need to define dPoint first        
        dPoint = {x: mseTchPosi.x - drag.getCTM().e, y: mseTchPosi.y - drag.getCTM().f};        
        currCartMatrix[slicedSVG][targetId]['currCx'] = Number(eTarg.getAttribute("cx"));
        currCartMatrix[slicedSVG][targetId]['currCy'] = Number(eTarg.getAttribute("cy"));
        drag._x = 0;
        drag._y = 0;        
      }
    }
    if (typeof window.doAfterElementSelect === 'function') {
      doAfterElementSelect();
    }   
  }

  if (drag  && (et == "mousemove" || et == "touchmove" )) {
    if(mseTchPosi.x > 4 && mseTchPosi.x < boardPropsArr[slicedSVG+"Width"] - 4 
      && mseTchPosi.y > 4  && mseTchPosi.y < boardPropsArr[slicedSVG+"Height"] - 4 ) {
      drag._x += mseTchPosi.x - dPoint.x;     
      var glideOn = eTarg.getAttribute('data-gliderOn');
      if(glideOn) {
        drag._y = Number(glideOn);
      } else {
        drag._y += mseTchPosi.y - dPoint.y;
      }

      if(Math.abs(drag._x) > 0 || Math.abs(drag._y) > 0) {
        dragging = true;

        dPoint = mseTchPosi;
        drag.setAttribute("transform", "translate(" +drag._x+","+drag._y+")");  
        currCartMatrix[slicedSVG][targetId]['transX'] = drag._x;
        currCartMatrix[slicedSVG][targetId]['transY'] = drag._y;
        
        if(targetId.length > 0 && targetId.indexOf("board") == -1) {
          xCart = (mseTchPosi.x - padding) / boardPropsArr[slicedSVG+"XuL"] + boardPropsArr[slicedSVG+"xMin"];
          yCart = (boardPropsArr[slicedSVG+"Height"] - mseTchPosi.y - boardPropsArr[slicedSVG+"oy"]) / boardPropsArr[slicedSVG+"YuL"];
          currCartMatrix[slicedSVG][targetId]['xCart'] = xCart;
          currCartMatrix[slicedSVG][targetId]['yCart'] = yCart;
          if (typeof window.doOnElementDrag === 'function') {
            doOnElementDrag();
          }           
        }       
      }
    } else {
      drag = null;
    }
  }
      
  /////////////////////////////////////////////////////////////////////////
  //
  // || et == "touchend" not included here for Drag becoz it calls evt.touches which DNE on touchend    
  //
  /////////////////////////////////////////////////////////////////////////
  
  if (drag && (et == "mouseup"  )) {
    drag = "undefined";   
    dragging = false;
    if (typeof window.doOnDeselectElement === 'function') {
      doOnDeselectElement();
    }     
  }
    
  if (drag && (et == "mouseout")) {
    // Needed for small draggables
    // Makes spring fail?
    drag = null;
    dragging = false;
    if (typeof window.doOnMouseOut === 'function') {
      doOnMouseOut();
    } 
  } 
}  

function mseTchPos(evt) {
  var svgID = evt.target.parentNode.id;
  slicedSVG = svgID.slice(0,-3);

  var p = document.getElementById(svgID).createSVGPoint();
  if(isTouch || typeof evt.touches !== 'undefined') {
    p.x = evt.touches[0].clientX;
    p.y = evt.touches[0].clientY;
  } else {
    p.x = evt.clientX;
    p.y = evt.clientY;
  }
  var matrix = document.getElementById(svgID).getScreenCTM();
  p = p.matrixTransform(matrix.inverse());
  return {
    x: p.x,
    y: p.y
  }
}

var joinSegArr = [];
var joinLineArr = [];
this.ASdot = function(center, radius, s, f, id) {
    this.setBoardParams(brdID);
  slicedSVG = svgID.slice(0,-3);
  brdPropsArr[slicedSVG][id] = [];
  brdPropsArr[slicedSVG][id]["cart"] = center;
  var node;
  if (s == null) s = stroke;
    if (f == null) f = fill;
  if (id!=null) node = doc.getElementById(id);
  if(node == null) {
    cx = (center[0] * xunitlength + origin[0]);
    cy = (boardHeight - center[1] * yunitlength - origin[1]);
//console.log(strokewidth)    
    node = makeSVG("circle", {"id":id,
                "cx":cx.toFixed(2),
                "cy":cy.toFixed(2),
                "r":radius,
                "stroke":s,
                "stroke-width":strokewidth,
                "stroke-opacity":strokeopacity,
                "fill":f,
                "fill-opacity": fillopacity               
                }, svgID);
    brdPropsArr[slicedSVG][id]["cx"] = cx;
    brdPropsArr[slicedSVG][id]["cy"] = cy;
    brdPropsArr[slicedSVG][id]["r"] = radius;
    
                
  }
  //this.text(center, id, (pos == null ? "below" : pos), (id == null ? id : id + "label"))
  /*if (labelDraggablePts == true) {
    pos = "right";
    this.text(center, id, (pos == null ? "below" : pos), (id == null ? id : id + "label"));
  }*/
  
  
  
  /*** deprecated ***/
    if(dotDraggable) {
    slicedSVG = svgID.slice(0,-3);  
    node.setAttribute("class", "draggable");
    if(gliderOn.length > 0) {
      node.setAttribute("data-gliderOn", gliderOn);
    }
    thisXunitLen = boardPropsArr[slicedSVG+"XuL"];
    thisYunitLen = boardPropsArr[slicedSVG+"YuL"];
    thisPadding =  boardPropsArr[slicedSVG+"pad"];
    thisXmin = boardPropsArr[slicedSVG+"xMin"];
    thisOy =  boardPropsArr[slicedSVG+"oy"];
    thisHeight = boardPropsArr[slicedSVG+"Height"];
    var xCart = center[0];
    var yCart = center[1];
    
    if(typeof currCartMatrix[slicedSVG] === 'undefined') {
      currCartMatrix[slicedSVG] = [];
    }
    if(typeof currCartMatrix[slicedSVG][node.id] === 'undefined') {
      currCartMatrix[slicedSVG][node.id] = [];
    }
    currCartMatrix[slicedSVG][node.id]['xCart'] = xCart;
    currCartMatrix[slicedSVG][node.id]['yCart'] = yCart;

    ////////////////////////////////////////
    //
    // LISTENERS
    //
    ////////////////////////////////////////
    
    node.onmousedown = Drag;
    node.onmousemove = Drag;
    node.onmouseup = Drag;
    node.onmouseout = Drag;   
    
    ///////////////////////////////////
    //
    // addEventListener doesn't work for mouse events, but is needed for touch. Go figure.
    //
    ////////////////////////////////////

    node.addEventListener("touchstart",
      function(evt) {
        if(evt.preventDefault) evt.preventDefault();
        isTouch = true;
        Drag(evt);
    }, false);
    
    node.addEventListener("touchmove",
      function(evt) {
        if(evt.preventDefault) evt.preventDefault();
        Drag(evt);
    }, false);
    
    node.addEventListener("touchend",
      function(evt) {
        if(evt.preventDefault) evt.preventDefault();
        // Don't do Drag() in this listener because calls evt.touches which cease to exist on touchend
        // Drag(evt);
        drag = null;
        // Must do this here because we don't go to Drag().
        if (typeof window.doOnDeselectElement === 'function') {
          doOnDeselectElement();
        } 
    }, false); 
  }
  return gebi(id);
}

this.circle = function(center,radius,id) {  
  // When axes are not equal scaled, should look like an ellipse...
  this.ellipse(center,radius,radius,id);
}

this.dot = function(center, typ, label, pos, id) {
    var node;
    var cx = center[0] * xunitlength + brdPropsArr[brdID]["ox"];
    var cy = brdPropsArr[brdID]["brdHeight"] - center[1] * brdPropsArr[brdID]["YuL"] - brdPropsArr[brdID]["oy"];
  // Commenting this made the sky fall in for e.g. /applications-differentiation/newtons-method-interactive.php
  if (id != null) node = doc.getElementById(id);
    if (typ == "+" || typ == "-" || typ == "|") {
        if (node == null) {
            node = makeSVG("path", {id:id}, svgID);
        }
        if (typ == "+") {
            node.setAttribute("d", " M " + (cx - ticklength) + " " + cy + " L " + (cx + ticklength) + " " + cy + " M " + cx + " " + (cy - ticklength) + " L " + cx + " " + (cy + ticklength));
            node.setAttribute("stroke-width", 1);
            node.setAttribute("stroke", axesstroke)
        } else {
            if (typ == "-") node.setAttribute("d", " M " + (cx - ticklength) + " " + cy + " L " + (cx + ticklength) + " " + cy);
            else node.setAttribute("d", " M " + cx + " " + (cy - ticklength) + " L " + cx + " " + (cy + ticklength));
            node.setAttribute("stroke-width", strokewidth);
            node.setAttribute("stroke", stroke)
        }
    } else {
        if (node == null) {
            node = makeSVG("circle", {id:id}, svgID);
        }
        node.setAttribute("cx", cx);
        node.setAttribute("cy", cy);
        node.setAttribute("r", dotradius);
        node.setAttribute("stroke-width", strokewidth);
        node.setAttribute("stroke", stroke);
    node.setAttribute("stroke-opacity", strokeopacity);
        node.setAttribute("fill", (typ == "open" ? "white" : stroke))
    node.setAttribute("fill-opacity", fillopacity);
    }
    if (label != null && label.length > 0) this.text(center, label, (pos == null ? "below" : pos), (id == null ? id : id + "label"))
//console.log(brdID, id)  
  if(typeof brdPropsArr[brdID][id] === 'undefined') {
    //console.log("hyarone")
    brdPropsArr[brdID][id] = [];
    brdPropsArr[brdID][id]["cart"] = [];
//console.log(brdPropsArr[brdID][id])
  }
  brdPropsArr[brdID][id]["cart"] = center;
}

this.ellipse = function(center,rx,ry,id) { // coordinates in units
  var node;
  if (id!=null) node = doc.getElementById(id);
  if(node == null) {
    node = makeSVG("ellipse", {
      "id":id,
      "cx":(center[0] * brdPropsArr[brdID]["XuL"] + brdPropsArr[brdID]["ox"]).toFixed(2),
      "cy":(brdPropsArr[brdID]["brdHeight"] - center[1] * brdPropsArr[brdID]["YuL"] - brdPropsArr[brdID]["oy"]).toFixed(2),
      "rx":rx*brdPropsArr[brdID]["XuL"],
      "ry":ry*brdPropsArr[brdID]["YuL"],
      "stroke":stroke,
      "stroke-width":strokewidth,               
      "stroke-opacity":strokeopacity,
      "fill":fill,
      "fill-opacity": fillopacity               
      }, svgID);  
  }  
}


this.draggablePtsSegLineJoiner = function(lineSeg, lineSegType, ptsArray, ptNamesArr ) {
  brdPropsArr[brdID][lineSeg] = ptNamesArr;
  strokewidth = segstrokewidth;
  if(lineSegType == "segment") {
    this.segment( ptsArray[0], ptsArray[1], lineSeg);
  } else {
    this.line( ptsArray[0], ptsArray[1], lineSeg);  
  }
  // So segment or line is on top of all other elements
  gebi(svgID).appendChild(gebi(lineSeg));
  strokewidth = dotstrokewidth;
  this.ASdot(ptsArray[0], dotradius, stroke, fill, ptNamesArr[0]);
  this.ASdot(ptsArray[1], dotradius, stroke, fill, ptNamesArr[1]);  
  brdPropsArr[brdID][ptNamesArr[0]][lineSegType] = lineSeg;
  brdPropsArr[brdID][ptNamesArr[1]][lineSegType] = lineSeg;
  gebi(ptNamesArr[0]).setAttribute("join-"+lineSegType, lineSeg);
  gebi(ptNamesArr[1]).setAttribute("join-"+lineSegType, lineSeg); 
  this.makeDraggable( gebi(ptNamesArr[0])); 
  this.makeDraggable( gebi(ptNamesArr[1]) );  
} 
  

this.line = function(p, q, id, strokedasharray) {
  this.setBoardParams(svgID);  
    var node;
    if (id) {
    node = doc.getElementById(id);
  } else {
    elementIdNum++;  
    id = svgID+"-line-"+elementIdNum; 
  }
    if (node == null) {
    node = makeSVG("path", {
      "id":id,
      "stroke":stroke,
      "stroke-width":strokewidth,               
      "stroke-opacity":strokeopacity,
      "fill":fill,
      "fill-opacity": fillopacity,
      "vector-effect": "non-scaling-stroke"     
      }, svgID);    
    }

    if (strokedasharray != null) node.setAttribute("stroke-dasharray", strokedasharray);
  if (shaperendering != null) node.setAttribute("shape-rendering", shaperendering);

  var xmin = brdPropsArr[brdID]["xMin"];
  var xmax = brdPropsArr[brdID]["xMax"];  
  var actualXmin = brdPropsArr[brdID]["actualXmin"];
  var actualXmax = brdPropsArr[brdID]["actualXmax"];
  
  var ymin = brdPropsArr[brdID]["yMin"];
  var ymax = brdPropsArr[brdID]["yMax"];  
  var actualYmin = brdPropsArr[brdID]["actualYmin"];
  var actualYmax = brdPropsArr[brdID]["actualYmax"];
  
  /////////////////////////////////
  //
  // VERTICAL line
  //
  ////////////////////////////////
  
  if(p[0] == q[0]) { // vertical line
    if(goToExtremities) {
      pStart = [p[0], actualYmin];
      pEnd = [p[0], actualYmax];
    } else {
      pStart = [p[0], ymin];
      pEnd = [p[0], ymax];      
    }
    p = pStart;
    q = pEnd;
    if(typeof brdPropsArr[brdID][id] === 'undefined') {
      brdPropsArr[brdID][id] = [];
      brdPropsArr[brdID][id]["vert"] = [p,q];
    }

  /////////////////////////////////
  //
  // HORIZONTAL line
  //
  ////////////////////////////////
    
  } else if(p[1] == q[1]) { // horizontal line
    if(goToExtremities) {
      pStart = [actualXmin, p[1]];
      pEnd = [actualXmax, q[1]];
    } else {
      pStart = [xmin, p[1]];
      pEnd = [xmax, q[1]];
    } 
  } else {
    var slope =  (q[1]-p[1]) / (q[0]-p[0]) ;
    if(goToExtremities) {
      yValueAtActualXmin = slope*(actualXmin - p[0]) + p[1];
      if(yValueAtActualXmin > actualYmin && yValueAtActualXmin < actualYmax) {
        var xStart = actualXmin;
        pStart = [xStart, yValueAtActualXmin];
      } else {
        var xStart = (actualYmin - p[1])/slope + p[0];
        pStart = [xStart, actualYmin];        
      }
      yValueAtActualXmax = slope*(actualXmax - q[0]) + q[1];
      if(yValueAtActualXmax > actualYmin && yValueAtActualXmax < actualYmax) {      
        var xEnd = actualXmax;
        pEnd = [xEnd, yValueAtActualXmax];
      } else {
        var xEnd = (actualYmax - q[1])/slope + q[0];
        pEnd = [xEnd, actualYmax];
      }
    } else {
      yValueAtXmin = slope*(xmin - p[0]) + p[1];
      if(yValueAtXmin > ymin && yValueAtXmin < ymax) {
        var xStart = xmin;
        pStart = [xStart, yValueAtXmin];
      } else {
        if(slope > 0) {
          var xStart = (ymin - p[1])/slope + p[0];
          pStart = [xStart, ymin];
        } else {
          var xStart = (ymax - p[1])/slope + p[0];
          pStart = [xStart, ymax];          
        }       
      }
      yValueAtXmax = slope*(xmax - q[0]) + q[1];
      if(yValueAtXmax > ymin && yValueAtXmax < ymax) {      
        var xEnd = xmax;
        pEnd = [xEnd, yValueAtXmax];
      } else {
        if(slope > 0) {
          var xEnd = (ymax - q[1])/slope + q[0];
          pEnd = [xEnd, ymax];
        } else {
          var xEnd = (ymin - q[1])/slope + q[0];
          pEnd = [xEnd, ymin];          
        }
      }     
    }
    p = pStart;
    q = pEnd;
  }
  node.setAttribute("d", "M" + (p[0] * xunitlength + origin[0]) + "," + (boardHeight - p[1] * yunitlength - origin[1]) + " " + (q[0] * xunitlength + origin[0]) + "," + (boardHeight - q[1] * yunitlength - origin[1] ));
  return node;  
}

this.segment = function(p, q, id, strokedasharray) {
//console.log(p,q)  
  this.setBoardParams(svgID);
  if( (p[0] > actualXmin && p[0] < actualXmax && p[1] > actualYmin && p[1] < actualYmax)
    ||  (q[0] > actualXmin && q[0] < actualXmax && q[1] > actualYmin && q[1] < actualYmax)  
    ||  ( (p[0]+q[0])/2 > actualXmin && (p[0]+q[0])/2 < actualXmax 
    ||  (p[1]+q[1])/2 > actualYmin && (p[1]+q[1])/2 < actualYmax) 
    ) {
    var node;
    if (id) {
      node = doc.getElementById(id);
    } else {
      elementIdNum++;  
      id = svgID+"-seg-"+elementIdNum; 
    }
    if (node == null) {
      node = makeSVG("path", {
        "id":id,
        "stroke":stroke,
        "stroke-width":strokewidth,               
        "stroke-opacity":strokeopacity,
        "fill":fill,
        "fill-opacity": fillopacity,
        "stroke-dasharray": strokedasharray,
        "vector-effect": "non-scaling-stroke"     
        }, svgID);    
    }
    if (strokedasharray != null) node.setAttribute("stroke-dasharray", strokedasharray);
    if (shaperendering != null) node.setAttribute("shape-rendering", shaperendering);
    slopeAng = arctan( (q[1]-p[1]) / (q[0]-p[0]));
    //"dotarrow" means start with dot, end with arrow
    //"arrowdot" means the arrow points to dot
    if (marker == "dotdot" || marker == "dotarrow" || marker == "dot" || marker == "arrowdot") {
      if(typeof firstDotClosed !== 'undefined' && firstDotClosed == 1) {
        mrkrfill = corpColor;
        fillopacity = 1;
      } else {
        mrkrfill = "none"; //markerfill;
        fillopacity = 0;
      }
      if(marker == "dotdot" || marker == "dotarrow" || marker == "dot") {
        this.ASdot(p, markersize, markerstroke, mrkrfill);  // First dot
      }
      // Need to reset this here
      fillopacity = 1;
      dotSpacerX = markersize * cos(slopeAng);
      dotSpacerY = markersize * sin(slopeAng);  
      if (marker == "dotdot" || marker == "arrowdot") {
        this.ASdot(q, markersize, markerstroke, markerfill);  // Second dot   
      }
      if (marker == "dotarrow" || marker == "arrowdot") {
        if (marker == "dotarrow") {
          this.arrowhead(p, q);
        } else {
          // Set some space between arrow head and dot
          dotSpacerX += 4 * Math.cos(slopeAng);
          dotSpacerY += 4 * Math.sin(slopeAng);
          if (p[0] > q[0]) {
            dotSpacerX = -dotSpacerX;
            dotSpacerY = -dotSpacerY;
          }       
          this.arrowhead(p, [q[0]-(dotSpacerX)/xunitlength, q[1]-(dotSpacerY)/yunitlength]);
        }
      }
    } else if  (marker == "arrow") {
      // NOO elementIdNum++;  
      // NOO id = svgID+"-ah-"+elementIdNum;    
      this.arrowhead(p, q, id+"-ah");
      dotSpacerX = 0; dotSpacerY = 0;  
    } else {
      dotSpacerX = dotSpacerY = 0;
    }
    node.setAttribute("d", "M" + (p[0] * xunitlength + origin[0] + dotSpacerX) + "," + (boardHeight - p[1] * yunitlength - origin[1] - dotSpacerY) + " " + (q[0] * xunitlength + origin[0] - dotSpacerX) + "," + (boardHeight - q[1] * yunitlength - origin[1] + dotSpacerY));
    return node;
  }
}

this.pathGivenD = function(d,id) {
    if (id!=null) {
      node = doc.getElementById(id);
    } else {
    elementIdNum++;  
    id = svgID+"-pathgd-"+elementIdNum;  
    }
  
  
  node = makeSVG("path", {
  "id":id,
  "stroke":stroke,
  "stroke-width":strokewidth,               
  "stroke-opacity":strokeopacity,
  "fill":fill,
  "fill-opacity": fillopacity,
  "vector-effect": "non-scaling-stroke"     
  }, svgID);
  node.setAttribute("d", d);
}

this.path = function(plist,id,c) {

//console.log(plist); 
    this.setBoardParams(svgID);
    if (c==null) c="";
    var node, st, i;
    if (id!=null) {
      node = doc.getElementById(id);
    } else {
    elementIdNum++;  
    id = svgID+"-path-"+elementIdNum;  
    }
    if (node==null) {
      node = makeSVG("path", {
        "id":id,
        "stroke":stroke,
        "stroke-width":strokewidth,               
        "stroke-opacity":strokeopacity,
        "fill":fill,
        "fill-opacity": fillopacity,
        "vector-effect": "non-scaling-stroke"     
        }, svgID);
    } 
    if (typeof plist === 'string') st = plist;
    else {
//console.log( id )
//console.log( plist.length)  
  //console.log(boardHeight)
  //console.log(origin[1], brdPropsArr[brdID]['actualYmin'], brdPropsArr[brdID]['actualYmax'])
    st = "M";
  //    st += (plist[0][0]*xunitlength+origin[0]).toFixed(2)+","+
  //          boardHeight, (boardHeight-plist[0][1]*yunitlength-origin[1]).toFixed(2)+" "+c;
  //console.log(plist[0][0]);     
    var curveLengthCart = 0;
    var curveLengthPix = 0;
    for (i=0; i<plist.length; i++) {
      if(plist[i][1] > brdPropsArr[brdID]["plotYmin"] && plist[i][1] < brdPropsArr[brdID]["plotYmax"]) {
        st += (plist[i][0]*xunitlength+origin[0]).toFixed(2)+","+
        (boardHeight-plist[i][1]*yunitlength-origin[1]).toFixed(2)+" ";
//console.log(st)       
      if(i>1) {
  //console.log( plist[i-1][0], plist[i-1][1] )     
  //console.log( plist[i-1][1], (boardHeight-plist[i][1]*yunitlength-origin[1]).toFixed(2));      
        curveLengthCart += pythag([plist[i-1][0], plist[i-1][1]], [plist[i][0], plist[i][1]]);
        curveLengthPix += pythag( [plist[i-1][0]*xunitlength+origin[0], boardHeight-plist[i-1][1]*yunitlength-origin[1]],
                    [plist[i][0]*xunitlength+origin[0], boardHeight-plist[i][1]*yunitlength-origin[1]] )
      }
      }
    }
    if(typeof brdPropsArr[brdID][id] === 'undefined') {
      brdPropsArr[brdID][id] = [];
    }
    brdPropsArr[brdID][id]["curveLenCart"] = curveLengthCart;
    brdPropsArr[brdID][id]["curveLenPix"] = curveLengthPix;

    }
//console.log("st = "+st, id, curveLength)
    node.setAttribute("d", st);
    node.setAttribute("stroke-width", strokewidth);
    if(typeof opacity !== 'undefined') {node.setAttribute("opacity", opacity);}
    node.setAttribute("vector-effect", "non-scaling-stroke");
    if (strokedasharray!=null) 
    node.setAttribute("stroke-dasharray", strokedasharray);
    if (strokedashoffset!=null) 
    node.setAttribute("stroke-dashoffset", strokedashoffset);
    if (marker=="dot" || marker=="arrowdot")
    for (i=0; i<plist.length; i++)
      if (c!="C" && c!="T" || i!=1 && i!=2)
      this.ASdot(plist[i],markersize,markerstroke,markerfill);

}

var x;
this.plot = function(fun, x_min, x_max, points, id) {

  // Revision pre-3.00: Remove "with(Math)" by revising mathjs().

  ///////////////////////////////////////////
  //
  // xmin, xmax are board minimum, maximum
  // x_min, x_max are graph domain limits
  // min, max are used in for(t=min;t<max...
  // 
  ////////////////////////////////////////////

  var pth = [];
  var f = function(x) {
    return x
  };
  var g = fun;
  var name = null;
  if (id!=null) {
    // For animation/slider cases where 2nd type is created (may need more...?)
    removeEle(id);
    removeEle(id+"-0"); 
    removeEle(id+"-1");     
  } else {
    elementIdNum++;  
    id = svgID+"-plot-"+elementIdNum;  
  }
  var idInc = 0;
  var graphFn = [];
  var q = [];
  brdID = boundingDiv.id;
  
  var xDomain = brdPropsArr[brdID]["xMax"] - brdPropsArr[brdID]["xMin"];
  var actualXmin = brdPropsArr[brdID]["actualXmin"];
  var actualXmax = brdPropsArr[brdID]["actualXmax"];
  
  var actualYmin = brdPropsArr[brdID]["actualYmin"];
  var actualYmax = brdPropsArr[brdID]["actualYmax"];

  
  var plotYmin = brdPropsArr[brdID]["plotYmin"];
  var plotYmax = brdPropsArr[brdID]["plotYmax"];

  var gtPrevPix = 0;
  var gtPix = 0;
  var gtNextPix = 0;
  var slopNextPix = 0;
  var slopPrevPix = 0;
  
  
  var pushBeforeYmin = true;
  
  // Y CASE!  YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY

  if (typeof fun === 'string' && fun.indexOf("y") > -1) {

    if (typeof fun === 'string') {
      eval("g = function(y){ return "+mathjs(fun)+"; }");
    } else if (typeof fun === 'object') {
      eval("f = function(t){ return "+mathjs(fun[0])+" }");
      eval("g = function(t){ return "+mathjs(fun[1])+" }");
    }
    if (typeof x_min === 'string') { name = x_min; x_min = xmin }
      else name = id; 

    var min = (x_min==null?xmin:x_min);
    var max = (x_max==null?xmax:x_max);

    var inc = max-min-0.000001*(max-min);
    inc = (points==null?inc/200:inc/points);
    var gt;
    for (var t = min; t <= max; t += inc) {
      gt = g(t);
      pth.push([gt, f(t) ]);  // Note reversal
    }


  } else {

    // X CASE! XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    
    /////////////////////////////////////////
    //
    // LOGIC
    //
    // CASE 0: If continuous and all within graph limits, plot it and give it id
    // CASE 1: Goes outside upper or lower graph limits - break and send to this.path() - give idInc extension for id
    
    var xPlotMin = 0;
    var xPlotMax = 0;


    if (typeof fun === 'string') {
      eval("g = function(x){ return " + mathjs(fun) + "; }");
    } else if (typeof fun === 'number') {
      eval("g = function(x){ return " + fun + "; }");
    } else if (typeof fun === 'object') {
      eval("f = function(t){ return " + mathjs(fun[0]) + "; }");
      eval("g = function(t){ return " + mathjs(fun[1]) + "; }");
    }
    if(plotBeyondXVis) { // For animation cases, e.g. standing wave: /trigonometric-graphs/6-composite-trigonometric-graphs.php
      xPlotMin = x_min;
      xPlotMax = x_max;
    } else {
      xPlotMin = Math.max(actualXmin, x_min);
      xPlotMax = Math.min(actualXmax, x_max);
    }
    var min = 1 * (x_min == null ? xmin : xPlotMin );
    var max = 1 * (x_max == null ? xmax : xPlotMax );
    var gt, gtRem = g(min),
      slopRem = 0,
      plotIt = false,
      plotted = false,
      changeSigns = false;
    var xDomain = max - min;
    var slop = 0;   
    var dom = 0.999999 * xDomain;
    var inc = (points == null ? dom / 250 : dom / points);    

    
    gtPrevPix = boardHeight - (origin[1] + g(min-inc) * yunitlength);
    gtPix = boardHeight - (origin[1] + g(min) * yunitlength);
    gtNextPix = boardHeight - (origin[1] + g(min+inc) * yunitlength);
    
    slopNextPix = (gtPix - gtNextPix)/inc;
    var slopPixRem = (gtPix - gtPrevPix)/inc;
    
    var pushFlag = false;
    var slopSwingFlag = false;

    if(typeof brdPropsArr[brdID][id] === 'undefined') {
      brdPropsArr[brdID][id] = [];
    }
    brdPropsArr[brdID][id]["minX"] = 1000000000;
    brdPropsArr[brdID][id]["maxX"] = -1000000000;
    brdPropsArr[brdID][id]["minY"] = 1000000000;
    brdPropsArr[brdID][id]["maxY"] = -1000000000;

    if( !plotBeyondYVis) {
      actualYmax = ymax;
      actualYmin = ymin;
    }
    
    // For testing
   var colorsArr = ["#f08","#0f8","#8f0","#f80","#08f","#80f","#338","#f8f","#f00","#0f0","#f0f","#5f5",
            "#f08","#0f8","#8f0","#f80","#08f","#80f","#338","#f8f","#f00","#0f0","#f0f","#5f5",
            "#f08","#0f8","#8f0","#f80","#08f","#80f","#338","#f8f","#f00","#0f0","#f0f","#5f5"];
    

    var incRem = inc;
    var incSub = 20;
    var inc = inc/incSub;
    var sub = 0;            
    
    for (t = min; t < max; t += inc) {
      
      /////////////////////
      //
      // Include "0"
      //
      /////////////////////

      if (t !== 0 && sign(t) == -1 && sign(t + inc) == 1) {
        if(sign(t) == -1) {
          t = -0.000000000001;
        }
      } 
      if (t !== 0 && sign(t-inc) == -1 && sign(t) == 1) {
        if(sign(t) == 1) {
          t = 0.0000000001;
        }
      }           
      var gtPrev = g(t-inc);
      gt = g(t);
      var gtNext = g(t+inc);
      var gtNextNext = g(t+2*inc);
      var slopCart = (gtRem - gt) / inc;
//console.log(t,gt)           
      gtPrevPix = boardHeight - (origin[1] + gtPrev * yunitlength);
      gtPix = boardHeight - (origin[1] + gt * yunitlength);
      gtNextPix = boardHeight - (origin[1] + gtNext * yunitlength);
      //      
      slopPrevPix = (gtPrevPix - gtPix)/inc;
      slopNextPix = (gtPix - gtNextPix) / inc;
      // many of these variables seem orphaned...
      var gtIsNum =  (!isNaN(gt) && Math.abs(gt)!="Infinity") ? true : false;
      var gtisLessPlotYmin = (gt < plotYmin) ? true : false;
      var gtBetweenMins = (gt > plotYmin && gt < actualYmin) ? true : false;      
      var aveMins = 0.5*(plotYmin + actualYmin);      
      var gtPrevVis = (gtPrev > actualYmin && gtPrev < actualYmax) ? true : false;
      var gtVis = (gt > actualYmin && gt < actualYmax) ? true : false;      
      var gtNextVis = (gtNext > actualYmin && gtNext < actualYmax) ? true : false;      
      var gtBetweenMaxs = (gt > actualYmax && gt < plotYmax) ? true : false;
      var gtisMorePlotYmax = (gt > plotYmax) ? true : false;      
      var aveMaxs = 0.5*(actualYmax + plotYmax);      
      slopSwingFlag = false;
      
      
      if( Math.abs(slopPrevPix)>500 && Math.abs(slopNextPix)>500 && sign(slopPrevPix) != sign(slopNextPix) ) {
        slopSwingFlag = true;
      }
      
      
      if(gt == "-Infinity") {
        pth.push([t, plotYmin+0.00001]);
      }
      if(gt == "Infinity") {
        pth.push([t, plotYmax-0.00001]);
      }
      
      ////////////////////////////////////
      //
      // MAIN push
      //
      ////////////////////////////////////
      
      if(gt > plotYmin && gt < plotYmax) {
        if(sub%incSub == 0 
          || (slopPrevPix < -400 && gt > plotYmin)
          || (slopPrevPix > 400 && gt < plotYmax) ) {
          pth.push([t, gt]);
          
          /*dotradius = 1.5;
          stroke = "#165a71";
          strokewidth = 1.5;                    
          this.dot([t,gt]);*/
        }
        sub++;
      } else {
        if(pth.length > 2) {
          
          //stroke = colorsArr[idInc];
//console.log("pthLen=",pth.length) 
//console.log("id="+typeof id) 
          if(typeof id === 'string') {
            // If given id, applies for first arm of graph only
            // Subsequent ids are generated by this.path() fn.
            this.path(pth, id);
            id = null;
          } else {
            this.path(pth);
          }
          pth = [];
          plotted = true;
          pushBeforeYmin = true;
          idInc++;
          sub = 0;
        }
      }

    }
  }

  if (pth.length > 1) {
//console.log(id) 
//console.log("pthLenEnd=",pth.length)  
    this.path(pth, id);   
    pth = [];
  } else if (plotted === false) {
    console.log("There are no points to plot. Are your xMin, xMax and yMin, yMax positioned correctly?");
  }
}

this.polygon = function(ptsArr,id) { 
  var node;
  if (id!=null) {
    node = doc.getElementById(id);
  } else {
  elementIdNum++;  
  id = svgID+"-rect-"+elementIdNum;  
  }
  if (node==null) {
    node = makeSVG("polygon", {id:id}, svgID);
  }
  var ptsTxt = '';
  for(var i=0; i<ptsArr.length; i++ ) {   
    ptsTxt += (ptsArr[i][0]*xunitlength+origin[0]).toFixed(2) + "," + (boardHeight-ptsArr[i][1]*yunitlength-origin[1]).toFixed(2) + " ";
  }  
  node.setAttribute("points", ptsTxt);
  node.setAttribute("stroke-width", strokewidth);
  node.setAttribute("stroke-opacity", strokeopacity);
  node.setAttribute("stroke", stroke);
  node.setAttribute("fill", fill);
  node.setAttribute("fill-opacity", fillopacity);
}

this.rect = function(p,q,id,rx,ry) { // opposite corners in units, rounded by radii
  var node;
  if (id!=null) {
    node = doc.getElementById(id);
  } else {
  elementIdNum++;  
  id = svgID+"-rect-"+elementIdNum;  
  }   
  if (node==null) {
    node = makeSVG("rect", {id:id}, svgID);
  }
  node.setAttribute("x",(p[0]*xunitlength+origin[0]).toFixed(2));
  node.setAttribute("y",(boardHeight-q[1]*yunitlength-origin[1]).toFixed(2));
  node.setAttribute("width",((q[0]-p[0])*xunitlength).toFixed(2));
  node.setAttribute("height",((q[1]-p[1])*yunitlength).toFixed(2));
  if (rx!=null) node.setAttribute("rx",(rx*xunitlength).toFixed(2));
  if (ry!=null) node.setAttribute("ry",(ry*yunitlength).toFixed(2));
  node.setAttribute("stroke-width", strokewidth);
  node.setAttribute("stroke", stroke);
  node.setAttribute("fill", fill);
  node.setAttribute("fill-opacity", fillopacity);
}

function strip_tags(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent||tmp.innerText;
}

this.text = function(p,str,pos,id,fontsty,fontfam) {
//console.log("hyar: "+id, p, str); 


  xunitlength = brdPropsArr[brdID]["XuL"];
  yunitlength = brdPropsArr[brdID]["YuL"];
  if(typeof fontsty === 'undefined'){
    fontsty = '';
  }
    var textanchor = "middle";
    var dx = 0; var dy = fontsize/3;
    if (pos!=null) {
    if (pos.slice(0,5)=="above") dy = -fontsize/2;
    if (pos.slice(0,5)=="below") dy = fontsize+4;
    if (pos.slice(0,5)=="right" || pos.slice(5,10)=="right") {
      textanchor = "start";
      dx = fontsize/2;
    }
    if (pos.slice(0,4)=="left" || pos.slice(5,9)=="left") {
      textanchor = "end";
      dx = -fontsize/2;
    }
    }
  
  ////////////////////////////////////////
  //
  // HTML text
  //
  /////////////////////////////////////////
  var strTxt = strip_tags(str); // Test for HTML tags or entities
  
  if( isNaN(str) && str.length != strTxt.length) {
    newDiv = document.createElement('div');
      
    newDiv.id = id;
    newDiv.className = "svgHtml intmath";
    newDiv.setAttribute("style", "position:absolute;top:"+ Math.round(boardHeight - p[1]*yunitlength - origin[1]-padding + dy)+"px;left:"+ Math.round(p[0]*xunitlength+origin[0] + dx - 5) +"px;"+fontsty);
    if(str == "&nbsp;") {
      str = '';
    }
    newDiv.innerHTML = str;
    boundingDiv = gebi(brdID);
    boundingDiv.appendChild(newDiv);
    
  ////////////////////////////////////////
  //
  // SVG text
  //
  /////////////////////////////////////////   
  } else { 
    var node;
    if (id!=null ) {
      node = document.getElementById(id);
    } else {
    elementIdNum++;  
    id = svgID+"-text-"+elementIdNum;  
    }
    if (node==null) {
    node = makeSVG("text", {id:id}, svgID);
    }
    node.textContent = strTxt;
    node.setAttribute("x",(p[0]*xunitlength+origin[0]+dx).toFixed(2));
    node.setAttribute("y",(boardHeight-p[1]*yunitlength-origin[1]+dy).toFixed(2));
    if(fontsty!=null) {
    node.setAttribute("style",((fontsty!=null && typeof fontsty !== 'undefined')?fontsty:fontstyle));
    }
    
    node.setAttribute("class", txtLabelsClass);
    if(id.indexOf("AxVbl") > -1) { // For axes labels
    var fs = 16;
    } else {
     fs = fontsize;
    } 

    // Need to set this as style, to override page CSS
    node.setAttribute("style", "font-size:"+fs+"px");
    node.setAttribute("font-weight",fontweight);
    node.setAttribute("text-anchor",textanchor);
    if (fontstroke!="none") node.setAttribute("stroke",fontstroke);
    if (fontfill!="none") node.setAttribute("fill",fontfill);
  }

    return p;
}

///////////////////////////////////////
//
// String and "nice" math functions
//
///////////////////////////////////////

function chopZ(st) {
  var k = st.indexOf(".");
  if (k==-1) return st;
  for (var i=st.length-1; i>k && st.charAt(i)=="0"; i--);
  if (i==k) i--;
  return st.slice(0,i+1);
}

// temp expose for debug
function mathjs(st) {
// this.mathjs = function(st) {

  // Revision pre-3.00: Add Math. to all relevant values.

  // Translate a math formula to js function notation
  // e.g. a^b --> pow(a,b), na --> n*a, (...)d --> (...)*d
  // n! --> factorial(n), sin^-1 --> arcsin etc.
  // While ^ in string, find term on left and right slice and concat new formula string
  
  st = st.replace(/\s/g,"");
  if (st == "e") return "Math.E";
  
  st = st.replace(/((?:sin|cos|tan|sec|csc|cot)[h]?)\^(?:-1|\(-1\))/g,"arc$1");
  st = st.replace(/^e([^a-z])/gi,"(E)$1");
  st = st.replace(/([^a-z])e([^a-z])/gi,"$1(E)$2");
  st = st.replace(/(\d)([\(a-z])/gi,"$1*$2");
  st = st.replace(/\)([\(\da-z])/gi,"\)*$1");
  st = st.replace(/log/g,"Math.log10");

  var i,j,k, ch, nested;
  while ((i=st.indexOf("^"))!=-1) {
    //find left argument
    if (i==0) return "Error: missing argument";
    j = i-1;
    ch = st.charAt(j);
    if (ch>="0" && ch<="9") {// look for (decimal) number
      j--;
      while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      if (ch==".") {
        j--;
        while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      }
    } else if (ch==")") {// look for matching opening bracket and function name
      nested = 1;
      j--;
      while (j>=0 && nested>0) {
        ch = st.charAt(j);
        if (ch=="(") nested--;
        else if (ch==")") nested++;
        j--;
      }
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
      j--;
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else { 
      return "Error: incorrect syntax in "+st+" at position "+j;
    }
    //find right argument
    if (i==st.length-1) return "Error: missing argument";
    k = i+1;
    ch = st.charAt(k);
    if (ch>="0" && ch<="9" || ch=="-") {// look for signed (decimal) number
      k++;
      while (k<st.length && (ch=st.charAt(k))>="0" && ch<="9") k++;
      if (ch==".") {
        k++;
        while (k<st.length && (ch=st.charAt(k))>="0" && ch<="9") k++;
      }
    } else if (ch=="(") {// look for matching closing bracket and function name
      nested = 1;
      k++;
      while (k<st.length && nested>0) {
        ch = st.charAt(k);
        if (ch=="(") nested++;
        else if (ch==")") nested--;
        k++;
      }
    } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
      k++;
      while (k<st.length && (ch=st.charAt(k))>="a" && ch<="z" ||
               ch>="A" && ch<="Z") k++;
    } else { 
      return "Error: incorrect syntax in "+st+" at position "+k;
    }
    st = st.slice(0,j+1)+"Math.pow("+st.slice(j+1,i)+","+st.slice(i+1,k)+")"+
           st.slice(k);
  }

  while ((i=st.indexOf("!"))!=-1) {
    //find left argument
    if (i==0) return "Error: missing argument";
    j = i-1;
    ch = st.charAt(j);
    if (ch>="0" && ch<="9") {// look for (decimal) number
      j--;
      while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      if (ch==".") {
        j--;
        while (j>=0 && (ch=st.charAt(j))>="0" && ch<="9") j--;
      }
    } else if (ch==")") {// look for matching opening bracket and function name
      nested = 1;
      j--;
      while (j>=0 && nested>0) {
        ch = st.charAt(j);
        if (ch=="(") nested--;
        else if (ch==")") nested++;
        j--;
      }
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else if (ch>="a" && ch<="z" || ch>="A" && ch<="Z") {// look for variable
      j--;
      while (j>=0 && (ch=st.charAt(j))>="a" && ch<="z" || ch>="A" && ch<="Z")
        j--;
    } else { 
      return "Error: incorrect syntax in "+st+" at position "+j;
    }
    st = st.slice(0,j+1)+"factorial("+st.slice(j+1,i)+")"+st.slice(i+1);
  }
  return st;
}

// TEMP FUNCTION DELETEME
// this.mathjs2 = function(st) {
//  st = st.replace(/\s/g,"");
//  if (st == "e") return "Math.E";
//  st = st.replace(/((?:sin|cos|tan|sec|csc|cot)[h]?)\^(?:-1|\(-1\))/g,"arc$1");
//  st = st.replace(/^e([\(a-z])/gi,"(Math.E)*$1")
//  st = st.replace(/([^a-z])e([^a-z])/gi,"$1*(Math.E)*$2")
//  st = st.replace(/(\d)([\(a-z])/gi,"$1*$2")
//  st = st.replace(/\)([\(a-z])/gi,")*$1")
//  st = st.replace(/log/g,"Math.log10");
//  return st;
// }

// TEMP FUNCTION DELETEME
// this.mathjstest = function(str) {
//  var oldMJS = this.mathjs(str);
//  ASVG.log.info(`Old: ${oldMJS}`);
//  var newMJS = this.mathjs2(str);
//  ASVG.log.info(`New: ${newMJS}`);
// }


///////////////////////////////////////
//
// Resize throttler
//
///////////////////////////////////////   

window.addEventListener("resize", resizeThrottler, false);
var resizeTimeout, actualResizeHandler;
function resizeThrottler() {
  if (!resizeTimeout) {
    resizeTimeout = setTimeout(function() {
      resizeTimeout = null;
      if(typeof actualResizeHandler === 'function') {
        actualResizeHandler();
      }
    }, 200);
  }
}


///////////////////////////////////////
//
// InitBoard and axes
//
///////////////////////////////////////

this.axes = function(dx,dy,labels,gdx,gdy) {  

//console.log("brdID = "+brdID)
//clog(brdPropsArr[brdID],2094);
  
  //////////////////////////////////////////
  //
  // dx for ticks and labels on horiz axis
  // dy for ticks and labels on vert axis 
  // labels can be any text - "labels" (for showing labels) or null to hide labels  
  // gdx for grids horiz axis (null turns them off)
  // gdy for grids on vert axis (null turns them off)
  //
  ///////////////////////////////////////////
  
  var nanObj = {dx:dx,dy:dy,gdx:gdx};
  for (var name in nanObj){
    if(isNaN(nanObj[name]) || typeof nanObj[name] === 'undefined') {
      console.log(name + " is not a number! Aborting...");
      return;
    }
  } 

  if(dx==null && dy==null) {
    doAxes=0;
  }
  
  if(gdx==null && gdy==null) {
    doGrids=0;
  } 

  var x, y, ldx, ldy, lx, ly, lxp, lyp, pnode, st;
//  if (typeof dx === 'string') { labels = dx; dx = null; }
//  if (typeof dy === 'string') { gdx = dy; dy = null; }
  dx = (dx==null?xunitlength:dx*xunitlength);
  dy = (dy==null?dx:dy*yunitlength);
  fontsize = Math.max(12, Math.min(dx/2,dy/2,fontsize));
  ticklength = fontsize/4;

  // Grids
  if(doGrids == 1) {
    gdx = ((typeof gdx === 'string')?dx:gdx*xunitlength);
    gdy = (gdy==null?dy:gdy*yunitlength);
    pnode = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    
    st="";      
    if (gdx!==null && gdx!== 0 && gdx > 0) {  
      for (x = origin[0]; x<boardWidth; x = x+gdx)
        st += " M"+x.toFixed(2)+",0"+" "+x.toFixed(2)+","+boardHeight.toFixed(2);   
      for (x = origin[0]-gdx; x>0; x = x-gdx)
        st += " M"+x.toFixed(2)+",0"+" "+x.toFixed(2)+","+boardHeight.toFixed(2);
    } else {
      console.log("Is your gdx null or otherwise strange? Aborting...");
      return;
    }
    if (gdy!==null && gdy!== 0 && gdy > 0 ) { 
      if( showYaxis == 1) {
        if(gdy > 0 ) {
          for (y = boardHeight-origin[1]; y<boardHeight-0.99*padding; y = y+gdy){
          st += " M0,"+y.toFixed(2)+" "+boardWidth+","+y.toFixed(2);        
          }
        }
        for (y = boardHeight-origin[1]-gdy; y>0.99*padding; y = y-gdy) {
          st += " M0,"+y.toFixed(2)+" "+boardWidth+","+y.toFixed(2);    
        }
      }
    } else {
      console.log("Is your yMax less than your yMin? Aborting...");
      return;
    }
    
    pnode.setAttribute("d",st);
    pnode.setAttribute("stroke-width", 1);
    pnode.setAttribute("shape-rendering", "crispEdges");  
    pnode.setAttribute("stroke", gridstroke);
    pnode.setAttribute("fill", fill);
    theSVG.appendChild(pnode);
  }
  
  if(doAxes == 1) {
    st = "";
    // Axes
    pnode = document.createElementNS('http://www.w3.org/2000/svg', "path");
    // xAxis
    st += "M0,"+(boardHeight-origin[1]).toFixed(2)+" "+boardWidth.toFixed(2)+","+(boardHeight-origin[1]).toFixed(2);

    // yAxis
    if(showYaxis == 1) {
      st += " M"+origin[0].toFixed(2)+",0 "+origin[0].toFixed(2)+","+boardHeight.toFixed(2);
    }

    if(dx !== null && dx > 0) {
      for (x = origin[0]+dx; x<boardWidth; x = x+dx) {
        st += " M"+x.toFixed(2)+","+(boardHeight-origin[1]+ticklength).toFixed(2)+" "+x.toFixed(2)+","+
          (boardHeight-origin[1]-ticklength).toFixed(2);
      }
      for (x = origin[0]-dx; x>0; x = x-dx) {
        st += " M"+x.toFixed(2)+","+(boardHeight-origin[1]+ticklength).toFixed(2)+" "+x.toFixed(2)+","+
          (boardHeight-origin[1]-ticklength).toFixed(2);
      }

      if (showYaxis == 0) {
        st += " M"+origin[0].toFixed(2)+","+(boardHeight-origin[1]+ticklength).toFixed(2)+" "+origin[0].toFixed(2)+", "+(boardHeight-origin[1]-ticklength).toFixed(2);
      }     
    }

    if(dy !== null && dy > 0 && showYaxis == 1) {
      for (y = boardHeight-origin[1]+dy; y<boardHeight-0.99*padding; y = y+dy) {
        st += " M"+(origin[0]+ticklength).toFixed(2)+","+y.toFixed(2)+" "+(origin[0]-ticklength).toFixed(2)+","+y.toFixed(2);       
      }
      for (y = boardHeight-origin[1]-dy; y>0.99*padding; y = y-dy) {  
        st += " M"+(origin[0]+ticklength).toFixed(2)+","+y.toFixed(2)+" "+(origin[0]-ticklength).toFixed(2)+","+y.toFixed(2);     
      } 
    }

    pnode.setAttribute("d",st);
    pnode.setAttribute("stroke-width", 1);
    pnode.setAttribute("shape-rendering", "crispEdges");
    pnode.setAttribute("stroke", axesstroke);
    pnode.setAttribute("fill", fill);
    theSVG.appendChild(pnode);  

    // Axes labels
    
    if (labels!=null && labels!="none") {
      ldx = dx/xunitlength;
      ldy = dy/yunitlength; 
      lx = (xmin>0 || xmax<0?xmin:0);
      ly = (ymin>0 || ymax<0?ymin:0);
      lxp = (ly==0?"below":"above");
      lyp = (lx==0?"left":"right");
      if (gdx!==null && gdx!== 0) {
        var ddx = Math.floor(1.1-Math.log(ldx)/Math.log(10))+2;
        for (x = ldx; x<=xmax; x = x+ldx) {
          this.text([x,ly],chopZ(x.toFixed(ddx)),lxp);        
        }
        for (x = -ldx; xmin<=x; x = x-ldx)
          this.text([x,ly],chopZ(x.toFixed(ddx)),lxp);

        if (showYaxis == 0) {
          this.text([0,ly],0,lxp);
        }       
      }
      if (gdy!==null && gdy!== 0) { 
        var ddy = Math.max(0, Math.floor(1.1-Math.log(ldy)/Math.log(10))+2);     
        if(ddy < 0) {
          console.log("ddy is < 0. Aborting...");
          return;
        }
        if (showYaxis == 1) {
          for (y = ldy; y<=ymax; y = y+ldy) {
            this.text([lx,y],chopZ(y.toFixed(ddy)),lyp);
          }
          for (y = -ldy; ymin<=y; y = y-ldy)
            this.text([lx,y],chopZ(y.toFixed(ddy)),lyp);
        } 
      }
    } //syntax: this.text(p,str,pos,id,fontsty,fontfam)... Complains if id set

    if(typeof xAxisVble === 'undefined') {
      xAxisVble = window.xAxisVble;
    }
    if(typeof yAxisVble === 'undefined') {
      yAxisVble = window.yAxisVble;
    }
    // Set for axisVbles
    txtLabelsClass = "intmathItalic";
    this.text([xmax+(padding-10)/xunitlength,0],xAxisVble,"above",svgID+"xAxVbl","",'KaTeX_Math,"Times New Roman",Times,serif'); // x-axis label
    if( showYaxis == 1) {
      this.text([0,ymax+(padding-10)/yunitlength],yAxisVble,"right",svgID+"yAxVbl","",'KaTeX_Math,"Times New Roman",Times,serif'); // y-axis label
    }
    // Set back for any additional text
    txtLabelsClass = "intmath";
    markerstrokewidth = 0.5;
    stroke = "#555";
    this.arrowhead([0,0],[xmax+padding/xunitlength,0],"xaxisArr");
    if( showYaxis == 1) {
      this.arrowhead([0,0],[0,ymax+padding/yunitlength],"yaxisArr");
    }

  }
}

this.initBoard = function(divID, x_min,x_max,y_min,y_max) {
  boundingDiv = gebi(divID);
  boundingDiv.style.position = "relative";
  boardWidth = boundingDiv.clientWidth;
  boardHeight = Math.round(boardWidthToHeight * boardWidth);
  // Positions from browser boundaries
  boardLeft = boundingDiv.getBoundingClientRect().left;
  boardTop = boundingDiv.getBoundingClientRect().top;
  svgID = divID+'SVG';
  brdID = divID// boundingDiv.id;
  makeSVG('svg', {id:svgID, width:boardWidth, height:boardHeight}, brdID);
  theSVG = gebi(svgID);
  // For use with DRAG (deprecated):
  currCartMatrix[brdID] = [];
  //////////////////////////////////////
  //
  // Defaults for all boards on a page
  //
  //////////////////////////////////////
  strokewidth = "1"; // pixel
  strokedasharray = null;
  stroke = "black"; // default line color
  fill = "none";    // default fill color
  fontstyle = "normal"; // default shape for text labels
  fontfamily = 'KaTeX_Main,"Times New Roman",Times,serif';  //"Georgia, times, serif"; // default font
  
//console.log("init = "+fontsize) 
  
  //fontsize = "16";      // default size
  fontweight = "normal";
  fontstroke = "none";  // default font outline color
  fontfill = "none";    // default font color
  marker = "none";
//dotDraggable = false; // Has to be explicity turned on for each board
  //  
  ymax = null;
  xmin = x_min;
  xmax = x_max;
  ymin = y_min;
  ymax = y_max;
  if(xmin >= xmax) { xmax++;}
  if(ymin >= ymax && ymax!=null) { ymax++; }
  xunitlength = (boardWidth-2*padding)/(xmax-xmin);
//console.log(brdID, xunitlength) 
  yunitlength = xunitlength;  
  if (ymax==null) { // Equally scaled axes case
    ymax = ymin + (boardHeight - 2*padding)/yunitlength;
  } else {
    yunitlength = (boardHeight-2*padding)/(ymax-ymin);
  }
  origin = [-xmin*xunitlength+padding,-ymin*yunitlength+padding];
  
  /************************************************/
  /*** deprecated ***/
  boardPropsArr[brdID+"xMin"] = xmin;
  boardPropsArr[brdID+"yMin"] = ymin;
  boardPropsArr[brdID+"xMax"] = xmax;
  boardPropsArr[brdID+"yMax"] = ymax; 
  boardPropsArr[brdID+"Width"] = boardWidth;
  boardPropsArr[brdID+"Height"] = boardHeight;
  /*** deprecated ***/
  boardPropsArr[brdID+"Left"] = boardLeft;
  boardPropsArr[brdID+"Top"] = boardTop;  
  boardPropsArr[brdID+"XuL"] = xunitlength;
  boardPropsArr[brdID+"YuL"] = yunitlength;
  /*** deprecated ***/
  boardPropsArr[brdID+"ox"] = origin[0];
  boardPropsArr[brdID+"oy"] = origin[1];
  boardPropsArr[brdID+"pad"] = padding;
  /*** deprecated ***/
  /************************************************/
  
  
  //console.log(boardPropsArr)  
  
  /*** current ***/
  
  brdPropsArr[brdID] = [];
  brdPropsArr[brdID]["xMin"] = xmin;
  brdPropsArr[brdID]["yMin"] = ymin;
  brdPropsArr[brdID]["actualXmin"] = xmin - padding/xunitlength;
  brdPropsArr[brdID]["actualYmin"] = ymin - padding/yunitlength;
  
  brdPropsArr[brdID]["xMax"] = xmax;
  brdPropsArr[brdID]["yMax"] = ymax;
  brdPropsArr[brdID]["actualXmax"] = xmax + padding/xunitlength;
  brdPropsArr[brdID]["actualYmax"] = ymax + padding/yunitlength;
  
  var yRange = brdPropsArr[brdID]["yMax"] - brdPropsArr[brdID]["yMin"];
  var extendAmt = 0.25; // Plot within this % either side of actual vertical limits
  var plotYmin = brdPropsArr[brdID]["actualYmin"] - extendAmt*yRange;
  var plotYmax = brdPropsArr[brdID]["actualYmax"] + extendAmt*yRange;

  brdPropsArr[brdID]["plotYmin"] = plotYmin;
  brdPropsArr[brdID]["plotYmax"] = plotYmax;  
    
  brdPropsArr[brdID]["brdWidth"] = boardWidth;
  brdPropsArr[brdID]["brdHeight"] = boardHeight;
  brdPropsArr[brdID]["Left"] = boardLeft;
  brdPropsArr[brdID]["Top"] = boardTop; 
  brdPropsArr[brdID]["XuL"] = xunitlength;
  brdPropsArr[brdID]["YuL"] = yunitlength;
  brdPropsArr[brdID]["ox"] = origin[0];
  brdPropsArr[brdID]["oy"] = origin[1];
  brdPropsArr[brdID]["pad"] = padding;
  
  // Global name space (defined outside this function)
  brdPropsNS = brdPropsArr[brdID];
  
//console.log(brdID, svgID)
//clog(brdPropsArr[brdID],2372);  
  var boardBG = makeSVG('rect', {
        id:"brdBg_"+brdID, x:0, y:0, width:boardWidth+"px", height:boardHeight+"px", 
        stroke:'none', fill: 'white'}, svgID);

  console.log(brdPropsArr); // DEBUGGING DELETEME

  return theSVG;
}

this.updateGlobals = function(fnString) {
  return (Function(fnString))();
}

}).apply(this.V2);

}).apply(ASVG);