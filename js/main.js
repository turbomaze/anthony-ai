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
  var NUM_INIT_POINTS = 1618;
  var MAX_POINT_RAD = 3;
  var FPS = 30;
	var MAX_VEL = 2;

  // work variables
  var canvas;
 	var ctx;
  var facePixels;
  var facePoints;
  var edges;
  var adjacencyList;

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
        edges = getEdgesFromPoints(facePoints);
				adjacencyList = getAdjacencyListFromEdges(edges);

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
    // ctx.putImageData(
		// 	facePixels, canvas.width/2 - IMAGE_WIDTH/2 , 0
		// );

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
      // get the point's state
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

      // update its current color and draw it
      var idx = 4*(boundedY*IMAGE_WIDTH + boundedX);
      facePoints[i][4] = [
        facePixels.data[idx+0],
        facePixels.data[idx+1],
        facePixels.data[idx+2],
        facePixels.data[idx+3]
      ];
      Crush.drawPoint(
        ctx, pos, size, Crush.getColorStr(facePoints[i][4])
      );

      // slow down based on the distance
      var dist = getMagnitude([
        point[1][0]-point[3][0],
        point[1][1]-point[3][1]
      ]);
      var thresh = 5;
      if (dist > thresh) {
        // accelerate towards the original position
        point[5][0] += (point[1][0]-point[3][0])/8;
        point[5][1] += (point[1][1]-point[3][1])/8;
      }

      // accelerate the point based on neighbors
			var force = getForce(i);
      facePoints[i][5][0] += force[0];
      facePoints[i][5][1] += force[1];

      // move the point
      var mag = getMagnitude([point[5][0], point[5][1]]);
			if (mag > MAX_VEL) {
      	facePoints[i][5][0] = MAX_VEL*point[5][0]/mag;
      	facePoints[i][5][1] = MAX_VEL*point[5][1]/mag;
			}
      facePoints[i][3][0] += facePoints[i][5][0];
      facePoints[i][3][1] += facePoints[i][5][1];
    }
  }

  function handleEdges() {
    for (var i = 0; i < edges.length; i++) {
      var edge = edges[i];
      var a = facePoints[edge[0]];
      var b = facePoints[edge[1]];
      var color = getMiddleColor(a[4], b[4]);
      Crush.drawLine(
        ctx, [
          a[3][0] + canvas.width/2 - IMAGE_WIDTH/2,
          a[3][1]
        ], [
          b[3][0] + canvas.width/2 - IMAGE_WIDTH/2,
          b[3][1]
        ], Crush.getColorStr(color), 0.3
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

  function getEdgesFromPoints(points) {
		var coordinateIndex = 3;
		var triplets = Delaunay.triangulate(
			points, coordinateIndex
		);
		var delaunayEdges = [];
		for (var i = 0; i < triplets.length; i += 3) {
			delaunayEdges.push([triplets[i+0], triplets[i+1]]);
			delaunayEdges.push([triplets[i+0], triplets[i+2]]);
			delaunayEdges.push([triplets[i+1], triplets[i+2]]);
		}
		return delaunayEdges;
  }

	function getAdjacencyListFromEdges(edgeList) {
		var adjList = {};
		edgeList.forEach(function(edge) {
			if (edge[0] in adjList) {
				if (adjList[edge[0]].indexOf(edge[1]) === -1) {
					adjList[edge[0]].push(edge[1]);
				}
			} else {
				adjList[edge[0]] = [edge[1]];
			}
			if (edge[1] in adjList) {
				if (adjList[edge[1]].indexOf(edge[0]) === -1) {
					adjList[edge[1]].push(edge[0]);
				}
			} else {
				adjList[edge[1]] = [edge[0]];
			}
		});
		return adjList;
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
        [0, 0]
      ];
    }
  }

	function getForce(idx) {
		if (!(idx in adjacencyList)) {
			return [0, 0];
		}

		var point = facePoints[idx];
		var pos = point[3];
		var neighbors = adjacencyList[idx].map(function(a) {
			return facePoints[a];
		});

		return neighbors.reduce(function(force, a) {
			// add the contribution from this neighbor
			var npos = a[3];
			var vec = [pos[0]-npos[0], pos[1]-npos[1]];
			var dist = getMagnitude(vec);
			force[0] += vec[0]/(dist*dist);
			force[1] += vec[1]/(dist*dist);
			return force;
		}, [0, 0]);
	}

  // helper functions
  function getMiddleColor(a, b) {
    return a;
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
