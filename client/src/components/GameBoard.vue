<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Howl, Howler } from 'howler';
import { DollarRecognizer, Point } from '../utils/dollar.js';

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


// Dollar One Recognizer Instanz
const recognizer = new (DollarRecognizer as any)();


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


// Zeichenlogik für das Canvas
const gestureCanvas = ref<HTMLCanvasElement | null>(null);
let drawing = false;
let ctx: CanvasRenderingContext2D | null = null;

// Für Gestenerkennung
let gesturePoints: { x: number; y: number }[] = [];

const getPos = (e: MouseEvent | TouchEvent) => {
  let rect = gestureCanvas.value!.getBoundingClientRect();
  if (e instanceof MouseEvent) {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  } else {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
};

const startDrawing = (e: MouseEvent | TouchEvent) => {
  // Canvas leeren, bevor eine neue Geste gezeichnet wird
  if (ctx && gestureCanvas.value) {
    ctx.clearRect(0, 0, gestureCanvas.value.width, gestureCanvas.value.height);
  }
  drawing = true;
  gesturePoints = [];
  if (!ctx) return;
  const pos = getPos(e);
  gesturePoints.push(pos);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
};

const draw = (e: MouseEvent | TouchEvent) => {
  if (!drawing || !ctx) return;
  const pos = getPos(e);
  gesturePoints.push(pos);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
};

const stopDrawing = () => {
  drawing = false;
  if (ctx) ctx.closePath();

  if (gesturePoints.length > 10) {
    const points = gesturePoints.map(p => new (Point as any)(p.x, p.y));
    const result = recognizer.Recognize(points, false);
    console.log('Erkannte Geste:', result?.Name, 'Score:', result?.Score);
    if (result ) {
      if (result.Name === '0') { // Circle
        resetBoard();
      } else if (result.Name === '1') { // 1
        makeMove(0);
      } else if (result.Name === '2') { // 2
        makeMove(1);
      } else if (result.Name === '3') { // 3
        makeMove(2);
      } else if (result.Name === '4') { // 4
        makeMove(3);
      } else if (result.Name === '5') { // 5
        makeMove(4);
      } else if (result.Name === '6') { // 6
        makeMove(5);
      }
    }
  }
};



onMounted(() => {
  loadBoardState();
  socket.on("gameUpdated", () => {
    loadBoardState();
  });

  if (gestureCanvas.value) {
    ctx = gestureCanvas.value.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#222';
    }
    // Maus-Events
    gestureCanvas.value.addEventListener('mousedown', startDrawing);
    gestureCanvas.value.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    // Touch-Events
    gestureCanvas.value.addEventListener('touchstart', startDrawing);
    gestureCanvas.value.addEventListener('touchmove', draw);
    window.addEventListener('touchend', stopDrawing);
  }
});


onUnmounted(() => {
  socket.off("gameUpdated", () => {
    loadBoardState();
  });

  if (gestureCanvas.value) {
    gestureCanvas.value.removeEventListener('mousedown', startDrawing);
    gestureCanvas.value.removeEventListener('mousemove', draw);
    window.removeEventListener('mouseup', stopDrawing);
    gestureCanvas.value.removeEventListener('touchstart', startDrawing);
    gestureCanvas.value.removeEventListener('touchmove', draw);
    window.removeEventListener('touchend', stopDrawing);
  }
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
  <!-- Flex-Container für Spielfeld und Zeichenfläche -->
  <div class="flex justify-center items-start space-x-8">
    <!-- Spielbrett -->
    <div class="flex space-x-1">
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
    <!-- Zeichenfläche für Gestensteuerung -->
    <div>
      <canvas
        id="gesture-canvas"
        ref="gestureCanvas"
        width="400"
        height="400"
        style="border:1.5px solid #333; background: #fff; touch-action: none;"
      >
        Ihr Browser unterstützt kein Canvas.
      </canvas>
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

