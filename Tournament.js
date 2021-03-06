
function Tournament(playerBuilders, maxRecordUntilFinish = null, refreshAfterNGames = null){

	this.playerBuilders = playerBuilders;

	var _handsQueue = new Array();

	var _gamesRecord = new Array(); // Lista que contiene todos los registros de los partidos finalizados

	var _tableIsFree = false;

	var _recordsMaxSize = 10000;

	var _playersNames = new Array();
 
	var _maxRecordUntilFinish = maxRecordUntilFinish; // Si seteas esta variable cuando llega a dicha cantidad corta y postea las metricas
	
	var _refreshAfterNGames = refreshAfterNGames; // Si seteas esta variable cuando llega a dicha cantidad refresca la pagina

	this.realeaseTable = function() {
		_tableIsFree = true;
	}

	this.pause = function() {
		_tableIsFree = false;
	}

	var _buildRecord = function(playerName1, playerPoints1, playerName2, playerPoints2) {
		return {
			playerName1: playerName1,
			playerName2: playerName2,
			playerPoints1: playerPoints1,
			playerPoints2: playerPoints2
		}
	}

	var showStatistics = function(){
		var min = getMinimumMatchs();
		for(var pi = 0; pi <_playersNames.length; pi++) {
			var player = _playersNames[pi];
			logPlayerStatistics(player, min);
		}
	}

	var _postMetrics = function(){
		var wins = 0;
		var points = 0;
		for(var i=0; i < _gamesRecord.length; i++){
			var record = _gamesRecord[i];
			wins += record['playerPoints1'] > record['playerPoints2'];
			points += record['playerPoints1'] - record['playerPoints2'];
		}
		var player1AverageWins = wins / _gamesRecord.length;
		var player1AveragePoints = points / _gamesRecord.length;

		jQuery.ajax({
            url: 'http://localhost:8200/',
            type: "POST",
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
    		dataType: "json",
            success: function (data) {
		        // console.log("Training success");
            },
            data: JSON.stringify({'player_1_average_wins': player1AverageWins,
        						  'player_1_average_points': player1AveragePoints})
        });
		console.log("Player 1 gano: ", player1AverageWins);
		console.log("Player 1 gano con puntos: ", player1AveragePoints);
	}

	this.recordMetric = function(playerName1, playerPoints1, playerName2, playerPoints2) {
		_gamesRecord.unshift(_buildRecord(playerName1, playerPoints1, playerName2, playerPoints2)); // Agrego al comienzo
		if(_gamesRecord.length > _recordsMaxSize){
			_gamesRecord.pop(); // Saco el ultimo que es el mas viejo		
		}

		if(_maxRecordUntilFinish && _gamesRecord.length >= _maxRecordUntilFinish){
			_postMetrics();
			_tableIsFree = false;
		}

		if(_gamesRecord.length % 50 == 0){
			showStatistics();
		}

		if(_refreshAfterNGames && _gamesRecord.length >= _refreshAfterNGames){
			location.reload();
		}
	}

	var _play = function(){
		var nextHandToPlay = _handsQueue.pop(); // Saco la mas vieja (ultima) para ejecutarla
		nextHandToPlay(); 
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

	var getPlayersVsDic = function() {
		var playersVs = {};
		for(var i = 0; i < _playersNames.length; i++) {
			for(var j = i+1; j < _playersNames.length; j++) {
				playersVs[[_playersNames[i],_playersNames[j]]] = 0;
			}
		}
		return playersVs;
	}

	var logPlayerStatistics = function(playerName, min) {
		var matchs = 0;
		var points = 0;
		var n = 0;
		var playersVs = getPlayersVsDic();

		for(var i = 0; i< _gamesRecord.length; i++){
			var record = _gamesRecord[i];
			var key = [record['playerName1'],record['playerName2']];
			if(playersVs[key] >= min){
				continue;
			} else {
				playersVs[key]++;
			}

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

	var minOf = function(dic) {
		return dic[Object.keys(dic).reduce(function(a, b){ return dic[a] > dic[b] ? b : a })]
	}

	var getMinimumMatchs = function() {
		var playersVs = getPlayersVsDic();

		for(var i= 0; i < _gamesRecord.length; i++) {
			var record = _gamesRecord[i];
			var key = [record['playerName1'], record['playerName2']];
			playersVs[key]++;
		}
		return minOf(playersVs);
	}


	this.showStatistics = showStatistics();
}