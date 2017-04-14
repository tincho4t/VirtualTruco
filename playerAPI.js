
var HTTPLoader = function(url, method, scope, func){
	var _utils =  new Utils();
	var _url = url;
    var _ready, _cancel;
    var _cnn    =  window.XMLHttpRequest ? new XMLHttpRequest( ) : new ActiveXObject("Microsoft.XMLHTTP");
    
    this.method =  method || "Post";  
    
    this.data = function(){
        return _cnn.responseText;
    }
    
    this.load  = function(data){
        url = url || _url;
        if(!url)return;
        _cnn.open(this.method,url,true);
        _cnn.setRequestHeader('Content-Type','application/x-www-form-urlencoded');    
        _cnn.send(_utils.objectToQueryString({
        	data: JSON.stringify(data)
       	}));
    }
    
    this.setReadyCallback = function(scope,func){
       _ready = {
	       	handler:func,
	       	scope:scope
       };
    }
    
    this.setCancelCallback = function(scope,func){
        _cancel = {handler:func,scope:scope};
    }
    
    this.addRequestHeader = function(type,content){
        _cnn.setRequestHeader( type, content );
    }
    
    var callbackHandler = function(){
        var req        
        if(_ready.handler && _cnn.readyState == 4){
            req = _cnn.status && /200|304/.test( _cnn.status ) ? _ready : _cancel;
            req.handler.call(req.scope,_cnn.responseText);
        }
    }
    
    _url     = url;    
    _cnn.onreadystatechange = callbackHandler;
    this.setReadyCallback(scope,func);
    this.setCancelCallback(scope,function(){alert("Error")});
    
}


var Log = new function () {
	var MAX_LENGTH = 20;
	// var MAX_LENGTH = 2000;
    var _output = document.createElement("div");
    _output.style.fontFamily = "Courier New";
    _output.style.fontSize   = "11px";
    document.body.appendChild(_output);
    
    var addColumn = function (str) {
        var len = 20 - (str+'').length;
        var pipePos = 15 - (str+'').length;
        for (var i=0; i < len; i++) {
                str += "&nbsp;";
                if(i==pipePos)
                        str += "|";
        };
        return str;
    }
    this.add = function (line) {
        var str = "";
        for(var i in line) {
            str += i + ": " + addColumn(line[i]);
        }
        var entry = document.createElement("div")
        entry.innerHTML = str;
        _output.appendChild(entry);
    }

    this.save = function(p1,p2){        
             
    }

    this.clear = function() {
		while (_output.childNodes.length > MAX_LENGTH) {
		    _output.removeChild(_output.firstChild);
		}
    }
}


/*
 * Utils
 * @class
 */
var Utils = function () {

	this.getLastElement = function (elements) {
		return elements[elements.length - 1];
	}
	
	this.objectToQueryString = function (obj){
		var ret = "";
		for(var i in obj)
			ret += i + '=' + obj[i] + '&';
		return ret.substring(0, ret.length-1)
	}
	
	this.random = function (from, to) {
		return Math.floor(Math.random() * (to - from + 1)) + from;
	}
	
	this.copyObject = function (obj, obj2) {
		for(var i in obj2) {
			if(obj2.hasOwnProperty(i)) {
				obj[i] = obj2[i];
			}
		}
		return obj;
	};
	
	this.copyArray = function (array) {
		return ([]).concat(array);
	}
	
	/*
	 * Manejo de evento
	 */
	this.EventManager = function () {
		var _events = {};
		
		this.add = function (eventName, callback) {
			if(!_events[eventName]) {
				_events[eventName] = [];
			}
			_events[eventName].push(callback);
		}
		
		this.fire = function (eventName, eventObj) {
			if(_events[eventName]) {
				for (var i=0; i < _events[eventName].length; i++) {
					_events[eventName][i].call(this, eventObj);
				};
			}
		}
	}
}

/**
 * @Namespace
 */
