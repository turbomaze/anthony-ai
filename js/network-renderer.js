/******************\
| Network Renderer |
| @author Anthony  |
| @version 0.1     |
| @date 2014/08/07 |
| @edit 2014/08/07 |
\******************/

var NetworkRenderer = (function() {
  // config
  var DIMS = [400, 400];
  var IMAGE_WIDTH = 400;
  var NUM_INIT_POINTS = 1100;
  var MAX_POINT_RAD = 1;
  var FPS = 30;
	var MAX_VEL = 2;
  var FILL_COLOR = 'rgba(255, 255, 255, 0.2)';

  function Renderer(canvas, url, options) {
    this.canvas = canvas;
    this.url = url;

    this.options = options || {};
    this.options.dimensions = options.dimensions || DIMS;
    this.options.imageWidth = options.imageWidth || IMAGE_WIDTH;
    this.options.numInitPoints = options.numInitPoints || NUM_INIT_POINTS;
    this.options.maxPointRadius = options.maxPointRadius || MAX_POINT_RAD;
    this.options.fps = options.fps || FPS;
    this.options.maxVelocity = options.maxVelocity || MAX_VEL;
    this.options.fillColor = options.fillColor || FILL_COLOR;
  }

  Renderer.prototype.start = function() {
    // get the image's pixels
    var self = this;
    Crush.getPixelsFromImage(
      this.url,
      this.options.imageWidth,
      function(pixels) {
        // set the pixels
        self.facePixels = pixels;
        self.facePoints = getNPointsFromPixels(
          self.options.numInitPoints,
          self.facePixels.data,
          self.options.imageWidth,
          self.options.maxPointRadius
        );
        self.edges = getEdgesFromPoints(self.facePoints);
				self.adjacencyList = getAdjacencyListFromEdges(self.edges);

        // initialize canvas stuff
        self.canvas.width = self.options.dimensions[0];
        self.canvas.height = self.options.dimensions[1];
        self.ctx = self.canvas.getContext('2d');

        Crush.registerDynamicCanvas(
          self.canvas,
          function(){
            self.render(false);
          }
        );

        self.render(true);
      }
    );
  }

  Renderer.prototype.render = function(repeat) {
    // clear the canvas
    this.ctx.fillStyle = this.options.fillColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // draw the picture
    // this.ctx.putImageData(
		// 	this.facePixels, this.canvas.width/2 - this.options.imageWidth/2 , 0
		// );

    // handle the points
    this.handlePoints();

    // handle the edges
    this.handleEdges();

    if (repeat === true) {
      var self = this;
      setTimeout(function() {
        self.render(true); 
      }, 1000/this.options.fps);
    }
  }

  Renderer.prototype.handlePoints = function() {
    for (var i = 0; i < this.facePoints.length; i++) {
      // get the point's state
      var point = this.facePoints[i];
      var size = point[0];
      var pos = [
        point[3][0] + this.canvas.width/2 - this.options.imageWidth/2,
        point[3][1]
      ];
      var boundedX = Math.min(
        Math.max(Math.floor(point[3][0]), 0), this.options.imageWidth-1
      );
      var boundedY = Math.min(
        Math.max(Math.floor(point[3][1]), 0),
        this.facePixels.data.length/(4*this.options.imageWidth)
      );

      // update its current color and draw it
      var idx = 4*(boundedY*this.options.imageWidth + boundedX);
      this.facePoints[i][4] = [
        this.facePixels.data[idx+0],
        this.facePixels.data[idx+1],
        this.facePixels.data[idx+2],
        this.facePixels.data[idx+3]
      ];
      Crush.drawPoint(
        this.ctx, pos, size, Crush.getColorStr(this.facePoints[i][4])
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
			var force = this.getForce(i);
      this.facePoints[i][5][0] += force[0];
      this.facePoints[i][5][1] += force[1];

      // move the point
      var mag = getMagnitude([point[5][0], point[5][1]]);
			if (mag > this.options.maxVelocity) {
      	this.facePoints[i][5][0] = this.options.maxVelocity*point[5][0]/mag;
      	this.facePoints[i][5][1] = this.options.maxVelocity*point[5][1]/mag;
			}
      this.facePoints[i][3][0] += this.facePoints[i][5][0];
      this.facePoints[i][3][1] += this.facePoints[i][5][1];
    }
  }

  Renderer.prototype.handleEdges = function() {
    for (var i = 0; i < this.edges.length; i++) {
      var edge = this.edges[i];
      var a = this.facePoints[edge[0]];
      var b = this.facePoints[edge[1]];
      var color = getMiddleColor(a[4], b[4]);
      Crush.drawLine(
        this.ctx, [
          a[3][0] + this.canvas.width/2 - this.options.imageWidth/2,
          a[3][1]
        ], [
          b[3][0] + this.canvas.width/2 - this.options.imageWidth/2,
          b[3][1]
        ], Crush.getColorStr(color), 0.3
      );
    }
  }

	Renderer.prototype.getForce = function(idx) {
		if (!(idx in this.adjacencyList)) {
			return [0, 0];
		}

		var point = this.facePoints[idx];
		var pos = point[3];
    var self = this;
		var neighbors = this.adjacencyList[idx].map(function(a) {
			return self.facePoints[a];
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

  function getPointFromPixels(pixels, imageWidth, maxPointRadius) {
    var idx = Math.floor(Math.random()*(pixels.length/4));
    var color = [
      pixels[4*idx], pixels[4*idx+1], pixels[4*idx+2], pixels[4*idx+3]
    ];
    // skip white
    if (color[3] < 255) {
      return getPointFromPixels(pixels, imageWidth, maxPointRadius);
    } else {
      var x = idx % imageWidth;
      var y = Math.floor(idx/imageWidth);
      return [
        // size
        Math.random() * maxPointRadius,

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

  function getNPointsFromPixels(n, pixels, imageWidth, maxPointRadius) {
    var points = [];
    for (var i = 0; i < n; i++) {
      points.push(
        getPointFromPixels(pixels, imageWidth, maxPointRadius)
      );
    }
    return points;
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

  return Renderer;
})();
