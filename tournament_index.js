


// Defino los jugadores globales para mantener el historico en los distintso partidos
//p1 = new apiPlayer("Api Player", "8123", false);
//p1 = new HumanPlayer("Human 1")
//p1 = new RandomPlayer("Randomio");
//p2 = new RandomPlayer("Randomio II");
// p2 = new QPlayer("Q-learning2");
//p2 = new HumanPlayer("Human")
// new Tournament(...);


var playerBuilders = [
	// function(){ return new apiPlayer("Api Player", "8123", false)},
	function(){ return new HumanPlayer("Human 1")},
	function(){ return new apiPlayer("Api Player", "8123", false)},
	//function(){ return new apiPlayer("Api Player II", "8124", true)},
	// function(){ return new HumanPlayer("Human 1")},
	// function(){ return new apiPlayer("Api Player", "8125", false)},
	//function(){ return new RandomPlayer("Randomio 2")},
]


t = new Tournament(playerBuilders);

// stopLearn = function(port = 8000){
// 	jQuery.ajax({
//             url: "http://localhost:" + port + "/",
//             type: "DELETE",
//             crossDomain: true,
//             contentType: "application/json; charset=utf-8",
//     		dataType: "json",
//             success: function (data) {}
//         });
// };

// saveTo = function(port = 8000, filename='./apiPlayer-checkpoint'){
// 	jQuery.ajax({
//             url: "http://localhost:" + port + "/",
//             type: "PUT",
//             crossDomain: true,
//             contentType: "application/json; charset=utf-8",
//     		dataType: "json",
//             success: function (data) {},
//             data: JSON.stringify({"file":filename})
//         });
// };