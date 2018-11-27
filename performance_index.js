var playerBuilders = [
	function(){ return new apiPlayer("Api Player 1", "8000", false, true)},
	function(){ return new apiPlayer("Api Player 2", "8001", false, true)},
]


t = new Tournament(playerBuilders, 550);