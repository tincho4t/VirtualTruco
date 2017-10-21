
function Tournament(playerBuilders){

	this.playerBuilders = playerBuilders;

	var _handsQueue = new Array();

	var _gamesRecord = new Array(); // Lista que contiene todos los registros de los partidos finalizados

	var _tableIsFree = false;

	var _recordsMaxSize = 10000;

	var _playersNames = new Array();

	this.realeaseTable = function() {
		_tableIsFree = true;
	}

	var _buildRecord = function(playerName1, playerPoints1, playerName2, playerPoints2) {
		return {
			playerName1: playerName1,
			playerName2: playerName2,
			playerPoints1: playerPoints1,
			playerPoints2: playerPoints2
		}
	}

	this.recordMetric = function(playerName1, playerPoints1, playerName2, playerPoints2) {
		_gamesRecord.unshift(_buildRecord(playerName1, playerPoints1, playerName2, playerPoints2)); // Agrego al comienzo
		if(_gamesRecord.length > _recordsMaxSize){
			_gamesRecord.pop(); // Saco el ultimo que es el mas viejo		
		}
	}

	var _play = function(){
		var nextHandToPlay = _handsQueue.pop(); // Saco la mas vieja (ultima) para ejecutarla
		nextHandToPlay(); 
	}

	this.pause = function() {
		_tableIsFree = false;
	}

	this.resume = function() {
		this.realeaseTable();
		_play();
	}

	/**
	 * Recive el metodo nextHand y lo wrappea para
	 **/
	this.handleNextHand = function(nextHand) {
		_handsQueue.unshift(nextHand); // Ingresa al comienzo de la fila
		if(_tableIsFree){
			_play();
		}
	}

	this.init = function(){
		for(var i=0; i < this.playerBuilders.length; i++){
			var player1Builder = this.playerBuilders[i];
			_playersNames.push(player1Builder().getName());
			for(var j= i+1; j < this.playerBuilders.length; j++){
				var player2Builder = this.playerBuilders[j];
				var player1 = player1Builder();
				var player2 = player2Builder();
				console.log("Creando game entre: " + player1.getName() + " " + player2.getName());
				new Server.GameManager(new Server.GameConfig("AI Truco Championship"), player1, player2, this.handleNextHand, this.recordMetric);
			}
		}
		this.realeaseTable();
		_play();
	};

	this.init();

	var logPlayerStatistics = function(playerName) {
		var matchs = 0;
		var points = 0;
		var n = 0;

		for(var i in _gamesRecord){
			var record = _gamesRecord[i];
			if(record['playerName1'] == playerName) {
				n++;
				points += record['playerPoints1'] - record['playerPoints2']
				matchs += record['playerPoints1'] > record['playerPoints2']
			} else if(record['playerName2'] == playerName) {
				n++;
				points += record['playerPoints2'] - record['playerPoints1']
				matchs += record['playerPoints2'] > record['playerPoints1']
			}
		}
		console.log(playerName + ": Matchs: " + matchs / n + " points: " + points / n + " n: " + n);
	} 

	this.showStatistics = function (){
		for(var pi in _playersNames){
			var player = _playersNames[pi];
			logPlayerStatistics(player);
		}
	}
}