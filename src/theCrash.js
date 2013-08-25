var TheCrash = cc.Layer.extend({
  init:function() {
    this._super();

    var size = cc.Director.getInstance().getWinSize();
    this.backgroundSprite = cc.Sprite.create(s_background);
    this.backgroundSprite.setAnchorPoint(cc.p(0,0));
    this.backgroundSprite.setOpacity(50);

    this.addChild(this.backgroundSprite, -1);

    // Background will be here, gameState can change it if necessary.

    this.gameState = new GameState({onLayer: this});
    this.gameState.setCurrentState(this.gameState.theBegining);
  }
});
