/*
 * Api-Player
 */
var apiPlayer = function (name) {
	CommonAPI.AbstractPlayer.call(this);

	var _initialCardSet = [];
	var _cardSet = [];
	var _utils = new Utils();
	var _cp = new CommonAPI.CardProcessor();
	var _trucoLevel = 0;
	var _gameState = 0;
	var _round = 0; // Indica que numero de jugada vas, primera, segunda o tercera.
	var _rounds; // Representa las cartas jugadas en cada round.
	var _iHaveToPlay; // Indica si el que tiene q jugar la proxima carta soy yo o no.
	var _maxScore = 0; // Indica a cuanto se esta jugando.
	var _myScore = 0;
	var _opponentScore = 0;
	var _opponentEnvidoPoints = -1; // Inicializo con -1 q significa que no sabe o "son buenas"
	var _iAmHand;
	var _envidoIsOpen; // El envido esta abierto para cantar.
	var _envidoSung; // Lista con lo que se canto de tanto
	var _handHystory;

	this.addEventListener("handInit", function (event) {
		_cardSet = this.getCardSet();
		_initialCardSet = this.getCardSet();
		_trucoLevel = 0;
		_gameState = 0;
		_round = 0;
		_iHaveToPlay = event.hasHand;
		_iAmHand = event.hasHand;
		_maxScore = event.maxScore;
		_myScore = event.myScore;
		_opponentScore = event.opponentScore;
		_opponentEnvidoPoints = -1;
		_envidoIsOpen = true;
		_envidoSung = [];
		_handHystory = {"hand_hystory": [], "points": 0};
		
		_rounds = []; // Inicializo todo con undefined
		for(var i = 0; i < 3; i++){
			_rounds[i] = {"my_card_played" : undefined, "opponent_card_played": undefined};
		}

		Log.add({
			Juega: name,
			Message: 'Cardset: ' + _cardSet.logCardset()
		});
	});

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

	// Actualiza la variable que mantiene el registro de las cartas ya jugadas.
	var updateCardPlayed = function(card){
		_rounds[_round]["my_card_played"] = {"suit": card.suit, "value": card.value};
	}

	var updateEnvido = function(envido){
		_envidoSung.push(envido);
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

	var putLearningInformation = function(points){
		if(_handHystory.hand_hystory.length < 1){
			console.log("Truco envidado no aceptado");
			return
		}
		_handHystory['points'] = points;
		jQuery.ajax({
            url: 'http://localhost:8000/',
            type: "PUT",
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
    		dataType: "json",
            success: function (data) {
		        // console.log("Training success");
            },
            data: JSON.stringify(_handHystory)
        });
        _handHystory = {"hand_hystory": [], "points": 0};
	}

	this.addEventListener("handFinished", function (event) {
		putLearningInformation(event.points);
	});

	this.addEventListener("roundEnds", function (event) {
		updateGameState(event.state);
		_iHaveToPlay = event.state == "win";
		_round++;
		_envidoIsOpen = false;
	});

	var getCardsNotPlayed = function(){
		var cards_not_played = [];
		_cardSet.getCards().forEach(function(card){
			cards_not_played.push({"suit": card.suit, "value": card.value});
		})
		return cards_not_played;
	}

	var getInitialCardSet = function(){
		var initial_cards = [];
		cards = [];
		cards.push(_initialCardSet.getCard1());
		cards.push(_initialCardSet.getCard2());
		cards.push(_initialCardSet.getCard3());
		cards.forEach(function(card){
			initial_cards.push({"suit": card.suit, "value": card.value});
		})
		return initial_cards;
	}

	var getPossibleActions = function(options){
		var possibleActions = [];
		options.each(function (nodeName, node) {
			possibleActions.push(nodeName);
		});
		return possibleActions;
	}

	var getData = function(options){
		var data = {
			"score": {
				"my_score": _myScore,
                "opponent_score": _opponentScore,
                "score_to_win": _maxScore
			},
			"initial_cards": getInitialCardSet(),
			"cards_not_played": getCardsNotPlayed(),
			"current_round": _round,
			"i_am_hand": _iAmHand,
			"rounds": _rounds,
			"envido": {
				"is_open": _envidoIsOpen,
                "sung": _envidoSung,
				"oppenent_envido_score": _opponentEnvidoPoints
			},
			"possible_actions": getPossibleActions(options),
			"truco_level": _trucoLevel
		};
		return data;
		/*return {
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
            "current_round": 1,
            "rounds": [
                {
                    "my_card_played" : {"suit": "Coin", "value": 5},
                    "opponent_card_played": {"suit": "Coup", "value": 7}
                },
                {
                    "my_card_played" : null,
                    "opponent_card_played": {"suit": "Sword", "value": 2}
                }
            ],
            "i_am_hand": true,
            "envido": {
                "is_open": false,
                "sung": ["Envido", "Envido", "RealEnvido"],
                "oppenent_envido_score": 26
            },
            "truco_level": 1
        };*/
	}

	var pullCardFromSet = function(cardDto){
		var cardHaveToPlay;
		_cardSet.getCards().forEach(function(card){
			if(card.suit == cardDto.suit && card.value == cardDto.value){
				cardHaveToPlay = card;
			}
		});
		_cardSet.pullCard(cardHaveToPlay);
		return cardHaveToPlay;
	}

	this.addEventListener("play", function (event) {
		updateTrucoLevel(event.options);
		updateIHaveToPlay(event.options);

// Usar esta extension para solucionar el CORS https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi/related?hl=en-US
		var requestData = getData(event.options);
		var thisPlayer = this;
		jQuery.ajax({
            url: 'http://localhost:8000/',
            type: "POST",
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
    		dataType: "json",
            success: function (data) {
                _handHystory['hand_hystory'].push({"gameStatus": requestData, "action": data});
		        // console.log("Exito", data);
				var action;
		        if(data.action == "PlayCard"){
		        	var cardToPlay = pullCardFromSet(data.card);
		        	action = new Server.Action(Server.ActionType.Card, cardToPlay);
		        } else {
					action = new Server.Action(Server.ActionType.Message, Server.Messages[data.action]);
		        }

		        Log.add({
					Juega: name,
					Message: action.message? action.message.name: action.card
				});

				thisPlayer.postAction(action);
            },
            data: JSON.stringify(requestData)
        });
	});	

	this.addEventListener("cardPointsPosted", function (event) {
		_opponentEnvidoPoints = event.cardPoints;
		_envidoIsOpen = false; // Cierro el envido xq se acaba de terminar de cantar.
	});

	this.addEventListener("ownScoreChange", function (event) {
		putLearningInformation(event.score);
	});

	this.addEventListener("opponentScoreChange", function (event) {
		putLearningInformation(-event.score);
	});

	this.addEventListener("opponentPlay", function (event) {
		var action = event.action;
		if(action.type == Server.ActionType.Card){
			_rounds[_round].opponent_card_played = {"suit": action.card.suit, "value": action.card.value}; // Actualizo las played cards.
		} else if(action.message.type == Server.MessageType.FirstSectionChallenge){
			_envidoSung.push(action.message.name);
		}

	});
}
