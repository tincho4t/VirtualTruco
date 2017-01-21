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

	var _initialCardSet = [];
	var _cardSet = [];
	var _mappedCardList = [];
	var _utils = new Utils();
	var _cp = new CommonAPI.CardProcessor();
	var _trucoLevel = 0;
	var _gameState = 0;
	var _Q = zeros_like(4+16+4*16+4*64+9*256, 9);
	var _round = 0; // Indica que numero de jugada vas, primera, segunda o tercera.
	var _iHaveToPlay; // Indica si el que tiene q jugar la proxima carta soy yo o no.

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

	var getStateIndex = function(trucoLevel, gameState){
		return _mappedCardList[0] * 1 +     // 4^0
				_mappedCardList[1] * 4 +    // 4^1
				_mappedCardList[2] * 16 +   // 4^2
				trucoLevel * 64 + // 4^3
				gameState * 256;  // 4^4
	}

	var actionToColumIndex = function(nodeName){
		var options = {
			//"EstadoFinal": 0 Es el estado absorvente. Indica un estado final.
			"Truco": 1,
			"ReTruco": 2,
			"ValeCuatro": 3,
			"Quiero": 4,
			"NoQuiero": 5,
			"PlayCardHigh": 6,
			"PlayCardLow": 7,
			"PlayCardMiddle": 8,
			"PostScore": 9,
			"SonBuenas": 10,
			"Envido": 11,
			"RealEnvido": 12,
			"FaltaEnvido": 13,
			"GoToDeck": 14
		}

		return options[nodeName];
	}

	var columIndexToAction = function(index){
		var options = {
			1:"Truco",
			2:"ReTruco",
			3:"ValeCuatro",
			4:"Quiero",
			5:"NoQuiero",
			6:"PlayCardHigh",
			7:"PlayCardLow",
			8:"PlayCardMiddle",
			9:"PostScore",
			10:"SonBuenas",
			11:"Envido",
			12:"RealEnvido",
			13:"FaltaEnvido",
			14:"GoToDeck"
		}

		return options[index];
	}
	
	/**
	 * Devuelve las cartas mapeadas
	 * a la simplificacion de estados
	 * ordenadas de menor a mayor
	 * independientmente si ya se jugaron o no
	 **/
	var loadMappedCards = function(){
		_mappedCardList.push(simplifyWeights(_cp.getCardWeight(_initialCardSet.getCard1())));
		_mappedCardList.push(simplifyWeights(_cp.getCardWeight(_initialCardSet.getCard2())));
		_mappedCardList.push(simplifyWeights(_cp.getCardWeight(_initialCardSet.getCard3())));
		_mappedCardList.sort(); // Las ordenamos porque por mas que teoricamente sea lo mismo nos va a converger mas rapido.
	}

	var useCard = function(action){
		var orderedCards = _cardSet.getWinnerCards();
		switch(action) {
			case "PlayCardHigh":
				card = orderedCards[0];
				break;
			case "PlayCardMiddle":
				card = orderedCards[1];
				break;
			default:
				card = orderedCards[orderedCards.length-1];
		}

		_cardSet.pullCard(card);
		return(card);
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

	var getBestQAction = function(row, columns){
		//TODO: Esto esta mal, solamente devuelve la mejor accion actual dado mi estado. Osea no aprende.
		// En realidad deberia explorar alguna accion possible de este estado actual, osea alguna de las columnas que recibe (no tiene que ser la mejor)
		// Luego tenemos que calcular a que nueva row nos llevaria esa columna si la "tomamos", en ese nuevo estado(row) calcular el maximo
		// valor de _Q[nueva_row]
		// Luego actualizamos _Q[row_actual][columna_elegida] += learning_rate * maximo(_Q[nueva_row])
		maxCol = 0;
		maxColValue = -99999;
		for(col=0;col<columns.length;col++){
			currentColumn = columns[col]
			currentValue = _Q[row][currentColumn]
			if(currentValue > maxColValue){
				maxCol = currentColumn
				maxColValue = currentValue
			}
		}
		return(columIndexToAction(maxCol))
	}

	/** Podes ganar perder o empardar **/
		var getNextStatesIfOpponentHaveToPlay = function(trucoLevel){
			//TODO:
			return [];
		}

	var getNextsStates = function(stateIndex, actionIndex){
		var states = [];
		switch (actionIndex){
			case 0: // Es estado final -> Me quedo en el mismo estado
				states.push(stateIndex);
				break;
			case 5: // No quiero -> Perdi
				states.push(getStateIndex(_trucoLevel, 8));
				break;
			case 1: // Cantar Truco
			case 2: // Catar Quiero Retruco
				if(!_iHaveToPlay){
					states.push(getStateIndex(_trucoLevel + 1, _gameState)); // Por mas que le toque jugar a el todavia puede subirme el truco.
				}
				// No esta el break a proposito.
			case 3: // Cantar Quiero vale cuatro
				states.push(getStateIndex(_trucoLevel, 7)); // Gano xq no quiere.
				
				// Si acepta:
				if(_iHaveToPlay){
					states.push(getStateIndex(_trucoLevel + 1, _gameState)); // Aceptar o subir concretan la subida del trucoLevel.
				} else { 
					states.concat(getNextStatesIfOpponentHaveToPlay(_trucoLevel + 1));
				}
				
				break;
			case 4: // Quiero
				if(_iHaveToPlay){
					//TODO:
				} else {
					states.concat(getNextStatesIfOpponentHaveToPlay(_trucoLevel));
				}



		}
/*
		//"EstadoFinal": 0 Es el estado absorvente. Indica un estado final.
			"Quiero": 4,
			"PlayCardHigh": 6,
			"PlayCardLow": 7,
			"PlayCardMiddle": 8
			*/
		return states;

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

	var updateIHaveToPlay = function(options){
		if(_iHaveToPlay) return; // Si me tocaba jugar antes no valido
		
		// Si no me tocaba y me dan la opcion de No Querer es xq me cantaron algo y todavia no es mi turno.
		haveToPlay = true;
		options.each(function (nodeName, node) {
			if(nodeName=="NoQuiero"){ // Si me cantaron tanto lo rechazo.
				if(node.name=="SecondSectionNoQuiero"){
					haveToPlay = false;
				}
			}
		});
		_iHaveToPlay = haveToPlay;
	}

	var getRandomOption = function (opts) {
		return opts[_utils.random(0, opts.length-1)];
	}

	var getAction = function (options) {
		var action = null;
		var nodeNames = [];
		options.each(function (nodeName, node) {
			if(nodeName=="NoQuiero"){ // Si me cantaron tanto lo rechazo.
				if(node.name=="FirstSectionNoQuiero"){
					action = new Server.Action(Server.ActionType.Message, Server.Messages[CommonAPI.NO_QUIERO]);
				}
			}
			if(!nodeName.includes("Envido")){
				nodeNames.push(nodeName);				
			}
		});
		if(action){
			return(action);
		}

		indexes = actionsNodesToMatrixColumIndexes(nodeNames);
		state = getStateIndex(_trucoLevel, _gameState);
		bestAction = getBestQAction(state, indexes);
		if(bestAction.includes("Play")) {
		   card = useCard(bestAction);
		   action = new Server.Action(Server.ActionType.Card, card);
		}
		else {
		   action = new Server.Action(Server.ActionType.Message, Server.Messages[bestAction]);
		}
		return action;
	}


	// Dada las acciones disponibles devuelve un array con los numeros que le corresponden
	// Si es PlayCard lo splitea en 3, uno para cada posible carta.
	var actionsNodesToMatrixColumIndexes = function(nodeNames){

		// Cambio PlayCard por PlayCard High, Middle y Low
		var playCardIndex = nodeNames.indexOf("PlayCard");
		if(playCardIndex > -1){
			nodeNames.splice(playCardIndex, 1);
			nodeNames.push("PlayCardHigh");
			if(_cardSet.getCount() > 1 ){
				nodeNames.push("PlayCardLow");
			}
			if(_cardSet.getCount() > 2 ){
				nodeNames.push("PlayCardMiddle");
			}
		}

		var indexes = [];
		nodeNames.forEach(function(name){
			indexes.push(actionToColumIndex(name));
		});

		return indexes;
	}

	this.setName(name);

	this.addEventListener("handInit", function (event) {
		_cardSet = this.getCardSet();
		_initialCardSet = this.getCardSet();
		loadMappedCards();
		_trucoLevel = 0;
		_gameState = 0;
		_round = 0;
		_iHaveToPlay = event.hasHand;
	});
	this.addEventListener("handEnd", function (event) {
		// event.cardShowing
	});

	this.addEventListener("roundEnds", function (event) {
		updateGameState(event.state);
		_iHaveToPlay = state == "win";
		_round++;
	});
	this.addEventListener("play", function (event) {
		updateTrucoLevel(event.options);
		updateIHaveToPlay(event.options);

		var action = getAction(event.options);

		Log.add({
			Juega: name,
			Message: action.message? action.message.name: action.card
		});

		this.postAction(action);
	});
}