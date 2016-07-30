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
  var NUM_INIT_POINTS = 1000;
  var MAX_POINT_RAD = 6;
  var FPS = 30;

  // work variables
  var canvas;
  var ctx;
  var facePixels;
  var facePoints;

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
    // modify the pixels
    ctx.translate(4*Math.random()-2, 4*Math.random()-2);
    for (var i = 0; i < facePoints.length; i++) {
      // draw the point
      var point = facePoints[i];
      var pos = [
        point[0][0] + canvas.width/2 - IMAGE_WIDTH/2,
        point[0][1]
      ];
      var size = point[1];
      var color = point[2];
      Crush.drawPoint(ctx, pos, size, Crush.getColorStr(color));
    }

    if (repeat === true) {
      setTimeout(function() {
        render(true); 
      }, 1000/FPS);
    }
  }

  function getNPointsFromPixels(n, pixels) {
     var points = [];
      for (var i = 0; i < n; i++) {
        points.push(getPointFromPixels(pixels));
      }
      return points;
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
        [x, y],
        Math.random() * MAX_POINT_RAD,
        color
      ];
    }
  }

  // helper functions
  function getMagnitude(v) {
    return v.reduce(function(a, b) {
      return a + b*b;
    }, 0);
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
