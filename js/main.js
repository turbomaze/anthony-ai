/*******************\
|    anthony.ai     |
| @author Anthony   |
| @version 0.1      |
| @date 2014/07/28  |
| @edit 2014/07/28  |
\*******************/

var anthony = {};
anthony.ai = (function() {
  'use strict';

  // config
  var DIMS = [400, 400];
  var IMAGE_WIDTH = 400;
  var NUM_INIT_POINTS = 3016;
  var NUM_INIT_EDGES = 500;
  var MAX_POINT_RAD = 3;
  var FPS = 30;

  // work variables
  var canvas;
  var ctx;
  var facePixels;
  var facePoints;
  var edges;

  // work functions
  function initAnthonyAI() {
    // get the pixels of the face
    Crush.getPixelsFromImage(
      'assets/images/anthony.png',
      IMAGE_WIDTH,
      function(pixels) {
        // set the pixels
        facePixels = pixels;
        facePoints = getNPointsFromPixels(
          NUM_INIT_POINTS, facePixels.data
        );
        edges = getEdgesFromPoints(
          NUM_INIT_EDGES, facePoints
        );

        // initialize canvas stuff
        canvas = $s('#canvas');
        canvas.width = DIMS[0];
        canvas.height = DIMS[1];
        ctx = canvas.getContext('2d');

        Crush.registerDynamicCanvas(
          canvas,
          render
        );

        render(true);
      }
    );
  }

  function render(repeat) {
    // clear the canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw the picture
    // ctx.putImageData(facePixels, canvas.width/2 - IMAGE_WIDTH/2 , 0);

    // handle the points
    handlePoints();

    // handle the edges
    handleEdges();

    if (repeat === true) {
      setTimeout(function() {
        render(true); 
      }, 1000/FPS);
    }
  }

  function handlePoints() {
    for (var i = 0; i < facePoints.length; i++) {
      // draw the point
      var point = facePoints[i];
      var size = point[0];
      var pos = [
        point[3][0] + canvas.width/2 - IMAGE_WIDTH/2,
        point[3][1]
      ];
      var boundedX = Math.min(
        Math.max(Math.floor(point[3][0]), 0), IMAGE_WIDTH-1
      );
      var boundedY = Math.min(
        Math.max(Math.floor(point[3][1]), 0),
        facePixels.data.length/(4*IMAGE_WIDTH)
      );
      var idx = 4*(boundedY*IMAGE_WIDTH + boundedX);
      var color = [
        facePixels.data[idx+0],
        facePixels.data[idx+1],
        facePixels.data[idx+2],
        facePixels.data[idx+3]
      ];
      Crush.drawPoint(ctx, pos, size, Crush.getColorStr(color));

      // slow down based on the distance
      var dist = getMagnitude([
        point[1][0]-point[3][0],
        point[1][1]-point[3][1]
      ]);
      var thresh = 10;
      if (dist > thresh) {
        // accelerate towards the original position
        point[5][0] += (point[1][0]-point[3][0])/4;
        point[5][1] += (point[1][1]-point[3][1])/4;
      } else {
        // accelerate the point
        var mag = 0.2;
        facePoints[i][5][0] += mag*Math.random() - mag/2;
        facePoints[i][5][1] += mag*Math.random() - mag/2;
      }

      // move the point
      var mag = 0.5*getMagnitude([point[5][0], point[5][1]]);
      facePoints[i][3][0] += point[5][0]/mag;
      facePoints[i][3][1] += point[5][1]/mag;
    }
  }

  function handleEdges() {
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      var a = facePoints[edge[0]];
      var b = facePoints[edge[1]];
      var color = getMiddleColor(a[2], b[2]);
      Crush.drawLine(
        ctx, [
          a[3][0] + canvas.width/2 - IMAGE_WIDTH/2,
          a[3][1]
        ], [
          b[3][0] + canvas.width/2 - IMAGE_WIDTH/2,
          b[3][1]
        ], 'rgba(100, 100, 100, 0.2)', 0.001
      );
    }
  }

  function getNPointsFromPixels(n, pixels) {
    var points = [];
    for (var i = 0; i < n; i++) {
      points.push(getPointFromPixels(pixels));
    }
    return points;
  }

  function getEdgesFromPoints(n, points) {
    var edges = [];
    for (var i = 0; i < n; i++) {
      var idxA = Math.floor(Math.random()*points.length);
      var idxB = Math.floor(Math.random()*points.length);
      var pointA = points[idxA];
      var pointB = points[idxB];
      var dist = getMagnitude([
        pointA[3][0]-pointB[3][0],
        pointA[3][1]-pointB[3][1]
      ]);
      var threshold = 150;
      if (dist < threshold) {
        edges.push([idxA, idxB]);
      }
    }
    return edges;
  }

  function getPointFromPixels(pixels) {
    var idx = Math.floor(Math.random()*(pixels.length/4));
    var color = [
      pixels[4*idx], pixels[4*idx+1], pixels[4*idx+2], pixels[4*idx+3]
    ];
    // skip white
    if (getMagnitude(color) > getMagnitude([250,250,250,255])) {
      return getPointFromPixels(pixels);
    } else {
      var x = idx % IMAGE_WIDTH;
      var y = Math.floor(idx/IMAGE_WIDTH);
      return [
        // size
        Math.random() * MAX_POINT_RAD,

        // original position
        [x, y],

        // original color
        color,

        // current position
        [x, y],

        // current color
        color,

        // current velocity
        [0.2*Math.random()-0.1, 0.2*Math.random()-0.1]
      ];
    }
  }

  // helper functions
  function getMiddleColor(a, b) {
    return a.map(function(comp, idx) {
      return (comp + b[idx])/2;
    });
  }
 
  function getMagnitude(v) {
    return Math.sqrt(v.reduce(function(a, b) {
      return a + b*b;
    }, 0));
  }

  function $s(id) { //for convenience
    if (id.charAt(0) !== '#') return false;
    return document.getElementById(id.substring(1));
  }

  return {
    init: initAnthonyAI
  };
})();

window.addEventListener('load', anthony.ai.init);
