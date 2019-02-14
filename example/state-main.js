
class MainState extends Engine.State {
   onEnter() {
      console.log("Entered main state");
       this.textYOffset = 0;
   };

   render(ctx) {
      ctx.fillStyle = "rgb(30, 30, 30)";
      ctx.fillRect(0, 0, game.width, game.height);

      if(loading) {
         ctx.fillStyle = "rgb(60, 140, 180)";
         ctx.font = "20px Consolas";
         ctx.fillText("Loading...", 20, 20);
      }
      else {
         ctx.drawImage(rm.getImage("test-image"), 20, 150);
      }

      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.font = "48px Verdana";
      ctx.textAlign = "center";
      ctx.fillText("Main state", game.width / 2, game.height / 2 + this.textYOffset);

   };

   update() {
      super.update();
      Engine.debug.addLine("tick", game.tick);
      this.textYOffset = Math.sin(game.tick * 0.03) * 100;
   };
}
