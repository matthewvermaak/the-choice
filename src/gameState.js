var dialogFactor = 25;
var dialogFont = "Times New Roman";

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
  var action = options.action;

  return {
    action: action,
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
    this.endState = options.endState || false;
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
    this.removeFromParent(true);
  },
  playIntroduction: function() {
    var size = cc.Director.getInstance().getWinSize();

    var i = 0;
    this.introductionLabels = [];
    for(i; i < this.introduction.length; i++) {
      this.introductionLabels[i] = (cc.LabelTTF.create(this.introduction[i], dialogFont, size.height / dialogFactor));
      this.introductionLabels[i].setOpacity(0);
      this.introductionLabels[i].setPosition(cc.p(size.width/2, size.height/2));
      this.addChild(this.introductionLabels[i], 1);
    }

    this.playIntroductionInternal(0);
  },
  playIntroductionInternal: function(index){
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
    this.presentDescription();
    // - Now we move on
  },
  presentDescription: function() {
    var size = cc.Director.getInstance().getWinSize();

    var i = 0;
    this.descriptionLabels = [];
    var heightOffset = (size.height * .75);
    var heightStep = size.height * .1;
    for(i; i < this.description.length; i++) {
      this.descriptionLabels[i] = cc.LabelTTF.create(this.description[i], dialogFont, size.height / dialogFactor);
      this.descriptionLabels[i].setPosition(size.width/2, heightOffset - (i * heightStep));
      this.descriptionLabels[i].setOpacity(0);
      this.addChild(this.descriptionLabels[i], 1);
      
      this.descriptionLabels[i].runAction(cc.FadeIn.create(2 + (i * 0.75)));
    }

    var that = this;
    this.runAction(cc.Sequence.create(cc.DelayTime.create(2 * this.descriptionLabels.length), cc.CallFunc.create(function(target) {
      var size = cc.Director.getInstance().getWinSize();
      var i = 0;
      for(i; i < target.description.length; i++) {
        target.descriptionLabels[i].runAction(cc.MoveTo.create(1, cc.p(size.width/2, size.height - ((size.height / dialogFactor )* (i + 1)))));
      }
    
      if(target.endState) {
        var i = 0;
        for(i; i < target.description.length; i++) {
          target.descriptionLabels[i].runAction(cc.FadeOut.create(3));
        }

        target.displayEndGame();
      } else {
        target.runAction(cc.Sequence.create(cc.DelayTime.create(1), cc.CallFunc.create(function(innerTarget) {
          innerTarget.presentDialog();
        })));
      }
    })));
    
  },
  displayEndGame: function() {
    this.machine.displayEndGame();
    // (GameState should do this);
    
  },
  presentDialog: function() {
    var size = cc.Director.getInstance().getWinSize();

    var i = 0;
    this.dialogLabels = [];
    this.dialogMenuLabels = [];
    for(i; i < this.discourse.length; i++) {
      var d = "< " + this.discourse[i].participant;

      if(this.discourse[i].action) {
        d += " " + this.discourse[i].action.toLowerCase() + " >";
      } else {
        d += " >";
      }

      if(this.discourse[i].dialog) {
        d += " \"" + this.discourse[i].dialog + "\"";
      }
      
      this.dialogLabels[i] = cc.LabelTTF.create(d, dialogFont, size.height / dialogFactor);
      this.dialogLabels[i].setDimensions(cc.size(size.width, size.height/ dialogFactor));
      this.dialogLabels[i].setAnchorPoint(cc.p(0,0));

      this.dialogMenuLabels[i] = cc.MenuItemLabel.create(this.dialogLabels[i], function() {}, this);
      this.dialogMenuLabels[i].setAnchorPoint(cc.p(0,0));
      this.dialogMenuLabels[i].setDisabledColor(cc.c3b(255,255,255));
      this.dialogMenuLabels[i].setEnabled(false);
    }

    this.dialogMenuLabels.push(cc.MenuItemFont.create(" ", function(){}, this));

    this.dialogOptionLabels = [];
    this.dialogOptionMenuLabels = [];
    for(i =0; i < this.dialogOptions.length; i++) {
      var dL = "      -";
      if(this.dialogOptions[i].dialog) {
        dL += " " + this.dialogOptions[i].dialog;
      }
      if(this.dialogOptions[i].action) {
        dL += " [" + this.dialogOptions[i].action + "]";
      }

      this.dialogOptionLabels[i] = cc.LabelTTF.create(dL, dialogFont, size.height / dialogFactor);
      this.dialogOptionLabels[i].setDimensions(cc.size(size.width, size.height/ dialogFactor));
      this.dialogOptionLabels[i].setAnchorPoint(cc.p(0,0));

      var that = this;
      this.dialogOptionMenuLabels[i] = cc.MenuItemLabel.create(this.dialogOptionLabels[i], function(dopMenu) {
        that.disableDialogOptions();
        that.establishAnswer(dopMenu.dopIndex);
        that.fadeAll();

        that.runAction(cc.Sequence.create(cc.DelayTime.create(2), cc.CallFunc.create(function(target) {
           that.dialogOptions[dopMenu.dopIndex].transitionTo.transition.call(that.machine);
        })));
      }, this);
      this.dialogOptionMenuLabels[i].setAnchorPoint(cc.p(0,0));
      this.dialogOptionMenuLabels[i].dopIndex = i;
    }
    
    this.menu = cc.Menu.create.call(this, this.dialogMenuLabels.concat(this.dialogOptionMenuLabels));
    this.menu.alignItemsVerticallyWithPadding(10);
    this.menu.setPosition(cc.p(size.width * 0.1, size.height / 3));
    
    this.addChild(this.menu, 1);
    
  },
  disableDialogOptions: function() {
    var i = 0;
    for(i; i < this.dialogOptionMenuLabels.length; i++){
      this.dialogOptionMenuLabels[i].setEnabled(false);
    }
  },
  fadeAll: function() {
    var i = 0;
    for(i; i < this.descriptionLabels.length; i++) {
      this.descriptionLabels[i].runAction(cc.FadeOut.create(1));
    }

    for(i=0; i < this.dialogMenuLabels.length; i++) {
        if(this.dialogMenuLabels[i]){
          if(this.selectedAnswer && this.selectedAnswer == i) {
            this.dialogMenuLabels[i].runAction(cc.Sequence.create(cc.DelayTime.create(1), cc.FadeOut.create(2)));
          } else {
            this.dialogMenuLabels[i].runAction(cc.FadeOut.create(1));
          }
        }
    }
  },
  establishAnswer: function(theAnswer) {
    var size = cc.Director.getInstance().getWinSize();
    var i = 0;
    for(i; i < this.dialogOptionMenuLabels.length; i++) {
      if(i == theAnswer) {
        this.dialogOptionMenuLabels[i].runAction(cc.FadeOut.create(1.25));
        var resolvedOption = "< you ";
        if(this.dialogOptions[i].action) {
          resolvedOption += this.dialogOptions[i].action.toLowerCase() + " >";
        } else {
          resolvedOption += ">";
        }

        if(this.dialogOptions[i].dialog) {
          resolvedOption += " \"" + this.dialogOptions[i].dialog + "\"";
        }
        
        var pushIndex = this.dialogMenuLabels.length + 1;
        var yourLabel = cc.LabelTTF.create(resolvedOption, dialogFont, size.height/dialogFactor); 
        yourLabel.setAnchorPoint(cc.p(0,0));

        this.selectedAnswer = pushIndex;
        this.dialogMenuLabels[pushIndex] = cc.MenuItemLabel.create(yourLabel, function() { }, this);
        this.dialogMenuLabels[pushIndex].setAnchorPoint(cc.p(0,0));
        this.menu.addChild(this.dialogMenuLabels[pushIndex], this.dialogLabels.length - 1);
        this.menu.alignItemsVerticallyWithPadding(10);
      } else {
        this.dialogOptionMenuLabels[i].runAction(cc.FadeOut.create(1));
      }
    }
  },
  play: function(options) {
    if(this.machine.elapsedTime >= 10 && this.endState != true) {
        this.machine.setCurrentStateOverride(this.machine.theTrainSlips);
        // Catch all--
    } else {
        this.playIntroduction();
    }

 //   this.presentDialog();
  }
});

