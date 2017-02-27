/*
 * Api-Player
 */
var apiPlayer = function (name) {
	CommonAPI.AbstractPlayer.call(this);

	var _initialCardSet = [];
	var _cardSet = [];
	var _mappedCardList = [];
	var _utils = new Utils();
	var _cp = new CommonAPI.CardProcessor();
	var _trucoLevel = 0;
	var _gameState = 0;
	var _round = 0; // Indica que numero de jugada vas, primera, segunda o tercera.
	var _iHaveToPlay; // Indica si el que tiene q jugar la proxima carta soy yo o no.
	var _maxScore = 0; // Indica a cuanto se esta jugando.
	var _myScore = 0;
	var _opponentScore = 0;
	
	/**
	 * Devuelve las cartas mapeadas
	 * a la simplificacion de estados
	 * ordenadas de menor a mayor
	 * independientmente si ya se jugaron o no
	 **/
	var loadMappedCards = function(){
		_mappedCardList.push(_initialCardSet.getCard1());
		_mappedCardList.push(_initialCardSet.getCard2());
		_mappedCardList.push(_initialCardSet.getCard3());
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

	this.setName(name);

	this.addEventListener("handInit", function (event) {
		_cardSet = this.getCardSet();
		_initialCardSet = this.getCardSet();
		loadMappedCards();
		_trucoLevel = 0;
		_gameState = 0;
		_round = 0;
		_iHaveToPlay = event.hasHand;
		_maxScore = event.maxScore;
		_myScore = event.myScore;
		_opponentScore = event.opponentScore;
	});
	this.addEventListener("handFinished", function (event) {
		//TODO: llamar a la api para que aprenda.
	});

	this.addEventListener("roundEnds", function (event) {
		updateGameState(event.state);
		_iHaveToPlay = state == "win";
		_round++;
	});

	var getRandomOption = function (opts) {
		return opts[_utils.random(0, opts.length-1)];
	}

	var getAction = function (randOption) {
		var action;
		if(randOption==CommonAPI.PLAY_CARD) {
			action = new Server.Action(Server.ActionType.Card, _cardSet.getNextCard());
		}
		else {
			action = new Server.Action(Server.ActionType.Message, Server.Messages[randOption]);
		}
		return action;
	}

	var getRandomAction = function(options){
		var _randOption = null;
		var _allMyOptions = [];

		options.each(function (nodeName, node) {
			if(nodeName != "FaltaEnvido" || _cardSet.calculateEnvido() > 30) {
				_allMyOptions.push(nodeName);
			}
		});
		_randOption = getRandomOption(_allMyOptions);
		return getAction(_randOption);
	}

	var getCardsNotPlayed = function(){
		var cards_not_played = [];
		if(_cardSet.getCard1() != undefined){
			cards_not_played.push({"suit": _cardSet.getCard1().suit, "value": _cardSet.getCard1().value});
		}
		if(_cardSet.getCard2() != undefined){
			cards_not_played.push({"suit": _cardSet.getCard2().suit, "value": _cardSet.getCard2().value});
		}
		if(_cardSet.getCard3() != undefined){
			cards_not_played.push({"suit": _cardSet.getCard3().suit, "value": _cardSet.getCard3().value});
		}
		return cards_not_played;
	}

	var getData = function(){
		var data = {
			"score": {
				"my_score": _myScore,
                "opponent_score": _opponentScore,
                "score_to_win": _maxScore
			},
			"cards_not_played": getCardsNotPlayed()
		};
		return {
            "score": {
                "my_score": 15,
                "opponent_score": 17,
                "score_to_win": 30
            },
            "cards_not_played": [
                {
                    "suit": "Coin",
                    "value": 1
                },
                {
                    "suit": "Sword",
                    "value": 7
                }
            ],
            "round": {
                "actual_round": "second",
                "first_round": {
                    "my_card_played" : {"suit": "Coin", "value": 5},
                    "opponent_card_played": {"suit": "Coup", "value": 7}
                },
                "second_round": {
                    "my_card_played" : null,
                    "opponent_card_played": {"suit": "Sword", "value": 2}
                }
            },
            "i_am_hand": true,
            "envido": {
                "status": "finished",
                "sung": ["Envido", "Envido", "RealEnvido"],
                "oppenent_envido_score": 26
            }
        };
	}

	this.addEventListener("play", function (event) {
		updateTrucoLevel(event.options);
		updateIHaveToPlay(event.options);

		var action = getRandomAction(event.options);
		jQuery.ajax({
            url: 'http://localhost:8000/',
            type: "POST",
            contentType: "application/json; charset=utf-8",
    		dataType: "json",
            success: function (data) {
                console.log("EXITO");
                console.log(data);
            },
            data: JSON.stringify(getData())
        });
		Log.add({
			Juega: name,
			Message: action.message? action.message.name: action.card
		});

		this.postAction(action);
	});
}
