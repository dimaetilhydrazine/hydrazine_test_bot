var LobbyCreator = function(options){
	this.options = mergeOptions(this.getDefaultLobbyOptions(), options);
	var stepperWidth = 110;
	var textWidth = 100;
	var layout = [

		Menu.alignLeft(
			Menu.text({
				text:'Players',
				name:'numOfPlayers',
				hoverText:'Number of human players',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),
			Menu.stepper({
				// action: this.limitBotSelectorRange,
				context: this,
				name:'stepOfPlayers',
				choices: [
					// '1',
					'2',
					'3',
					'4',
					'5',
					'6',
				],
				minWidth: stepperWidth,
				startKey: '4'
			}),
			Menu.checkbox({
				text: 'Transfer',
				name: 'transfer',
				hoverText: 'Players can play a card with the same value instead of defending to force the next player to defend',
				hoverPlacement: 'right',
				checked: true
			})
			/*Menu.checkbox({
				text: 'Longer turns',
				name: 'longerTurn',
				hoverText: 'Players have 40 instead of 25 seconds to play a card',
				hoverPlacement: 'right',
				checked: false
			})*/
		),

		Menu.alignLeft(
			/*Menu.text({
				text: 'Bots',
				name: 'numOfBots',
				hoverText: 'Number of AI-controlled players',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),*/
			/*Menu.stepper({
				name:'stepOfBots',
				choices: [
					'0',
					'1',
					'2',
					'3',
					'4',
					'5',
				],
				minWidth: stepperWidth,
				context: this,
				startKey: '0'
			}),*/
		),

		Menu.alignLeft(
			Menu.text({
				text:'Deck size',
				name:'deckSize',
				hoverText: '36 cards deck is recommended for games with 2-4 players, 52 cards deck is recommended for games with 4-6 players',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),
			Menu.stepper({
				name:'deckSizeStep',
				choices: [
					'36',
					'52'
				],
				startKey: '52',
				minWidth: stepperWidth
			}),
			Menu.checkbox({
				text: 'Private',
				name: 'private',
				hoverText: 'Players won\'t be able to find your game via the Join Game menu',
				hoverPlacement: 'bottom'
			})
			/*Menu.checkbox({
				text:'Limit attackers',
				name:'limitAttack',
				hoverText:'Only players adjacent to the defender can attack',
				hoverPlacement: 'right',
				checked: true
			})*/
		),

		/*Menu.alignLeft(
			Menu.text({
				text:'Difficulty',
				name:'difficulty',
				hoverText: 'Difficulty of the AI-controlled opponents',
				hoverPlacement: 'left',
				fixedWidth: textWidth
			}),
			Menu.stepper({
				name:'stepOfDifficulty',
				choices: [
					['0', 'Easy'],
					['1', 'Medium'],
					['2', 'Hard'],
					['3', 'Cheater']
				],
				startKey: '2',
				minWidth: stepperWidth,
				context:this
			}),
			Menu.checkbox({
				text: 'Limit followup',
				name: 'limitFollowup',
				hoverText: 'Limits the amount of cards that players can follow up with by the defender\'s hand size at the start of the turn',
				hoverPlacement: 'right',
				checked: true
			})
		),*/

		/*Menu.alignLeft(
			Menu.text({
				text:'',
				fixedWidth: 335
			}),
			Menu.checkbox({
				text: 'Free for all',
				name: 'freeForAll',
				hoverText: 'Multiple players will be able to attack at the same time',
				hoverPlacement: 'right'
			})
		),*/

		Menu.alignJustify(
			{
				name:'createGame',
				text:'Create Game',
				action:function(){
					this.createGame();
				},
			},
			{
				name:'cancel',
				text:'Cancel',
				action:function(){
					ui.menus.main.fadeIn();
					ui.logo.fadeIn();
					this.fadeOut();
				},
				context: this
			}
		)
	];
	this.options.layout = layout;

	Menu.call(this, this.options);

	this.limitBotSelectorRange(this.getElementByName('stepOfPlayers').getKey());

	this.updatePosition();
};

extend(LobbyCreator, Menu);

LobbyCreator.prototype.getDefaultLobbyOptions = function(){
	return {
		position: function(){
			return {
				x:game.screenWidth/2,
				y:game.screenHeight/2
			};
		},
		z: 7,
		margin: 25,
		name: 'creator',
		alpha: 1,
		color: 'grey',
		texture: null,
		elementColor: 'orange',
		textColor: 'black',
		corner: 10,
		border: 4,
		fadeTime: 200,
		layout: null,
		closeButtonCrossColor: 'white',
		header: 'Create Game',
		headerHeight: 40,
		// headerColor: 'red',
		headerTextColor: 'white'
	};
};

LobbyCreator.prototype.createGame = function(){
	var gameMode = 'durak';
	var isPrivate = this.getElementByName('private').checked;
	// var difficulty = Number(this.getElementByName('stepOfDifficulty').getKey());
	var config = {
		numPlayers: Number(this.getElementByName('stepOfPlayers').getKey())
		// numBots: Number(this.getElementByName('stepOfBots').getKey()),
		// difficulty: difficulty
	};
	var rules = {
		canTransfer: this.getElementByName('transfer').checked,
		// freeForAll: this.getElementByName('freeForAll').checked,
		// limitAttack: this.getElementByName('limitAttack').checked,
		// limitFollowup: this.getElementByName('limitFollowup').checked,
		// longerTurn: this.getElementByName('longerTurn').checked,
		numCards: Number(this.getElementByName('deckSizeStep').getKey())
	};
	this.fadeOut();
	connection.proxy.createCustomQueue(isPrivate, gameMode, config, rules);
};

LobbyCreator.prototype.limitBotSelectorRange = function(key){
	var botSelector = this.getElementByName('stepOfBots');
	var numPlayers = Number(key);
	var max = 6;
	/*if(numPlayers < 2){
		botSelector.limitRange(1, Infinity);
	}
	else{
		botSelector.limitRange(0, max - numPlayers);
	}*/
};
