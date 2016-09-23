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
