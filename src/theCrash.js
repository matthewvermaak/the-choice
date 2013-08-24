var TheCrash = cc.Layer.extend({
  init:function() {
    this._super();

    var size = cc.Director.getInstance().getWinSize();

    // Background will be here, gameState can change it if necessary.

    this.gameState = new GameState({onLayer: this});
    this.gameState.setCurrentState(this.gameState.theBegining);
  }
});
