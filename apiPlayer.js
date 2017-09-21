/*
 * Api-Player
 */
var apiPlayer = function (name, port, showCardsInTheBeginning=true) {
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
	var _playingEnvido; // Se esta jugando el envido.
	var _envidoSung; // Lista con lo que se canto de tanto
	var _handHistory;
	var _url = 'http://localhost:' + port + '/'; //http://localhost:8000/

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
		_handHistory = {"hand_history": [], "points": 0};
		_playingEnvido = false;
		
		_rounds = []; // Inicializo todo con undefined
		for(var i = 0; i < 3; i++){
			_rounds[i] = {"my_card_played" : undefined, "opponent_card_played": undefined};
		}

		if(showCardsInTheBeginning){
			Log.add({
				Juega: name,
				Message: 'Cardset: ' + _cardSet.logCardset()
			});
		}
	});

    //TODO: Analizar si con el cambio es necesario esto.
	var updateTrucoLevel = function(actions){
		var trucoLevel = _trucoLevel;
		
		actions.each(function (nodeName, node) {
		 	if(nodeName == "Truco"){
		 		trucoLevel = 0; // Todavia no se canto nada, por eso puedo cantar truco.
		 	} else if(nodeName == "ReTruco"){
		 		trucoLevel = 1;
		 	} else if(nodeName == "ValeCuatro"){
		 		trucoLevel = 2;
		 	} else if(node.name == "SecondSectionNoQuiero"){
		 		var newValue = node.value - 1;
		 		if(trucoLevel < newValue){
		 			trucoLevel = newValue;
		 		}
		 	}
		});

		_trucoLevel = trucoLevel;
	}

	var updateTrucloLevelIfIsNeccesary = function(action){
		if(_playingEnvido == false && action.type == Server.ActionType.Message && action.message.name == "Quiero"){
			_trucoLevel++;
		}
	}

	var updatePlayingEnvido = function(action) {
		if(action.type == Server.ActionType.Message && ["Quiero", "NoQuiero"].indexOf(action.message.name) > -1){
			_playingEnvido = false; // Sea q aceptaron el envido el truco seguro que el envido no se esta jugando mas.
			_envidoIsOpen = false; // Idem anterior. Creo q no es necesario pero por las dudas lo apago igual.
		} else if(action.message && action.message.type==Server.MessageType.FirstSectionChallenge) {
			_playingEnvido = true;
		}
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

	var simulateSingTruco = function(){
		var trucoEnvidadoStatus = getData(null);
		trucoEnvidadoStatus.possible_actions = ["PlayCard", "Truco"];
		return {"gameStatus": trucoEnvidadoStatus, "action": {action: "Truco", card: null}};
	}

	var putLearningInformation = function(points){
		if(_handHistory.hand_history.length < 1){
			console.log("Truco envidado no aceptado");
 			// Simulo que cante truco.
			_handHistory.hand_history = [simulateSingTruco()];
		}
		_handHistory['points'] = points;
		jQuery.ajax({
            url: _url,
            type: "PUT",
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
    		dataType: "json",
            success: function (data) {
		        // console.log("Training success");
            },
            data: JSON.stringify(_handHistory)
        });
        _handHistory = {"hand_history": [], "points": 0};
	}

	this.addEventListener("handFinished", function (event) {
		putLearningInformation(event.points);
		if(!showCardsInTheBeginning){
			Log.add({
				Juega: name,
				Message: 'Cartas ronda anterior: ' + _initialCardSet.logCardset()
			});
		}
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
		if(options){
			options.each(function (nodeName, node) {
				possibleActions.push(nodeName);
			});
		}
		return possibleActions;
	}

	var clone = function(obj){
		/*
		No es la forma mas eficiente y no maneja 
		bien las fechas pero para fines practivos va bien
		*/
		return JSON.parse(JSON.stringify(obj))
	}

	var getDecisionType = function(options){
		var type = null;
		options.each(function (nodeName, node) {
			if(nodeName == "Quiero") {
				type = node.name == "FirstSectionQuiero" ? "Envido" : "Truco";
			}
		});

		return type;
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
			"rounds": clone(_rounds),
			"envido": {
				"is_open": _envidoIsOpen,
                "sung": _envidoSung.slice(),
				"oppenent_envido_score": _opponentEnvidoPoints
			},
			"possible_actions": getPossibleActions(options),
			"truco_level": _trucoLevel,
			"decision_type": getDecisionType(options)
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
            url: _url,
            type: "POST",
            crossDomain: true,
            contentType: "application/json; charset=utf-8",
    		dataType: "json",
            success: function (data) {
                _handHistory['hand_history'].push({"gameStatus": requestData, "action": data});
		        // console.log("Exito", data);
				var action;
		        if(data.action == "PlayCard"){
		        	var cardToPlay = pullCardFromSet(data.card);
		        	updateCardPlayed(cardToPlay);
		        	action = new Server.Action(Server.ActionType.Card, cardToPlay);
		        } else {
		        	var actionMessage = Server.Messages[data.action];
					action = new Server.Action(Server.ActionType.Message, actionMessage);
					if(actionMessage.type==Server.MessageType.FirstSectionChallenge){
						updateEnvido(data.action);
					}
					updateTrucloLevelIfIsNeccesary(action);
		        	updatePlayingEnvido(action);
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
		updateTrucloLevelIfIsNeccesary(action);
		updatePlayingEnvido(action);
	});
}
