/**
* Состояние игры, отвечающее за отображение главного меню игры.
* Синхронное состояние.
* @namespace stateMenu
* @property {string} key='menu' Название состояния.
* @see {@link State}
* @see {@link StateManager}
*/

/* exported stateMenu */
var stateMenu = new State('menu', {

	/**
	* Выводит дебаг информацию.
	* @memberof stateMenu
	*/
	render: function(){
		game.fixPause();
		game.updateDebug();
	},

	/**
	* Обновляет размер и позицию всех элементов игры.
	* @memberof stateMenu
	*/
	postResize: function(){
		ui.updatePositions();
		cardEmitter.restart(true);
		document.getElementById('loading').style.display = 'none';
	},

	/**
	* Применяет текущий скин ко всем элементам игры
	* @memberof stateMenu
	*/
	applySkin: function(){
		ui.updatePositions();
		cardEmitter.applySkin();
		ui.applySkin();
	},

	/**
	* Включает эмиттер карт, показывает главное меню и лого.
	* @memberof stateMenu
	*/
	create: function(lastState){
		if(lastState != 'queue'){
			cardEmitter.start(10, 50, 10, 2000, 20, 1);
		}

		ui.menus.main.fadeIn();
		ui.logo.fadeIn();
	},

	/**
	* Отключает эмиттер карт, прячет главное меню и лого.
	* @memberof stateMenu
	*/
	shutdown: function(nextState){
		if(nextState != 'queue'){
			cardEmitter.stop();
		}
		ui.menus.main.fadeOut();
		ui.menus.browser.fadeOut();
		ui.menus.creator.fadeOut();
		ui.logo.fadeOut();
		ui.modalManager.closeModal();
	}
});
