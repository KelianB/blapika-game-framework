/** Creates an event listener.
 * @class
 * @classdesc Utility class that catches event fired by the used.class
 * @param {Object} receivers - Functions that will be called when receiving an event.
 */
Engine.EventListener = class EventListener {
   constructor(receivers) {
      // Override listeners
      if(receivers) {
         for(let key in receivers) {
             if(this[key])
                 this[key] = receivers[key];
         }
      }
   }

   /** @param {int} button - The mouse button that was pressed. */
   onMouseDown(button) {}

   /** @param {int} button - The mouse button that was released. */
   onMouseUp(button) {}

   /** @param {Object} mouseData - The mouse data. See Engine.Core.mouse */
   onMouseMove(position) {}

   /** @param {Number} wheelDelta - The scroll amount. */
   onWheel(wheelDelta) {}

   /** @param {int} keyCode - The code of the key that was pressed. See https://goo.gl/qTckww */
   onKeyDown(keyCode) {}

   /** @param {int} keyCode - The code of the key that was released. See https://goo.gl/qTckww */
   onKeyUp(keyCode) {}
};
