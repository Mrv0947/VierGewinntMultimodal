# Einfaches Vier-Gewinnt-Spiel

### Verwendete Technologien:
Vue.js
TypeScript


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



### Playing game (inserting into a column) using endpoints example (column 5)
```sh
curl -X POST http://localhost:3000/move -H "Content-Type: application/json" -d '{"column": 5}'
```
