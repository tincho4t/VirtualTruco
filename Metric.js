

function Metric(maxSize) {
	this.queue = new Array();
	this.maxSize = maxSize;
}

/**
 * Agrega una nueva métrica y borra la ultima
 * para solo quedarte con las esperadas.
 **/
Metric.prototype.addNewMetric = function(value){
	this.queue.unshift(value); // Lo agrego al comienzo
	if(this.queue.length > this.maxSize){
		this.queue.pop(); // Saco el ultimo que es el mas viejo		
	}
}

/**
 * Incrementa la metrica actual con el valor dado.
 **/
Metric.prototype.increaseCurrentMetric = function(incrementValue) {
	this.queue[0] += incrementValue;
}

Metric.prototype.getAverage = function(){
	var sum = this.queue.reduce(function(a,b){return a+b;});
	return sum / this.queue.length;
}


/**
 * Esta implementacion inicializa el array con el maximo
 * y siempre divide por el maximo asi q la respuesta no va
 * a ser correcta hasta q no se llegue al maximo.
 **/
// function Metric(maxSize) {

// 	this.queue = new Array(maxSize).fill(0);
// 	this.maxSize = maxSize;
// }

// /**
//  * Agrega una nueva métrica y borra la ultima
//  * para solo quedarte con las esperadas.
//  **/
// Metric.prototype.addNewMetric = function(value){
// 	this.queue.unshift(value); // Lo agrego al comienzo
// 	this.queue.pop(); // Saco el ultimo que es el mas viejo
// }

// /**
//  * Incrementa la metrica actual con el valor dado.
//  **/
// Metric.prototype.increaseCurrentMetric = function(incrementValue) {
// 	this.queue[0] += incrementValue;
// }

// Metric.prototype.getAverage = function(){
// 	var sum = this.queue.reduce(function(a,b){return a+b;});
// 	return sum / this.maxSize;
// }
