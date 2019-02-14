
Engine.utils = {};

// This is mostly used to fix weird lines appearing on the canvas on firefox when rendering a Tilemap
Engine.utils.bitwiseRound = (value) => {
  // ~~ is a double NOT bitwise operator, which acts as a substitute for Math.floor
  return ~~(value + 0.5);
};

Engine.utils.httpGet = (url, callbacks) => {
   let httpRequest = new XMLHttpRequest();
   httpRequest.addEventListener("load", function(e) {
      if(e.target.status == 200) {
         if(callbacks.hasOwnProperty("onLoaded"))
            callbacks.onLoaded(e.target.responseText);
      }
      else {
         if(callbacks.hasOwnProperty("onError"))
            callbacks.onError(e.target);
      }
   });
   httpRequest.addEventListener("error", function(e) {
      if(callbacks.hasOwnProperty("onError"))
         callbacks.onError(e.target);
   });
   httpRequest.open("GET", url);
   httpRequest.send();
};
