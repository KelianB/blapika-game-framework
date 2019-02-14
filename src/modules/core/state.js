
/** Creates the structure of a state to be used in the game engine.
 * @class
 * @classdesc Represents one possible state for the app. See Game.setState.
*/
Engine.State = class State {
   constructor() {
      // Tick elapsed since the state was entered
      this.tick = 0;

      // Create an event listener for this state.
      this.setEventListener(new Engine.EventListener());
   }

   /** Renders the state. Note tat the engine handles the scaling for you before calling this function.
   * @param {CanvasRenderingContext2D} ctx - The context on which to render the state.
   */
   render(ctx) {}

   /** Updates the variables required for this state to work.
   *  @param {int} dt - The number of microseconds by which the game should go forward in time.
   */
   update(dt) {}

   /** Fired by the engine when this state is left. */
   onLeave() {}

   /** Fired by the engine when this state is entered.
   * @param {State} previousState - The previous state of the app (null if there is none).
   */
   onEnter(previousState) {}

   /** Sets the event listener of this state.
   * @param {EventListener} eventListener - The event listener.
   */
   setEventListener(eventListener) {
      if(Engine.core.state == this) {
         console.error("Cannot change event listener of current state.");
         return;
      }
      this.eventListener = eventListener;
   }
}
