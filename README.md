# Einfaches Vier-Gewinnt-Spiel

### Verwendete Technologien:
Vue.js
TypeScript

axios
socket.io-client

### Client setup

```sh
cd client
npm install
```

### Client run

```sh
npm run dev
```



### Server setup

```sh
cd server
```

### Server run

```sh
node server.js
```

or


```sh
npm run start
```



### Playing game (inserting into a column) using endpoints example (column 5) - http://localhost:3000/move + json body containing column number
```sh
curl -X POST http://localhost:3000/move -H "Content-Type: application/json" -d '{"column": 5}'
```

### Endpoint for starting a new game - http://localhost:3000/new
```sh
curl -X POST http://localhost:3000/new
```

### Endpoint for getting game status (board, currentPlayer, winnerMessage) - http://localhost:3000/status
```sh
curl -X POST http://localhost:3000/status
```


### Game includes following sounds:
https://freesound.org/people/qubodup/sounds/743262/ (move player 1)
https://freesound.org/people/qubodup/sounds/743260/ (move player 2)

Victory sting 3 by Victor_Natas -- https://freesound.org/s/741975/ -- License: Attribution 4.0 (game won)
Victory sting 4 by Victor_Natas -- https://freesound.org/s/741976/ -- License: Attribution 4.0 (draw = game lost)

Kill ping by ValhallaProject -- https://freesound.org/s/761512/ -- License: Attribution 4.0 (new game)

