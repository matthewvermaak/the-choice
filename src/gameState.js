var gDialogOption = function(options) {
  var directedAt = options.at;
  var dialog = options.dialog;
  var action = options.action;
  var transitionTo = options.transitionTo;

  return {
    directedAt: directedAt,
    dialog: dialog,
    action: action,
    transitionTo: transitionTo
  };
};

var gDialog = function(options) {
  var participant = options.participant;
  var dialog = options.dialog;

  return {
    dialog: dialog,
    participant: participant
  };
};

var gTransition = function(options) {
  var interState = options.interState;
  var toState = options.toState;

  var discourse = options.discourse;
  var dialogOptions = options.dialogOptions;
  var transition = options.transition;

  return {
    interState: interState,
    transition: transition
  };
};

var gState = cc.Layer.extend({
  init: function(options) {
    this._super();

    this.machine = options.machine;

    this.introduction = options.introduction;
    this.description = options.description;
    this.discourse = options.discourse;
    this.dialogOptions = options.dialogOptions;
    this.clearing = false;
  },
  clearDiscourse: function() {
    var i = 0;
    for(i; i< this.dialogLabels.length; i++) {
      this.dialogLabels[i].runAction(cc.FadeOut.create(1));
    }
  },
  clearDialogOptions: function() {
    var i = 0;
    for(i; i< this.dialogOptionLabels.length; i++) {
      this.dialogOptionLabels[i].runAction(cc.FadeOut.create(1));
    }
  },
  clearDescription: function() {
    var i = 0;
    for(i; i< this.descriptionLabels.length; i++) {
      this.descriptionLabels[i].runAction(cc.FadeOut.create(1));
    }
  },
  clear: function() {
/*
    if(this.clearing) {
      return;
    }
    this.clearing = true;

    this.clearDiscourse();
    this.clearDialogOptions();
    this.clearDescription();

    this.runAction(cc.Sequence.create(cc.DelayTime.create(1.5), cc.CallFunc.create(function(target) { target.removeFromParentAndCleanup(true); })));
*/
    this.removeFromParent(true);
    // Should fade the state out. // Resetting so you could "play" again
  },
  playIntroduction: function() {
    cc.log("playing introduction");
    var size = cc.Director.getInstance().getWinSize();

    var i = 0;
    this.introductionLabels = [];
    for(i; i < this.introduction.length; i++) {
      this.introductionLabels[i] = (cc.LabelTTF.create(this.introduction[i], 35));
      this.introductionLabels[i].setOpacity(0);
      this.introductionLabels[i].setPosition(cc.p(size.width/2, size.height/2));
      this.addChild(this.introductionLabels[i], 1);
    }

    this.playIntroductionInternal(0);
  },
  playIntroductionInternal: function(index){
    cc.log("internal");
    if(index < this.introductionLabels.length) {
      var fadeIn = cc.FadeIn.create(3);
      var fadeOut = cc.FadeOut.create(3);

      this.introductionLabels[index].runAction(cc.Sequence.create(
        fadeIn,
        fadeOut,
        cc.CallFunc.create(function(target) { 
          target._parent.playIntroductionInternal(++index); 
        })
      ));

    } else {
      this.clearIntroduction();
    }
  },
  clearIntroduction: function() {
    cc.log("clear intro");
    this.presentDescription();
    // - Now we move on
  },
  presentDescription: function() {
    cc.log("present desc");
    var size = cc.Director.getInstance().getWinSize();

    var i = 0;
    this.descriptionLabels = [];
    var heightOffset = (size.height * .75);
    var heightStep = size.height * .1;
    for(i; i < this.description.length; i++) {
      this.descriptionLabels[i] = cc.LabelTTF.create(this.description[i], 35);
      this.descriptionLabels[i].setPosition(size.width/2, heightOffset - (i * heightStep));
      this.addChild(this.descriptionLabels[i], 1);
    }

    this.runAction(cc.Sequence.create(cc.DelayTime.create(2 * this.descriptionLabels.length), cc.CallFunc.create(function(target) {
      var size = cc.Director.getInstance().getWinSize();
      var i = 0;
      for(i; i < target.description.length; i++) {
        target.descriptionLabels[i].runAction(cc.MoveTo.create(1, cc.p(size.width/2, size.height - (35 * (i + 1)))));
      }

      target.runAction(cc.Sequence.create(cc.DelayTime.create(1), cc.CallFunc.create(function(innerTarget) {
        innerTarget.presentDialog();
      })));
    })));
    
  },
  presentDialog: function() {
    cc.log("present dialog");
    var size = cc.Director.getInstance().getWinSize();

    var i = 0;
    this.dialogLabels = [];
    this.dialogMenuLabels = [];
    for(i; i < this.discourse.length; i++) {
      this.dialogLabels[i] = cc.LabelTTF.create("< " + this.discourse[i].participant + " > " + this.discourse[i].dialog, 25);
      this.dialogMenuLabels[i] = cc.MenuItemLabel.create(this.dialogLabels[i], function() {}, this);
    }

    this.dialogOptionLabels = [];
    this.dialogOptionMenuLabels = [];
    for(i =0; i < this.dialogOptions.length; i++) {
      this.dialogOptionLabels[i] = cc.LabelTTF.create("- " + this.dialogOptions[i].dialog, 30);
      var dOP = this.dialogOptions[i];
      var that = this;
      this.dialogOptionMenuLabels[i] = cc.MenuItemLabel.create(this.dialogOptionLabels[i], function() {
        dOP.transitionTo.transition.call(that.machine);
      }, this);
    }
    
    var menu = cc.Menu.create.call(this, this.dialogMenuLabels.concat(this.dialogOptionMenuLabels));
    menu.alignItemsVerticallyWithPadding(10);
    menu.setPosition(cc.p(size.width / 4, size.height / 3));
    this.addChild(menu, 1);
    
  },
  play: function(options) {
    // Introduce -
    this.playIntroduction();
 //   this.presentDialog();
    // Settle on Description
    // Expose Discourse
    // Present Dialog Options

  }
});

