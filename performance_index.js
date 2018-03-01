var playerBuilders = [
	// function(){ return new apiPlayer("Api Player", "8123", false)},
	//function(){ return new HumanPlayer("Human 1")},
	//function(){ return new apiPlayer("Api Player", "8123", false)},
	//function(){ return new apiPlayer("Api Player II", "8124", true)},
	// function(){ return new HumanPlayer("Human 1")},
	// function(){ return new apiPlayer("Api Player", "8125", false)},
	function(){ return new RandomPlayer("Randomio 1")},
	function(){ return new RandomPlayer("Randomio 2")},
]


t = new Tournament(playerBuilders, 5);