var NSDeck = new function () {
	
	var _utils = new Utils();
	
	/**
	 * Define lo que es una carta, a partir del valor y el palo
	 */
	var Card = function (value, suit) {
		var _played = false;

		this.value = value;
		this.suit = suit;

		this.setAsPlayed = function() {
			_played = true;
		}
		this.wasPlayed = function() {
			return _played;
		}
	};
	Card.prototype.toString = function () {
		this.toString = function () {
			return this.value + " of " + this.suit;
		}
	}

	/**
	 * Mezclador de cartas
	 */
	this.DeckShuffler = function () {
		this.shuffle = function (deck) {
			var ret = [];
			while(deck.length) {
				ret.push(deck.splice(_utils.random(0, deck.length - 1), 1)[0]);
			}
			return ret;
		}
	}
	
	/**
	 * Maso de cartas
	 */
	var Deck = this.Deck = function (values, suits, shuffler) {
		var _cards = [];
		
		var init = function () {
			for (var i=0; i < values.length; i++) {
				for (var j=0; j < suits.length; j++) {
					_cards.push(new Card(values[i], suits[j]));
				};
			};
		}
		init();
		
		this.shuffle = function () {
			_cards = shuffler.shuffle(_cards);
		}
		this.takeCard = function (count) {
			return _cards.splice(0, count);
		}
		this.takeBackCard = function (cards) {
			_cards.concat(cards);
		}
	}
	
	/**
	 * Se define el mazo de cartas españolas
	 */
	this.SpanishDeck = function (shuffler) {
		var _deckValues = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
		var _deckSuits = ["Cup", "Coin", "Club", "Sword"];
		Deck.call(this, _deckValues, _deckSuits, shuffler);
	}
}


/**
 * API
 */
