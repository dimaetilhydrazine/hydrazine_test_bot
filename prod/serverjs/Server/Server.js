'use strict';

// Node модули
const
	express = require('express'),
	http = require('http'),
	path = require('path'),
	Eureca = require('../vendor/eureca.io/EurecaServer'),
	minimist = require('minimist'),
	Log = require('../logger');

// Игровые модули
const
	QueueManager = reqfromroot('Queue/QueueManager'),
	DurakGame = reqfromroot('Game/Durak/DurakGame'),
	Bot = reqfromroot('Player/Bot'),
	Player = reqfromroot('Player/Player'),
	Tests = reqfromroot('Tests/GameTest'),
	getRemoteFunctions = reqfromroot('Server/remoteFunctions');

class Server extends Eureca.Eureca.Server{

	/**
 	 * Сервер на основе eureca.io
	* @param  {object} config    конфигурация Eureca.io сервера
	* @param  {array} paramLine  параметры командной строки
	*/
	constructor(config, paramLine){
		super(config);

		/**
		* Параметры сервера.
		* @type {object}
		*/
		this.params = this.parseParams(paramLine);

		/**
		* Логгер сервера.
		* @type {winston.Logger}
		*/
		this.log = this.createLogger();

		/**
		* Существующие режимы игры в виде `[GameClass, BotClass]`.
		* @type {Object<array>}
		*/
		this.gameModes = {
			'durak': [DurakGame, Bot]
		};

		/**
		* Менеджер очередей и игр.
		* @type {QueueManager}
		*/
		this.manager = new QueueManager(this, {
			game: this.gameModes['durak'][0],
			// bot: this.gameModes['durak'][1],
			numPlayers: this.params.numPlayers,
			// numBots: this.params.numBots,
			debug: this.params.debug,
			name: 'Quick Game'
		},
		{
			canTransfer: this.params.transfer,
			// limitFollowup: !this.params.followup,
			// limitAttack: !this.params.attack,
			// freeForAll: this.params.freeForAll
		});

		let rootPath = '/../../';
		/**
		* Express приложение.
		* @see {@link https://expressjs.com/}
		* @type {function}
		*/
		this.app = express();
		this.app.set('trust proxy', true);

		if (!process.env.PROD) {
			this.app.use(express.static(path.join(__dirname, rootPath, '/public')));
		}

		/**
		* Подключенные клиенты
		* @type {Object<Object>}
		*/
		this.clients = {};

		/**
		* Игроки.
		* @type {Object<Player>}
		*/
		this.players = {};

		this.playerNames = [];

		for(let i = 0; i < 1000; i++){
			this.playerNames.unshift('Player' + (i + 1));
		}

		// Биндим функции на ивенты
		this.on('connect', this.handleConnect);
		this.on('disconnect', this.handleDisconnect);
		this.on('error', this.handleError);
		this.on('message', this.handleMessage);

		/**
		* Функции, доступные со стороны клиента.
		* @see {@link module:serverjs/Server/remoteFunctions|remoteFunctions}
		* @type {object}
		*/
		this.exports = getRemoteFunctions(this);

		/**
		* Node.js http сервер.
		* {@link Server#app} прикрепляется сюда, как колбэк.
		* http сервер затем прикрепляется к Eureca.Server (расширением которого является текущий класс)
		* и обрабатывается им.
		* @type {http.Server}
		*/
		this.httpServer = http.createServer(this.app);
		this.attach(this.httpServer);
	}

