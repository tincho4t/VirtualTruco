# Virtual Truco

Para levantar el juego hay que abrir `index.html`, si se quiere modificar los jugadores que intervienen hay que configurarlo en el archivo `tournament_index.js` en la variable

```
var playerBuilders = [
	function(){ return new apiPlayer("Api Player", "8001", false)},
	function(){ return new RandomPlayer("Randomio")},
}
```

Existen distintos tipos de jugadores:

1. Jugador por api: `new apiPlayer("Api Player", "8001", false)` donde el primer parámetro es el nombre, el segundo es el puerto para conectarse con la api y el tercero enciende el debug para mostrar las cartas que recibió.
1. Jugador Randomio: `new RandomPlayer("Randomio")` donde el primer parámetro es el nombre.
1. Jugador Humano: `new HumanPlayer("Human 1")` donde el primer parámetro es el nombre.

Por razones de performance por default no se muestra por pantalla lo que está sucediendo, para poder verlo es necesario comentar la última linea del file `server.js` donde dice `Log = LogOff`
