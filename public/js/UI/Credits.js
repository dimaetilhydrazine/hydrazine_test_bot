UI.Credits = function(text, onClick){
    Phaser.Text.call(this, game, 0, 0, text, {
          font: "bold 50px Exo, Helvetica",
          fill: "white",
          align: "center",
          wordWrap: true
     });
    this.anchor.x = 0.5;
    this.yPerMs = 0.05;
    this.visible = false;
    this.fader = null;
    if(typeof onClick == 'function'){
        this.inputEnabled = true;
        this.events.onInputDown.add(onClick);
    }
    this.updatePosition();
};

extend(UI.Credits, Phaser.Text);

UI.Credits.prototype.updatePosition = function(){
    this.x = game.screenWidth / 2;
    var multiplier = game.isRawLandscape ? 0.8 : 1;
    this.fontSize = game.isRawLandscape ? 50 : 45;
    this.wordWrapWidth = game.screenWidth * multiplier;
};

UI.Credits.prototype.update = function(){
    if(!this.visible){
        return;
    }
    if(this.y + this.height < 0){
        this.y = game.screenHeight;
    }
    var dt = game.time.elapsed;
    this.y -= dt*this.yPerMs;
};

UI.Credits.prototype.start = function(){
    if(this.fader){
        this.fader.stop();
        this.fader = null;
    }
    this.y = game.screenHeight + 10;
    this.alpha = 1;
    this.visible = true;
};

UI.Credits.prototype.stop = function(){
    if(this.fader){
        this.fader.stop();
    }
    this.fader = game.add.tween(this);
    this.fader.to({alpha: 0}, 300);
    this.fader.onComplete.add(function(){
        this.fader = null;
        this.visible = false;
    }, this);
    this.fader.start();
};

/* exported creditsText */
var creditsText = "Fool online";