var CommonAPI = new function () {
	this.ENVIDO 		= "Envido"
	this.REAL_ENVIDO	= "RealEnvido";
	this.FALTA_ENVIDO 	= "FaltaEnvido";
	this.TRUCO 			= "Truco";
	this.RE_TRUCO	 	= "ReTruco";
	this.VALE_CUATRO	= "ValeCuatro";
	this.QUIERO 		= "Quiero";
	this.NO_QUIERO 		= "NoQuiero";
	this.GO_TO_DECK		= "GoToDeck";
	this.POST_SCORE 	= "PostScore";
	this.PLAY_CARD 		= "PlayCard";
	this.SON_BUENAS		= "SonBuenas";

	this.ActionFactory = new function () {

		this.createEnvido = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.Envido);
		}
		
		this.createRealEnvido = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.RealEnvido);
		}
		
		this.createFaltaEnvido = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.FaltaEnvido);
		}
		
		
		this.createSonBuenas = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.SonBuenas);
		}
		
		
		this.createTruco = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.Truco);
		}
		
		
		this.createReTruco = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.ReTruco);
		}
		
		
		this.createValeCuatro = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.ValeCuatro);
		}
	
		this.createQuiero = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.Quiero);
		}
		
		this.createNoQuiero = function () {
			return new Server.Action(Server.ActionType.Message, Server.Messages.NoQuiero);
		}
		
		this.createPostScore = function (score) {
			return new Server.Action(Server.ActionType.PostScore, score);
		}
		
		this.createPlayCard = function (card) {
			return new Server.Action(Server.ActionType.Card, card);
		}
		
		this.createGoingToDeck = function (cards) {
			return new Server.Action(Server.ActionType.GoingToDeck,cards);
		}
		
		
		// ... agregar los metodos de las acciones restantes
	}
	
	this.GameDataSet = function (moves) {
		this.getOpponentMoves = function () {

		}
		this.getOwnMoves = function () {
			
		}
		this.getOpponentCardsPlayed = function () {

		}
		this.getOwnCardsPlayed = function () {

		}
		this.getLastMovePlayer = function () {
			
		}
	}
	
	/**
	 * Se define el peso de las cartas	
	 */
	var CardsWeight = {
		Cup: {
			1: 7,
			2: 6,
			3: 5,
			4: 14,
			5: 13,
			6: 12,
			7: 11,
			10: 10,
			11: 9,
			12: 8
		},
		Coin:  {
			1: 7,
			2: 6,
			3: 5,
			4: 14,
			5: 13,
			6: 12,
			7: 4,
			10: 10,
			11: 9,
			12: 8
		},
		Club:  {
			1: 2,
			2: 6,
			3: 5,
			4: 14,
			5: 13,
			6: 12,
			7: 11,
			10: 10,
			11: 9,
			12: 8
		},
		Sword:  {
			1: 1,
			2: 6,
			3: 5,
			4: 14,
			5: 13,
			6: 12,
			7: 3,
			10: 10,
			11: 9,
			12: 8
		}
	};
	
	/**
	 * Se definen las enumeraciones de los posibles resultados de comparar el peso de dos cartas
	 */
	var CompareWeightType = this.CompareWeightType = {
		Lower: -1,
		Equal: 0,
		Higher: 1
	};
	
	/**
	 * Operaciones sobre cartas individuales
	 */
	var CardProcessor = this.CardProcessor = function () {

		/**
		 * Retorna el peso de la carta
		 */
		var getCardWeight = function (card) {
			return CardsWeight[card.suit] && CardsWeight[card.suit][card.value];
		}
		
		this.getCardWeight = getCardWeight;
		
		/**
		 * Retorna si la primer carta es mayor, menor o igual que la segunda
		 */
		this.compareWeight = function (firstCard, secondCard) {
			var firstWeight = getCardWeight(firstCard);
			var secondWeight = getCardWeight(secondCard);
			return firstWeight < secondWeight ? CompareWeightType.Higher : firstWeight > secondWeight ? CompareWeightType.Lower : CompareWeightType.Equal;
		}
	};
	
	/**
	 * Operaciones sobre un set de cartas (3)
	 */
	var CardSet = this.CardSet = function (cards) {
		
		/*
		 * cards: array de cartas sobrantes
		 * _envidoCards: total de cartas propias (3). Esto por si se necesita calcular el envido cuando ya se jugó una carta
		 */
		
		var _utils = new Utils();
		var _processor = new CardProcessor();
		var _card1 = cards[0];
		var _card2 = cards[1];
		var _card3 = cards[2];
		var _envidoCards = _utils.copyArray(cards);
		
		/**
		 * Retorna el valor del envido de una carta
		 */
		var getEnvidoValue = function (card) {
			return card.value <= 7 ? card.value : 0;
		};

		/**
		 * Retorna el envido de dos cartas
		 */
		var calculatePartialEnvido = function (firstCard, secondCard) {
			var envido;
			if(firstCard.suit == secondCard.suit) {
				envido = 20 + getEnvidoValue(firstCard) + getEnvidoValue(secondCard);
			}
			else {
				envido = Math.max(getEnvidoValue(firstCard), getEnvidoValue(secondCard));
			}
			return envido;
		};
		this.calculatePartialEnvido = calculatePartialEnvido;
		
		/**
		 * Retorna el envido mas alto posible evaluando todas las cartas de la mano
		 */
		this.calculateEnvido = function() {
			var envido = 0;
			var i, j;
			for(i = 0; i < _envidoCards.length; i++) {
				for(j = i+1; j < _envidoCards.length; j++) {
					envido = Math.max(envido, calculatePartialEnvido(_envidoCards[i], _envidoCards[j]));
				}
			}
			return envido;
		};
		
		/**
		 * Retorna las cartas ordenadas por peso en orden ascendente
		 */
		this.getWinnerCards = function () {
			var orderedCards = [].concat(cards);
			orderedCards.sort(function(firstCard, secondCard) {
				return _processor.getCardWeight(firstCard) - _processor.getCardWeight(secondCard);
			});
			return orderedCards;
		};
		
		this.getLowestCardKiller = function (card) {
			var orderedCards = this.getWinnerCards();
			var nextCard;
			while(nextCard = orderedCards.pop()) {
				if(_processor.compareWeight(nextCard, card) == CompareWeightType.Higher) {
					break;
				}
			};
			return nextCard || null;
		};
		
		
		/**
		 * Devuelve la carta "uno" del set de cartas
		 * Aunque se remuevan cartas, la carta sigue siendo la misma. No cambian los indices 
		 */
		this.getCard1 = function () {
			return _card1;
		};
		
		/**
		 * Devuelve la carta "dos" del set de cartas
		 * Aunque se remuevan cartas, la carta sigue siendo la misma. No cambian los indices 
		 */
		this.getCard2 = function () {
			return _card2;
		};
		
		/**
		 * Devuelve la carta "tres" del set de cartas
		 * Aunque se remuevan cartas, la carta sigue siendo la misma. No cambian los indices 
		 */
		this.getCard3 = function () {
			return _card3;
		};
		
		/**
		 * Devuelve la carta siguiente. Se actualiza a medida que se van removiendo cartas del set
		 * Ver pullCard
		 */
		this.getNextCard = function () {
			return cards.shift();
		}
		
		/**
		 * Devuelve la cantidad de cartas que quedan en el set
		 */
		this.getCount = function() {
			return cards.length;
		};
		
		/**
		 * Remueve la carta del set de cartas
		 * @param {Number} id Id de la carta. Puede valer 1, 2 o 3
		 */
		this.pullCard = function(card) {
			for(var i=0; i < cards.length; i++) {
				if(cards[i]==card) {
					cards.splice(i, 1);
					break;
				}
			};
		};

		this.getCards = function(){
			return cards;
		}
	}
	
	/**
	 * Clase base de la cual se tiene que heredar para armar un jugador
	 */
	this.AbstractPlayer = function () {
		
		var _this = this;
		var _cardSet = [];
		var _utils = new Utils();
		var _event = new _utils.EventManager();
		var _name = "Default" + _utils.random(100000000, 999999999);
		var _globalData = null;
		var _score = {own: 0, opponent: 0};
		var _hasHand = false;
		
		_event.add("handInit", function (event) {
			_cardSet = new CardSet(event.cards);
			_hasHand = event.hasHand;
		});
		
		_event.add("updateGlobalData", function (event) {
			_globalData = event.globalData;
		});
		
		_event.add("opponentScoreChange", function (event) {
			_score.opponent = event.score;
		});
		
		_event.add("ownScoreChange", function (event) {
			_score.own = event.score;
		});
		
		this._serverPostAction = null;
		
		this.fireEvent = _event.fire;
		this.addEventListener = _event.add;
		
		this.getLastActions = function () {
			return _utils.copyArray(_globalData.actionStack);
		}
		
		this.getOpponentScore = function () {
			return _score.opponent;
		}
		
		this.getOwnScore = function () {
			return _score.own;
		}
		
		this.postAction = function (action) {
			this._serverPostAction(action);
		}
		
		this.setName = function (name) {
			_name = name;
		}
		
		this.getName = function (name) {
			return _name;
		}
		
		this.hasHand = function () {
			return _hasHand;
		}
		
		this.getCardSet = function () {
			return _cardSet;
		}

		//-----------------------------
		// GAME DATA SET METHODS
		//-----------------------------
		
		this.getOpponentMessages = function () {
			return getActions(false,"message");
		}

		this.getOwnMessages = function () {
			return getActions(true,"message");
		}

		this.getOpponentActions = function () {
			return getActions(false);
		}
		this.getOwnActions = function () {
			return getActions(true);
		}
		this.getOpponentCardsPlayed = function () {
			return getActions(false, "card");
		}

		this.getOwnCardsPlayed = function () {
			return getActions(true, "card");
		}

		this.getLastActionPlayer = function () {
			var actions = this.getLastActions();
			return actions.length ? actions[actions.length-1].playerName : null;
		}
				
		var getActions = function(mine,actionProp){
			var action;
			var temp 	= [];
			var actions = _this.getLastActions();
			for(var prop in actions){
				if(actions.hasOwnProperty(prop)){
					action = actions[prop].action;					
					if(canRegister(mine, actions[prop].playerName)){
						if(!actionProp)temp.push( action  );
						else if(action[actionProp])temp.push( action[actionProp] );
					}
				}
			}
			
			return temp;
		}
		
		var canRegister = function(mine,playerName){
			return (mine  && playerName == _name) ||
			       (!mine && playerName != _name);
		}
		
	}
}