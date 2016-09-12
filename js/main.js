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
  var faceUrl = 'assets/images/anthony.png';

  // work variables

  // work functions
  function initAnthonyAI() {
    var faceCanvas = $s('#canvas');
    var faceRenderer = new NetworkRenderer(faceCanvas, faceUrl, {
      numInitPoints: 1000,
      fillColor: 'rgba(255, 254, 250, 0.07)'
    });
    faceRenderer.start();

    var faceCanvas2 = $s('#canvas2');
    var faceRenderer2 = new NetworkRenderer(faceCanvas2,
      'assets/images/profile_pic.jpg', {
      numInitPoints: 50,
      fillColor: 'rgba(5, 5, 69, 1)',
      maxPointRadius: 10 
    });
    faceRenderer2.start();

    var faceCanvas3 = $s('#canvas3');
    var faceRenderer3 = new NetworkRenderer(faceCanvas3, 
      'assets/images/out.png', {
      numInitPoints: 1000,
      fillColor: 'rgba(7, 205, 219, 0.0)',
      maxPointRadius: 4
    });
    faceRenderer3.start();

    // init smooth scroll
    smoothScroll.init({
    	speed: 300,
    	updateURL: false
		});
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
