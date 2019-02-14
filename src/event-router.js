
Engine.EventRouter = class EventRouter {
   static setupEventListeners(element) {
      let mouse = Engine.mouse;
      let listeners = Engine.eventListeners;
      let keysPressed = Engine.keysPressed;

      element.addEventListener("mousedown", (e) => {
          mouse.pressed[e.which] = true;
          for(let i = 0; i < listeners.length; i++)
              listeners[i].onMouseDown(e.which);
      });
      element.addEventListener("mouseup", (e) => {
          mouse.pressed[e.which] = false;
          for(let i = 0; i < listeners.length; i++)
              listeners[i].onMouseUp(e.which);
      });
      element.addEventListener("mousemove", (e) => {
          let rect = Engine.viewport.canvas.getBoundingClientRect();
          let previousPos = {x: mouse.x, y: mouse.y};
          mouse.canvasX = (e.clientX || e.pageX) - rect.left;
          mouse.canvasY = (e.clientY || e.pageY) - rect.top;
          mouse.x = mouse.canvasX / Engine.viewport.renderScaling.x;
          mouse.y = mouse.canvasY / Engine.viewport.renderScaling.y;
          for(let i = 0; i < listeners.length; i++)
             listeners[i].onMouseMove(mouse, previousPos, e);
      });
      element.addEventListener("wheel", (e) => {
          let wheelDelta = e.wheelDelta ? e.deltaY : e.deltaY * (100/3); // normalize delta on firefox
          for(let i = 0; i < listeners.length; i++)
              listeners[i].onWheel(wheelDelta);
      });
      element.addEventListener("keydown", (e) => {
          for(let i = 0; i < listeners.length; i++)
              listeners[i].onKeyDown(e.keyCode);
          keysPressed[e.keyCode] = true;
      });
      element.addEventListener("keyup", (e) => {
          for(let i = 0; i < listeners.length; i++)
              listeners[i].onKeyUp(e.keyCode);
          keysPressed[e.keyCode] = false;
      });
   }
}
