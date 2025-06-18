# Einfaches Vier-Gewinnt-Spiel

### Verwendete Technologien:
Vue.js
TypeScript

axios
socket.io-client

### Client setup

```sh
cd VierGewinntMultimodal
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
