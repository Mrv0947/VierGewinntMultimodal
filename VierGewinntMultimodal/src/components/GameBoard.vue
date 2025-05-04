<script setup lang="ts">
import { onMounted, ref } from "vue";

const movesCounter = ref<number>(0);
const rows = ref<number>(7);
const columns = ref<number>(6);
const board = ref<(null | 'red' | 'yellow')[][]>(
  Array.from({ length: columns.value }, () => Array(rows.value).fill(null))
);

const currentPlayer = ref('Player 1');
const columnHeights = ref<number[]>(Array(7).fill(0));

const makeMove = (col: number) => {
  if (columnHeights.value[col] > rows.value) return; // is the column 'full'

  const row = rows.value - columnHeights.value[col] - 1; // count the row, to put the pawn into

  board.value[col][row] = currentPlayer.value === 'Player 1' ? 'yellow' : 'red'; // add a pawn
  columnHeights.value[col] += 1;

  checkVerticalWin(col, row);
  checkHorizontalWin(col, row);
  checkDiagonalWinDownRight(col, row);
  checkDiagonalWinUpRight(col, row);

  currentPlayer.value = currentPlayer.value === 'Player 1' ? 'Player 2' : 'Player 1';
  movesCounter.value++;
};

const checkVerticalWin = (col: number, row: number) => {
  const result: (string | null)[] = [];

  const start = Math.max(row - 3, 0); // max 3 elements on the left
  const end = Math.min(row + 3, board.value[col].length - 1); // max 3 elements on the right, no more than the last index in the row

    for (let j = start; j <= end; j++) {
    result.push(board.value[col][j]);
  }

  if(hasFourElements(result)) {
    alert(`${currentPlayer.value} wins - 4 pawns vertically `);
  }
}

const checkHorizontalWin = (col: number, row: number) => {
  const result: (string | null)[] = [];

  const start = Math.max(col - 3, 0); // max 3 columns on the left
  const end = Math.min(col + 3, board.value.length - 1); // max 3 columns on the right, no more than the last one

  for (let i = start; i <= end; i++) {
    result.push(board.value[i][row]);
  }

  if(hasFourElements(result)) {
    alert(`${currentPlayer.value} wins - 4 pawns horizontally `);
  }
}

const checkDiagonalWinDownRight = (col: number, row: number) => {
  const result: (string | null)[] = [];

  const backSteps = Math.min(3, col, row);
  const forwardSteps = Math.min(3, board.value.length - 1 - col, board.value[0].length - 1 - row);

  const start = -backSteps;
  const end = forwardSteps;

  for (let offset = start; offset <= end; offset++) {
    result.push(board.value[col + offset][row + offset]);
  }

  if(hasFourElements(result)) {
    alert(`${currentPlayer.value} wins - 4 pawns diagonally \u2198`);
  }
}


const checkDiagonalWinUpRight = (col: number, row: number) => {
  const result: (string | null)[] = [];

  const backSteps = Math.min(3, col, board.value[0].length - 1 - row);
  const forwardSteps = Math.min(3, board.value.length - 1 - col, row);

  const start = -backSteps;
  const end = forwardSteps;

  for (let offset = start; offset <= end; offset++) {
    result.push(board.value[col + offset][row - offset]);
  }

  if(hasFourElements(result)) {
    alert(`${currentPlayer.value} wins - 4 pawns diagonally \u2197`);
  }
}


const hasFourElements = (array: (string | null)[]) => {
  for (let i = 0; i <= array.length - 4; i++) {
    const slice = array.slice(i, i + 4);
    if (slice.every(color => color === 'yellow') || slice.every(color => color === 'red')) {
      return true;
    }
  }

  return false;
}



</script>

<template>
  <h2 class="text-xl text-center font-semibold mb-8">
    Current Player: {{ currentPlayer }}
  </h2>
  <div class="flex justify-center space-x-1">
    <div
      v-for="(col, colIndex) in board"
      :key="colIndex"
      class="flex flex-col items-center mx-2"
    >
      <button
        @click="makeMove(colIndex)"
        class="w-10 h-10 bg-blue-500 text-white rounded hover:bg-blue-600 mb-5"
      >
        ↓
      </button>
      <div
        v-for="(cell, rowIndex) in col"
        :key="rowIndex"
        class="cell"
        :class="cell"
      ></div>
    </div>
  </div>
</template>

<style>
  .cell {
    width: 50px;
    height: 50px;
    border: 1px solid #333;
    background-color: #eee;
    border-radius: 50%;
    margin: 4px;
  }
  .cell.red {
    background-color: red;
  }
  .cell.yellow {
    background-color: yellow;
  }
</style>
