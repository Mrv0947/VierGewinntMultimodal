<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Howl, Howler } from 'howler';

const movesCounter = ref<number>(1);
const rows = ref<number>(7);
const columns = ref<number>(6);
const board = ref<(null | 'red' | 'yellow')[][]>(Array.from({ length: columns.value }, () => Array(rows.value).fill(null)));
const currentPlayer = ref('Player Yellow');
const winnerMessage = ref<string | null>(null);

const apiUrl = 'http://localhost:3000'; // server address
const socket = io(apiUrl);  // client socket

const drop_sound_player_yellow = new Howl({
  src: ['/sounds/stone-sliding-1.mp3'],  // ścieżka od root URL
  volume: 0.8
});

const drop_sound_player_red = new Howl({
  src: ['/sounds/stone-sliding-2.mp3'],
  volume: 0.8
});

const victory_sound = new Howl({
  src: ['/sounds/victory.wav'],
  volume: 0.8
});

const defeat_sound = new Howl({
  src: ['/sounds/defeat.wav'],
  volume: 0.8
});

const new_game = new Howl({
  src: ['/sounds/new_game.wav'],
  volume: 0.8
});


// make a move using GUI
const makeMove = async (col: number) => {
  new_game.stop();
  try {
    if (winnerMessage.value === null) {
      await axios.post(`${apiUrl}/move`, { column: col });
    }
  } catch (error) {
    console.error('Error making move:', error);
  }

  if (currentPlayer.value === "Player Yellow") {
    drop_sound_player_yellow.play()
  }
  else {
    drop_sound_player_red.play()
  }

  loadBoardState();
};


// reset game using GUI
const resetBoard = async () => {
  victory_sound.stop();
  defeat_sound.stop();

  new_game.play();

  try {
    const response = await axios.post(`${apiUrl}/new`);
    winnerMessage.value = null;
    movesCounter.value = 1;
    currentPlayer.value = 'Player Yellow';
  } catch (error) {
    console.error('Error resetting board:', error);
  }

  loadBoardState();
};


// Ask the server for current board/game state
const loadBoardState = async () => {
  try {
    const response = await axios.get(`${apiUrl}/status`);
    const status = response.data;
    board.value = status.board;
    currentPlayer.value = `${status.currentPlayer.charAt(0).toUpperCase() + status.currentPlayer.slice(1)}`;
    winnerMessage.value = status.winnerMessage;

    if (winnerMessage.value !== null && winnerMessage.value !== "It's a draw!")
      victory_sound.play();
    else if (winnerMessage.value === "It's a draw!")
      defeat_sound.play();
  } catch (error) {
    console.error('Error loading board state:', error);
  }
};


onMounted(() => {
  loadBoardState();
  socket.on("gameUpdated", () => {
    loadBoardState();
  });
});


onUnmounted(() => {
  socket.off("gameUpdated", () => {
    loadBoardState();
  });
});
</script>

<template>
  <h2 v-if="!winnerMessage" class="text-xl text-center font-semibold mb-1">
    Current Player: {{ currentPlayer }}
  </h2>
  <h2 v-else class="text-xl text-center font-semibold mb-1 text-green-600">
    {{ winnerMessage }}
  </h2>
  <h5 class="text-xs text-center font-semibold mb-8">
    Round {{ movesCounter }}
  </h5>
  <div class="flex justify-center space-x-1">
    <div
      v-for="(col, colIndex) in board"
      :key="colIndex"
      class="flex flex-col items-center mx-2"
    >
      <button
        @click="makeMove(colIndex)"
        :disabled="winnerMessage !== null"
        :class="[
          'w-10 h-10 text-white rounded mb-5 transition',
          winnerMessage === null
            ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
            : 'bg-gray-400 cursor-not-allowed'
        ]"
      >
        ↓
      </button>

      <div
        v-for="(cell, rowIndex) in col"
        :key="rowIndex"
        :class="[
          'w-[50px] h-[50px] rounded-full border border-gray-800 m-1',
          cell === 'red' ? 'bg-red-500' : cell === 'yellow' ? 'bg-yellow-400' :'bg-gray-200'
        ]"
      ></div>
    </div>
  </div>
  <div class="flex justify-center mt-6">
    <button
      @click="resetBoard"
      class="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
    >
      Reset
    </button>
  </div>
</template>