var GameState = function(options) {
  this.onLayer = options.onLayer;
  this.currentState;
  this.theSituation = {};

  var that = this;
  /* States */
  this.theEnd = new gState();
  this.theEnd.init({
    machine: this,
    introduction: [],
    discourse: [],
    dialogOptions: [],
    description: ["The end"]
  });

  this.whatsHurt = new gState();
  this.whatsHurt.init({
    machine: this,
    introduction: [],
    discourse: [gDialog({participant: "the woman", dialog: "Help us please!"}), gDialog({participant: "the child", dialog: "Mommy, let's go"})],
    dialogOptions:[gDialogOption({
      at: "the woman",
      dialog: "Let's get to the exit",
      transitionTo: gTransition({transition: function() {
        that.setCurrentState(that.letsExit);
      }})
    })],
    description: ["The woman is pregnant, and it appears her leg is crushed under the seat. She is not moving alone."]
  });

  this.letsExit = new gState();
  this.letsExit.init({
    machine: this,
    introduction: [],
    discourse: [gDialog({participant: "the woman", dialog: "I can't..."}), gDialog({particpant: "the child", action: "tugs on her mother"})],
    dialogOptions: [gDialogOption({
      at: "the woman",
      dialog: "Yes you can",
      action: "Pull the mother",
      transitionTo: gTransition({transition: function() {
        that.setCurrentState(that.theEnd);
      }})
    }), gDialogOption({
      at: "the woman",
      dialog: "let's get your daughter up here",
      action: "Grab the daughter by the arm",
      transitionTo: gTransition({transition: function() {
        that.setCurrentState(that.theEnd);
      }})
    })],
    description: ["The train car is begining to slide. If you don't move fast, the whole car will slip farther into the collapsed debris."]
  });

  this.theBegining = new gState();
  this.theBegining.init({
    machine: this,
    introduction: ["So much of life comes down to moments", "A moment containing a choice.", "A choice which in seconds will change your life."],
    description: [
      "On a train enroute to home, a day early. A surprise return to your wife and daughter.",
      "Fate has presented a hurdle to your delightful surprise. A collapse in the tracks has caused the train to crash.",
      "Across from you in the train car is a woman and her daughter."
    ],
    discourse: [gDialog({participant: "the woman", dialog: "Oh god, it hurts!"})],
    dialogOptions: [
      gDialogOption({
        at: "the woman",
        dialog: "What hurts?",
        transitionTo: gTransition({
          interState: true,
          transition: function() {
            that.setCurrentState(that.whatsHurt);
          }
        })
      })
    ]
  });

  this.setCurrentState = function(targetState) {
      if(this.currentState) {
        this.currentState.clear();
      }
      this.currentState = targetState;
      this.onLayer.addChild(this.currentState, 1);
      this.currentState.play();
  };

/*
  var stateMachine = {
    theBegining: theBegining,
    theEnd: theEnd,
    setCurrentState: this.setCurrentState
  };
  
  
  return stateMachine;
*/
};
