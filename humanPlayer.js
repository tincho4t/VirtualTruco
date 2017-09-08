
/*
 * Human Player
 */
var HumanPlayer = function (name) {
	CommonAPI.AbstractPlayer.call(this);

	var _initialCardSet = [];
	var _cardSet = [];
	var _utils = new Utils();

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

	this.setName(name);

	var buildInitialCardSet = function(cardSet){
		cards = [];
		cards.push(cardSet.getCard1());
		cards.push(cardSet.getCard2());
		cards.push(cardSet.getCard3());
		return cards;
	}

	this.addEventListener("handInit", function (event) {
		_cardSet = this.getCardSet();
		_initialCardSet = buildInitialCardSet(_cardSet);
		Log.add({
					Juega: name,
					Message: 'Cardset: ' + _cardSet.logCardset()
				});
	});
	this.addEventListener("handEnd", function (event) {
		// event.cardShowing
	});

	var post = function(action, player){
		Log.add({
		    Juega: name,
		    Message: action.message? action.message.name: action.card
		});
		player.postAction(action);
	}

	var getActionFunction = function(nodeName, player){
		return function() {
			var action = getAction(nodeName);
			$(this).dialog("close");
			post(action, player);
		};
	}

	var buildButtons = function(options, player){
		var buttons = {};

		options.each(function (nodeName, node) {
			if( nodeName != CommonAPI.PLAY_CARD){
				buttons[nodeName] = getActionFunction(nodeName, player);	
			} else {
				_cardSet.getCards().forEach(function(card){
					var buttonName = card.suit + " " + card.value;
					var action = new Server.Action(Server.ActionType.Card, card);
					buttons[buttonName] = function(){
						_cardSet.pullCard(card);
						$(this).dialog("close");
						post(action, player);
					}
				});
			}
			
		});

		return buttons;
	}

	var showCurrentCats = function(){
		$('#my_cards').text("Tus cartas:");
		_initialCardSet.forEach(function(card){
			var card_name = card.suit + " " + card.value;
			if(_cardSet.getCards().indexOf(card) >= 0) {
				$('#my_cards').append(" <b>" + card_name + "</b>");	
			}
			else {
				$('#my_cards').append(" " + card_name);
			}
		});
	}

	this.addEventListener("play", function (event) {
		var player = this;

		$('#dialog').dialog({
		    buttons: buildButtons(event.options, player),
		    dialogClass: 'ui-dialog-osx',
		    position: { my: "left bottom", at: "bottom-10%", of: window },
		    modal: true,
		    draggable: true,
		    resizable: false,
		    // show: 'blind',
    		// hide: 'blind',		    
		});
		showCurrentCats();
	});
}