var GameState = function(options) {
  this.onLayer = options.onLayer;
  this.currentState;
  this.elapsedTime = 1;
  this.theSituation = {
    woman: 0,
    you: 0,
    child: 0
  };

  this.displayEndGame = function() {
    var survivorText = ["In a flash, it was over."];
    if (this.theSituation.woman == 1) {
      survivorText.push("The mother stands alone on the bridge.");
      survivorText.push("Wracked with guilt and grief, holding her belly, she screams.");
    } else if (this.theSituation.you == 1) {
      survivorText.push("You stand alone on the bridge.");
    } else if (this.theSituation.child == 1) {
      survivorText.push("The child stands alone on the bridge.");
      survivorText.push("She collapses, crying, and screaming over her mother.");
    } else {
      survivorText.push("The bridge is empty.");
    }

    var size = cc.Director.getInstance().getWinSize();

    var feedbackText = "Feedback? @matthewvermaak";
    var feedbackLabel = cc.LabelTTF.create(feedbackText, dialogFont, dialogFont * 0.9);
    feedbackLabel.setOpacity(0);
    feedbackLabel.setAnchorPoint(cc.p(0,0));
    feedbackLabel.setPosition(cc.p(size.width * 0.05, size.height * 0.05));

    this.onLayer.addChild(feedbackLabel, 1);
    feedbackLabel.runAction(cc.FadeIn.create(12));

    var i = 0;
    var heightOffset = (size.height * .75);
    var heightStep = size.height * .1;
    for(i; i < survivorText.length; i++) {
      survivorText[i] = cc.LabelTTF.create(survivorText[i], dialogFont, size.height / dialogFactor);
      survivorText[i].setPosition(size.width/2, heightOffset - (i * heightStep));
      survivorText[i].setOpacity(0);
      this.onLayer.addChild(survivorText[i], 1);
      
      survivorText[i].runAction(cc.FadeIn.create(2.5 + (i * 1)));
    }

  }

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

  this.theTrainSlips = new gState();
  this.theTrainSlips.init({
    machine: this,
    introduction: ["With a violent crack, the bridge gives way and the train car falls."],
    discourse: [],
    dialogOptions: [],
    description: [],
    endState: true
  });

  this.getDaughterOut = new gState();
  this.getDaughterOut.init({
    machine: this,
    introduction: [],
    discourse: [gDialog({participant: "the child", dialog: "Mommy!"})],
    dialogOptions: [gDialogOption({
      dialog: "Come Child",
      action: "Pull the child",
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.comeChild);
        }})
      }), gDialogOption({
        dialog: "We are going to have to go together",
        action: "Assist the mother",
        transitionTo: gTransition({
          transition: function() {  
            that.setCurrentState(that.goTogether);
          }
        })
      })],
      description: ["The child, afraid, clings to her mother. She drops to the ground, wrapped around her mother's leg."]
  });

  this.leaveMotherToTakeChild = new gState();
  this.leaveMotherToTakeChild.init({
    machine: this,
    introduction: ["You explain to the mother that you will be right back for her."],
    description: ["You grab the child, she struggles with you. Grabbing her mother's leg."],
    discourse: [gDialog({participant: "the mother", dialog: "Go my baby, I will be right behind you"}), gDialog({participant: "the child", dialog: "Noooo!"})],
    dialogOptions: [gDialogOption({
        action: "Carry the child towards the exit",
        transitionTo: gTransition({
          transition: function() {
            that.setCurrentState(that.carryChild);
          }
        })
      })]
  });

  this.goTogether = new gState();
  this.goTogether.init({
    machine: this,
    introduction: [],
    discourse: [],
    dialogOptions: [gDialogOption({
      dialog: "We have to move to the exit",
      action: "Laboriously tread towards the exit.",
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.slowlyButSurely);
        }
      })
    })],
    description: ["You assist the mother to stand, her weight burdens you, slowing your pace.", "The child lingers behind her dress."]
  });

  this.slowlyButSurely = new gState();
  this.slowlyButSurely.init({
    machine: this,
    introduction: ["Progress is slow, you are weakening."],
    dialogOptions: [gDialogOption({
      dialog: "We can make it",
      action: "Stand back up with the mother",
      transitionTo: gTransition({
        transition: function(){ 
          that.setCurrentState(that.almostThere);
        }
      })
    }), gDialogOption({
      dialog: "Let me take the daughter first", 
      action: "Stand and Grab the child's arm",
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.leaveMotherToTakeChild);
        }
      })
    })],
    discourse: [gDialog({participant: "the child screams", dialog: "Mommy!"})],
    description: ["The Train slides. You and the mother stumble to the ground."]
  });

  this.almostThere = new gState();
  this.almostThere.init({
    machine: this,
    introduction: [],
    dialogOptions: [gDialogOption({
      dialog: "Just a few more steps!",
      action: "Push on",
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.atTheExit)
        }
      })
    }), gDialogOption({
      dialog: "Let me take the daughter first",
      action: "Rest the mother on a seat and Grab the child's arm",
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.leaveMotherToTakeChild)
        }
      })
    })],
    discourse: [],
    description: ["You are almost to the exit"]
  });

  this.atTheExit = new gState();
  this.atTheExit.init({
    machine: this,
    introduction: ["As you approach the back of the train, the car shifts."],
    dialogOptions: [gDialogOption({
      action: "Reach for the exit door",
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.atDoor);
        }
      })
    })],
    discourse: [gDialog({participant: "the mother whispers", dialog: "it will be alright"})],
    description: ["The train car sways and screeches as it loosens its grip on the bridge.", "The child buries her head into her mother's dress."]
  });
 
  this.atDoor = new gState();
  this.atDoor.init({
    machine: this,
    introduction: ["Safety is so close."],
    dialogOptions:[gDialogOption({
      dialog: "I will get out and help you down",
      action: "Get out",
      transitionTo: gTransition({
        transition: function() {
          that.theSituation.you = 1;
          that.setCurrentState(that.theTrainSlips);
        }
      }),
    }), gDialogOption({
      dialog: "Step down",
      action: "Hold the mother's hand as she steps down",
      transitionTo: gTransition({
        transition: function() {
          that.theSituation.woman = 1;
          that.setCurrentState(that.theTrainSlips);
        }
      })
    }), gDialogOption({
      dialog: "Step down",
      action: "Hold the child's hand as she steps down",
      transitionTo: gTransition({
        transition: function() {
          that.theSituation.child = 1;
          that.setCurrentState(that.theTrainSlips);
        }
      })
    })],
    discourse: [],
    description: ["You have made it to the back of the car. The bridge is a fair jump down.", "You will need to assist the mother and child."],
  })

  this.comeChild = new gState();
  this.comeChild.init({
    machine: this,
    introduction: ["A struggle ensues. You ache all over."],
    discourse: [gDialog({participant: "the child screams", dialog: "Let go!"})],
    dialogOptions: [gDialogOption({
        action: "Carry the child towards the exit",
        transitionTo: gTransition({
          transition: function() {
            that.setCurrentState(that.carryChild);
          }
        })
      }), gDialogOption({
        action: "Help the mother stand",
        dialog: "Don't worry, we will make it.",
        transitionTo: gTransition({
          transition: function() {
            that.setCurrentState(that.goTogether);
          }
        })
      })],
      description: ["You pry the girl from her mother. The Mother is struggling to stand."]
    });

  this.carryChild = new gState();
  this.carryChild.init({
    machine: this,
    introduction: [],
    discourse: [gDialog({participant: "the child", action: "sobs as her struggles weaken"})],
    dialogOptions:[gDialogOption({
        dialog: "Hop down",
        action: "Guide the child out of the car",
        transitionTo: gTransition({
          transition: function() {
            that.theSituation.child = 1;
            that.setCurrentState(that.guideChild);
          }
        })
      }), gDialogOption({
        dialog: "Wait here",
        action: "Turn back for the mother",
        transitionTo: gTransition({
          transition: function() {
            that.setCurrentState(that.turnBackForMother);
          }
        })
      })],
      description: ["With force you move swiftly to the exit. Each step shoots pain throughout you."]
  });

  this.turnBackForMother = new gState();
  this.turnBackForMother.init({
    machine: this,
    introduction: [],
    discourse: [
      gDialog({participant: "the mother", action: "heaves herself forward reaching for you"}),
      gDialog({participant: "the child", action: "whimpers"})
    ],
    dialogOptions:[gDialogOption({
        dialog: "Hop down",
        action: "Guide the child out of the car",
        transitionTo: gTransition({
          transition: function() {
            that.theSituation.child = 1;
            that.setCurrentState(that.guideChild);
          }
        })
      }), gDialogOption({
        dialog: "Can you stand?",
        action: "Reach for the mother",
        transitionTo: gTransition({
          transition: function() {
            that.setCurrentState(that.theEnd);
          }
        })
      })],
      description: ["The train car is creaking. Not long now..."]
  });

  this.reachForMother = new gState();
  this.reachForMother.init({
    machine: this,
    introduction: [],
    discourse: [],
    dialogOptions:[gDialogOption({
      dialog: "Got ya.",
      action: "Step back into the train to catch her",  
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.theTrainSlips);
        }
      })
    })],
    description: ["The mother falls forward in her attempt."]
  });

  this.guideChild = new gState();
  this.guideChild.init({
    machine: this,
    introduction: ["The child, with tears streaming down her cheeks, tumbles out onto the bridge as she lets go of your hand."],
    discourse: [gDialog({participant: "the child sobbing", dialog: "...mommy..."}), gDialog({participant: "the mother continuing to struggle", dialog: "I'm coming baby"})],
    dialogOptions:[gDialogOption({
        action: "Regain footing",
        transitionTo: gTransition({
          transition: function() {
            that.setCurrentState(that.regainFooting);
          }
        })
      })],
      description: ["A thunderclap of metal breaking echoes through the train car.",
        "The car jolts under your feet, and you fall backwards.",
        "You see the mother hit down hard on the seat bracing herself"]
  });
  
  this.regainFooting = new gState();
  this.regainFooting.init({
    machine: this,
    introduction: ["As you stand. The train begins to sway."],
    description: ["The mother has begun her struggle to stand again. She reaches for your arm."],
    discourse: [gDialog({participant: "the mother", dialog: "help me... please..."})],
    dialogOptions:[gDialogOption({
      dialog: "Come",
      action: "Grab the mother's hand",
      transitionTo: gTransition({
        transition: function() {
          that.setCurrentState(that.trainFallsAfterChild);
        }
      })
    })]
  })

  this.trainFallsAfterChild = new gState();
  this.trainFallsAfterChild.init({
    machine: this,
    endState: true,
    introduction: ["The train car falls away.", "You look out the exit to see the sky.", "Clouds fill the door."],
    description: ["In the final moments you look at the mother. Your eyes meet, she looks so familiar..."],
    discourse: [],
    dialogOptions:[]
  });

  this.whatsHurt = new gState();
  this.whatsHurt.init({
    machine: this,
    introduction: ["She is delirious, and does not respond to your question."],
    discourse: [gDialog({participant: "the woman", dialog: "Help!"}), gDialog({participant: "the child", dialog: "Mommy, I'm scared!"})],
    dialogOptions:[gDialogOption({
      dialog: "We need to get out of here",
      action: "Stand",
      transitionTo: gTransition({transition: function() {
        that.setCurrentState(that.letsExit);
      }})
    })],
    description: ["The woman is struggling to stand. She does not appear to be able to move on her own."]
  });

  this.letsExit = new gState();
  this.letsExit.init({
    machine: this,
    introduction: [],
    discourse: [gDialog({participant: "the woman", dialog: "I can't..."}), gDialog({participant: "the child", action: "tugs on her mother"})],
    dialogOptions: [gDialogOption({
      at: "the woman",
      dialog: "Yes you can",
      action: "Pull the mother up",
      transitionTo: gTransition({transition: function() {
        that.setCurrentState(that.goTogether);
      }})
    }), gDialogOption({
      at: "the woman",
      dialog: "Let's get your daughter out first",
      action: "Grab the daughter by the arm",
      transitionTo: gTransition({transition: function() {
        that.setCurrentState(that.getDaughterOut);
      }})
    })],
    description: ["The train car is begining to slide. The whole car will slide off the bridge soon.", "You must move fast."]
  });

  this.theBegining = new gState();
  this.theBegining.init({
    machine: this,
    introduction: ["In life you will meet moments.", "Moments in which time slows down and a choice becomes clear.", "A choice that will change the path of your life.", "This is one of those moments."],
    description: [
      "On a train headed home, a day early. A surprise return to your family.",
      "A woman and her daughter play games across from you.",
      "The mother is pregnant and the daughter is curiously asking questions."
    ],
    discourse: [gDialog({participant: "the child asks", dialog: "Can we name him Sammy?"})],
    dialogOptions: [
      gDialogOption({
        action: "Look out the window",
        transitionTo: gTransition({
          interState: true,
          transition: function() {
            that.setCurrentState(that.theAccident);
          }
        })
      })
    ]
  });

  this.theAccident = new gState();
  this.theAccident.init({
    machine: this,
    introduction: ["You gaze out the window, focusing on the rhythm of the train wheels beating the tracks.", "The rhythm changes. Ahead, the bridge collapses."],
    description: ["The train coils on itself, your car slides off the tracks.", "The bridge wall slows it enough to lodge it precariously teetering over the edge.",
      "Your head is throbbing. Warmth washes over you. Blood has spilled into your vision.", "As you clear your eyes, you see the woman and her daughter across from you."],
    discourse: [gDialog({participant: "the woman screams", dialog: "Oh god!"})],
    dialogOptions: [
      gDialogOption({
        dialog: "Are you OK?",
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

      this.renderElapsedTime(this.elapsedTime);

      this.elapsedTime += 1;
  };

  this.setCurrentStateOverride = function(targetState) {
    if(this.currentState) {
      this.currentState.clear();
    }
    this.currentState = targetState;
    this.onLayer.addChild(this.currentState, 1);
    this.currentState.play();
    
    this.renderElapsedTime(this.elapsedTime);
  }

  var size = cc.Director.getInstance().getWinSize();

  this.elapsedTimeLabel = cc.LabelTTF.create(this.elapsedTime + " s", "Times New Roman", size.height / 40);
  this.elapsedTimeLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
  this.elapsedTimeLabel.setDimensions(cc.size(size.width * 0.9, size.height /40));
  this.elapsedTimeLabel.setAnchorPoint(cc.p(0,0));
  this.elapsedTimeLabel.setPosition(0, size.height * 0.04);
  this.onLayer.addChild(this.elapsedTimeLabel, 2);

  this.renderElapsedTime = function() {
    this.elapsedTimeLabel.setString(this.elapsedTime + " s");
  }

/*
  var stateMachine = {
    theBegining: theBegining,
    theEnd: theEnd,
    setCurrentState: this.setCurrentState
  };
  
  
  return stateMachine;
*/
};
