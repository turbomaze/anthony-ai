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
	var DIMS = [200, 200];

  // work variables
	var canvas;
	var ctx;
	var facePixels;

  // work functions
  function initAnthonyAI() {
		// get the pixels of the face
		Crush.getPixelsFromImage(
			'assets/images/anthony.png',
			400,
			function(pixels) {
				// set the pixels
				facePixels = pixels;

				// initialize canvas stuff
				canvas = $s('#canvas');
				canvas.width = DIMS[0];
				canvas.height = DIMS[1];
				ctx = canvas.getContext('2d');

				Crush.registerDynamicCanvas(
					canvas,
					render
				);
			}
		);
  }

	function render() {
		// modify the pixels
		var pixels = facePixels.data;
		for (var i = 0; i < pixels.length; i++) {
			if (Math.random() < 0.1) pixels[i] = 0;
		}
		
		// put it on
    ctx.putImageData(facePixels, 0, 0);
	}

  // helper functions
  function $s(id) { //for convenience
    if (id.charAt(0) !== '#') return false;
    return document.getElementById(id.substring(1));
  }

  return {
    init: initAnthonyAI
  };
})();

window.addEventListener('load', anthony.ai.init);