	/**
	* Обрабатывает параметры при помощи minimist.
	* @param  {array} paramLine параметры командной строки
	* @return {object}          Обработанные параметры.
	*/
	parseParams(paramLine){
		let argv = minimist(paramLine);
		let params = {
			// numBots: Number(process.env.BOTS) || (argv.b === undefined ? Number(argv.bots) : Number(argv.b)),
			numPlayers: Number(process.env.PLAYERS) || (argv.p === undefined ? Number(argv.players) : Number(argv.p)),
			transfer: Boolean(process.env.TRANSFER || argv.transfer),
			// followup: Boolean(process.env.FOLLOWUP || argv.followup),
			// freeForAll: Boolean(process.env.FREEFORALL || argv.ffa || argv.freeforall),
			// attack: Boolean(process.env.ATTACK || argv.attack),
			testing: argv.t || argv.test || argv.testing || false,
			// decisionTime: typeof argv.dt == 'number' ? argv.dt : argv.decisiontime,
			debug: process.env.DEBUG || argv.d || argv.debug || 'notice',
			port: process.env.PORT || Number(argv.port)
		};

		if(params.debug && typeof params.debug != 'string'){
			params.debug = 'debug';
		}

		if(isNaN(params.port) || !params.port){
			params.port = 5000;
		}
		if(isNaN(params.numBots)){
			params.numBots = 0;
		}
		if(isNaN(params.numPlayers) || !params.numPlayers){
			params.numPlayers = 4;
		}
		if(isNaN(params.decisionTime)){
			params.decisionTime = 1500;
		}

		return params;
	}

	/**
	* Создает winston логгер.
	* @return {winston.Logger} Логгер.
	*/
	createLogger(){
		let log = Log(module, null, this.params.debug);

		log.notice(
			'port=' + this.params.port,
			'numBots=' + this.params.numBots,
			'numPlayers=' + this.params.numPlayers,
			'transfer=' + this.params.transfer,
			'freeForAll=' + this.params.freeForAll,
			'decisionTime=' + this.params.decisionTime,
			'testing=' + this.params.testing,
			'debug=' + this.params.debug
		);

		return log;
	}

	/**
	* Обработка подключения нового клиента.
	* @param  {object} conn информация о соединении
	*/
	handleConnect(conn){
		if(this.params.testing){
			return;
		}

		// getClient позволяет нам получить доступ к функциям на стороне клиента
		let remote = this.getClient(conn.id);

		// Запоминаем информацию о клиенте
		this.clients[conn.id] = {id: conn.id, remote: remote};

		let name;
		if(this.playerNames.length){
			name = this.playerNames.pop();
		}

		// Подключаем клиента к экземпляру игрока
		let p = new Player(remote, conn.id, name);

		this.log.notice('New client %s (%s)', p.id, conn.id, conn.remoteAddress);

		// Запускаем игру с ботами и игроком
		this.players[conn.id] = p;
	}

	/**
	* Обработка отключения клиента.
	* @param  {object} conn информация о соединении
	*/
	handleDisconnect(conn){
		if(this.params.testing){
			return;
		}

		this.log.notice('Client disconnected ', conn.id);

		let removeId = conn.id;

		let p = this.players[removeId];

		if(p){
			if(this.manager.disconnectPlayer(p)){
				this.deletePlayer(removeId);
			}
		}

		delete this.clients[removeId];
	}

	/** Оработка ошибок. */
	handleError(conn){

	}

	/**
	* Выполняется при любом ответе от клиента.
	* @param  {object} conn информация о соединении
	*/
	handleMessage(conn){

	}

	/** Запускает сервер */
	start(){
		try {
			this.httpServer.listen(this.params.port, () => {
				this.log.notice('Running on port', this.params.port);
				if(this.params.testing){
					Tests.runTest(this.params);
				}
			});
		} catch (er) {
			console.log('There was an error starting the server:', er);
		}
	}

	deletePlayer(connId){
		let player = this.players[connId];
		if(player){
			if(!player.nameChanged){
				this.playerNames.push(player.name);
			}
			delete this.players[connId];
		}
	}

	changePlayerName(connId, name){
		let player = this.players[connId];
		if(player){
			if(typeof name != 'string' || name.length < 1 || name.length > 15){
				player.recieveSystemNotification({type: 'NAME_INVALID'});
				return;
			}
			name = name.replace(/[^a-zA-Z0-9 \.,!?{}\(\)\[\]\*$#@%^&\-+=\\\/_<>~"';:|`]/g, '');
			if(name.length < 1 || name.length > 15){
				player.recieveSystemNotification({type: 'NAME_INVALID'});
				return;
			}
			if(!player.nameChanged){
				this.playerNames.push(player.name);
			}
			player.name = name;
			player.nameChanged = true;
			player.recieveSystemNotification({type: 'NAME_CHANGED', name: name});
		}
	}

}

/**
* {@link Server}
* @module
*/
module.exports = Server;
