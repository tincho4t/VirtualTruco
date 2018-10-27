


// Defino los jugadores globales para mantener el historico en los distintso partidos
//p1 = new apiPlayer("Api Player", "8123", false);
//p1 = new HumanPlayer("Human 1")
//p1 = new RandomPlayer("Randomio");
//p2 = new RandomPlayer("Randomio II");
// p2 = new QPlayer("Q-learning2");
//p2 = new HumanPlayer("Human")
// new Tournament(...);


var playerBuilders = [
	function(){ return new apiPlayer("Api Player", "8001", false)},
	function(){ return new apiPlayer("Api Player II", "8002", false)},
	//function(){ return new apiPlayer("Api Player III", "8003", true)},
	//function(){ return new apiPlayer("Api Player IV", "8004", true)},
	//function(){ return new apiPlayer("Api Player V", "8005", true)},
	//function(){ return new HumanPlayer("Human 1")},
	//function(){ return new HumanPlayer("Human 2")},
	//function(){ return new RandomPlayer("Randomio")},
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