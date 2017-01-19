var zeros_like = function(n, m){
    var array = [], row = [];
    while (m--) row.push(0);
    while (n--) array.push(row.slice());
    return array;
}
/*
 * Q-Learning player
 */
var QPlayer = function (name) {
	CommonAPI.AbstractPlayer.call(this);

	var _cardSet = [];
	var _mappedCardList = [];
	var _utils = new Utils();
	var _cp = new CommonAPI.CardProcessor();
	var _trucoLevel = 0;
	var _gameState = 0;
	var _Q = zeros_like(4+16+4*16+4*64+9*256, 8);

	var simplifyWeights = function(weight){
		if(weight >= 11){ // 4 al 7
			return 0;
		} else if (weight >= 7){ // 10,11,12, anchos falsos
			return 1;
		} else if (weight >= 5){ // 2 y 3
			return 2;
		} else { // Cartas fuertes
			return 3;
		}
	}
	/**
	 * Devuelve las cartas mapeadas
	 * a la simplificacion de estados
	 * ordenadas de menor a mayor
	 * independientmente si ya se jugaron o no
	 **/
	var loadMappedCards = function(){
		_mappedCardList.push(simplifyWeights(cp.getCardWeight(_cardSet.getCard1())));
		_mappedCardList.push(simplifyWeights(cp.getCardWeight(_cardSet.getCard2())));
		_mappedCardList.push(simplifyWeights(cp.getCardWeight(_cardSet.getCard3())));
		_mappedCardList.sort(); // Las ordenamos porque por mas que teoricamente sea lo mismo nos va a converger mas rapido.
	}

	var updateTrucoLevel = function(actions){
		var trucoLevel = _trucoLevel;
		
		actions.each(function (nodeName, node) {
		 	if(nodeName == "Truco"){
		 		trucoLevel = 0; // Todavia no se canto nada, por eso puedo cantar truco.
		 	} else if(nodeName == "ReTruco"){
		 		trucoLevel = 1;
		 	} else if(nodeName == "ValeCuatro"){
		 		trucoLevel = 2;
		 	} else if(nodeName == "NoQuiero"){
		 		var newValue = node.value - 1;
		 		if(trucoLevel < newValue){
		 			trucoLevel = newValue;
		 		}
		 	} //TODO: Validar si no hay un bug aca.
		});

		_trucoLevel = trucoLevel;
	}

	var updateGameState = function(state){
		//0: NADA
		//1: GANE_1
		//2: PERDI_1
		//3: Empate_1
		//4: Empate1_Empate2
		//5: Gane1_Perdi2
		//6: Perdi1_Gane2
		//7: Gane la partida
		//8: perdi la partida
		if(_gameState == 0){
			if(state == "win"){
				_gameState = 1;
			} else if(state == "lose"){
				_gameState = 2;
			} else {
				_gameState = 3;
			}
		} else if(_gameState == 1){
			if(state == "lose"){
				_gameState = 5;
			} else {
				_gameState = 7;
			}
		} else if(_gameState == 2){
			if(state == "win"){
				_gameState = 6;
			} else {
				_gameState = 8;
			}
		} else if(_gameState == 3){
			if(state == "win"){
				_gameState = 7;
			} else if(state == "lose") {
				_gameState = 8;
			} else {
				_gameState = 4;
			}
		} else if(_gameState == 4){
			if(state == "win"){
				_gameState = 7;
			} else {
				_gameState = 8;
			}
		}
	}

	var getIndex = function(){
		return _mappedCardList[0] * 1 +     // 4^0
				_mappedCardList[1] * 4 +    // 4^1
				_mappedCardList[2] * 16 +   // 4^2
				_trucoLevel * 64 + // 4^3
				_gameState * 256;  // 4^4
	}

	var getRandomOption = function (opts) {
		return opts[_utils.random(0, opts.length-1)];
	}

	var getAction = function (options) {
		//TODO: COMPLETAR ESTA FUNCION

		event.options.each(function (nodeName, node) {
			if(!nodeName.includes("Envido")) {
				_allMyOptions.push(node);
			}
		});

		
		// var action;
		// if(randOption==CommonAPI.PLAY_CARD) {
		// 	action = new Server.Action(Server.ActionType.Card, _cardSet.getNextCard());
		// }
		// else {
		// 	action = new Server.Action(Server.ActionType.Message, Server.Messages[randOption]);
		// }
		// return action;
	}

	var actionToColumIndex = function(nodeName){
		var options = {
			"Truco": 0,
			"ReTruco": 1,
			"ValeCuatro": 2,
			"Quiero": 3,
			"NoQuiero": 4,
			"PlayCardHigh": 5,
			"PlayCardLow": 6,
			"PlayCardMiddle": 7,
			"PostScore": 8,
			"SonBuenas": 9,
			"Envido": 10,
			"RealEnvido": 11,
			"FaltaEnvido": 12,
			"GoToDeck": 13
		}

		return options[nodesName];
	}


	// Dada las acciones disponibles devuelve un array con los numeros que le corresponden
	// Si es PlayCard lo splitea en 3, uno para cada posible carta.
	var actionsNodesToMatrixColumIndexes = function(nodesNames){

		// Cambio PlayCard por PlayCard High, Middle y Low
		var playCardIndex = nodesNames.includes("PlayCard");
		if(playCardIndex > -1){
			nodesNames.splice(playCardIndex, 1);
			nodesNames.push("PlayCardHigh");
			if(this.getCardSet().length > 1 ){
				nodesNames.push("PlayCardLow");
			}
			if(this.getCardSet().length > 2 ){
				nodesNames.push("PlayCardMiddle");
			}
		}

		var indexes = [];
		nodesNames.each(function(name){
			indexes.push(actionToColumIndex(name));
		});

		return indexes;
	}

	this.setName(name);

	this.addEventListener("handInit", function (event) {
		_cardSet = this.getCardSet();
		loadMappedCards();
		_trucoLevel = 0;
		_gameState = 0;
	});
	this.addEventListener("handEnd", function (event) {
		// event.cardShowing
	});

	this.addEventListener("roundEnds", function (event) {
		updateGameState(event.state);
	});
	this.addEventListener("play", function (event) {
		updateTrucoLevel(event.options);

		var action = getAction(event.options);

		Log.add({
			Juega: name,
			Message: action.message? action.message.name: action.card
		});

		this.postAction(action);
	});
}
