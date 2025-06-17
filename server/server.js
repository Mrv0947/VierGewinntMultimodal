const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 3000;


app.use(cors({
  origin: 'http://localhost:5173', // allow connections from that address (vue.js client address)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// HTTP server + socket
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173', // vue.js client address
    methods: ['GET', 'POST'],
  }
});

app.use(bodyParser.json());


// Get endpoint for obtaining board, currentPlayer, winnerMessage infos
app.get('/status', (req, res) => {
  console.log("Received /status request");

  const status = { board, currentPlayer, winnerMessage };
  res.json(status);
});

// Post endpoint for making a move
app.post('/move', (req, res) => {
  console.log("Received /move request");

  const { column } = req.body;
  if (typeof column !== 'number' || column < 0 || column >= 7) {
    return res.status(400).json({ error: 'Invalid column' });
  }
  const status = makeMove(column);
  io.emit('gameUpdated', { board, currentPlayer, winnerMessage });
  res.json(status);
});

// Post endpoint for reseting the game
app.post('/new', (req, res) => {
  console.log("Received /new request");

  resetBoard();
  res.json({ message: 'Game reset successful' });
});


// Server initialization
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  resetBoard();
});


// Game logic part
const rows = 7;
const columns = 6;

let board = Array.from({ length: columns }, () => Array(rows).fill(null));
let currentPlayer = 'yellow';
let winnerMessage = null;
let columnHeights = Array(columns).fill(0);

const makeMove = (col) => {
  console.log("[gameLogic]: makeMove");

  if (winnerMessage === null && columnHeights[col] < rows) {
    const row = rows - columnHeights[col] - 1;
    board[col][row] = currentPlayer === 'Player Yellow' ? 'yellow' : 'red'; // add a pawn
    columnHeights[col] += 1;

    checkVerticalWin(col, row);
    checkHorizontalWin(col, row);
    checkDiagonalWinDownRight(col, row);
    checkDiagonalWinUpRight(col, row);
    // checkFailure();

    currentPlayer = currentPlayer === 'Player Yellow' ? 'Player Red' : 'Player Yellow';

    return { board, currentPlayer, winnerMessage };
  }

  return { board, currentPlayer, winnerMessage };
};

const checkVerticalWin = (col, row) => {
  const result = [];
  const start = Math.max(row - 3, 0); // max 3 elements on the left
  const end = Math.min(row + 3, board[col].length - 1); // max 3 elements on the right, no more than the last index in the row

  for (let j = start; j <= end; j++) {
    result.push(board[col][j]);
  }

  if (hasFourElements(result)) {
    winnerMessage = `${currentPlayer} wins - 4 pawns vertically.`;
  }
};

const checkHorizontalWin = (col, row) => {
  const result = [];
  const start = Math.max(col - 3, 0); // max 3 columns on the left
  const end = Math.min(col + 3, board.length - 1); // max 3 columns on the right, no more than the last one
  const coordinates = [];

  for (let i = start; i <= end; i++) {
    result.push(board[i][row]);
    coordinates.push({ x: i, y: row });
  }

  if (hasFourElements(result)) {
    winnerMessage = `${currentPlayer} wins - 4 pawns horizontally.`;
  }
};


const checkDiagonalWinDownRight = (col, row) => {
  const result = [];

  const backSteps = Math.min(3, col, row);
  const forwardSteps = Math.min(3, board.length - 1 - col, board[0].length - 1 - row);

  const start = -backSteps;
  const end = forwardSteps;

  for (let offset = start; offset <= end; offset++) {
    result.push(board[col + offset][row + offset]);
  }

  if(hasFourElements(result)) {
    winnerMessage = `${currentPlayer} wins - 4 pawns diagonally \u2198`;
  }
}


const checkDiagonalWinUpRight = (col, row) => {
  const result = [];

  const backSteps = Math.min(3, col, board[0].length - 1 - row);
  const forwardSteps = Math.min(3, board.length - 1 - col, row);

  const start = -backSteps;
  const end = forwardSteps;

  for (let offset = start; offset <= end; offset++) {
    result.push(board[col + offset][row - offset]);
  }

  if(hasFourElements(result)) {
    winnerMessage = `${currentPlayer} wins - 4 pawns diagonally \u2197`;
  }
}


const hasFourElements = (array) => {
  for (let i = 0; i <= array.length - 4; i++) {
    const slice = array.slice(i, i + 4);

    if (slice.every(color => color === 'yellow') || slice.every(color => color === 'red')) {
      console.log(slice + " ");
      return true;
    }
  }

  return false;
}

const hasFourElementsCoordinates = (array) => {
  for (let element in array) {
    element = board[array.x][array.y];
  }

  for (let i = 0; i <= array.length - 4; i++) {
    const slice = array.slice(i, i + 4);
  }
}

const resetBoard = () => {
  console.log('Reset board');

  board = Array.from({ length: columns }, () => Array(rows).fill(null));
  columnHeights = Array(columns).fill(0);
  currentPlayer = 'yellow';
  winnerMessage = null;
};


io.on('connection', (socket) => {
  console.log('A user connected.');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
