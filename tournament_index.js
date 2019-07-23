var playerBuilders = [
	function(){ return new apiPlayer("Api Player", "8001", false)},
	function(){ return new apiPlayer("Api Player II", "8002", false)},
	//function(){ return new apiPlayer("Api Player III", "8003", true)},
	//function(){ return new apiPlayer("Api Player IV", "8004", true)},
	//function(){ return new apiPlayer("Api Player V", "8005", true)},
	//function(){ return new HumanPlayer("Human 1")},
	//function(){ return new HumanPlayer("Human 2")},
	// function(){ return new RandomPlayer("Randomio")},
	// function(){ return new RandomPlayer("Randomio II")},
	// function(){ return new RandomPlayer("Randomio III")},
]

t = new Tournament(playerBuilders, null, 200);