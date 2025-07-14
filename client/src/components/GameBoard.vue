<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
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
const recognizedGesture = ref<string>(''); // Neue Variable für erkannte Geste

const fusionTable = ref<Record<string, any>>({
  column: null,
  confirmation: null,
  command: null
}); // FusionTable-Objekt

const keys = ['column', 'command', 'confirmation'];

const apiUrl = 'http://localhost:3000'; // server address
const socket = io(apiUrl);  // client socket

const drop_sound_player_yellow = new Howl({
  src: ['/sounds/stone-sliding-1.mp3'],
  volume: 0.5
});

const drop_sound_player_red = new Howl({
  src: ['/sounds/stone-sliding-2.mp3'],
  volume: 0.5
});

const victory_sound = new Howl({
  src: ['/sounds/victory.wav'],
  volume: 0.5
});

const defeat_sound = new Howl({
  src: ['/sounds/defeat.wav'],
  volume: 0.5
});

const new_game = new Howl({
  src: ['/sounds/new_game.wav'],
  volume: 0.5
});


// Dollar One Recognizer Instanz
const recognizer = new (DollarRecognizer as any)();


watch(winnerMessage, (newVal, oldVal) => {
  if (oldVal === null && newVal !== null && newVal !== "It's a draw!") {
    victory_sound.play();
  }
  else if (oldVal === null && newVal === "It's a draw!") {
    defeat_sound.play();
  }
  else if (newVal === null) {
    victory_sound.stop();
    defeat_sound.stop();
  }
});

// Ask the server for current board/game state
const loadBoardState = async () => {
  try {
    const response = await axios.get(`${apiUrl}/status`);
    const status = response.data;
    board.value = status.board;
    currentPlayer.value = `${status.currentPlayer.charAt(0).toUpperCase() + status.currentPlayer.slice(1)}`;
    winnerMessage.value = status.winnerMessage;
    console.log("[loadBoardState] winnerMessage = ", winnerMessage.value);
  } catch (error) {
    console.error('Error loading board state:', error);
  }
};


// FusionTable laden
const loadFusionTable = async () => {
  try {
    const response = await axios.get(`${apiUrl}/fusiontable`);
    fusionTable.value = response.data.fusionTable || {};
    if (fusionTable.value.column !== undefined) {
      fusionTable.value.column = fusionTable.value.column + 1;
    }
    console.log(fusionTable.value.column);
  } catch (error) {
    //console.error('Error loading fusion table:', error);
  }
};


// Zeichenlogik für das Canvas
const gestureCanvas = ref<HTMLCanvasElement | null>(null);
let drawing = false;
let newGesture = false;
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
  newGesture = true;
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
  if (!newGesture) return;
  newGesture = false;
  drawing = false;
  if (ctx) ctx.closePath();

  if (gesturePoints.length > 10) {
    const points = gesturePoints.map(p => new (Point as any)(p.x, p.y));
    let result = recognizer.Recognize(points, false);
    console.log('Erkannte Geste:', result?.Name, 'Score:', result?.Score);
    if (result ) {
      recognizedGesture.value = result.Name; // Geste speichern
      if (result.Name === 'Reset') { // Circle
        sendCommand('new');
      } else if (result.Name === 'Column 1') { // 1
        sendColumn(0);
      } else if (result.Name === 'Column 2') { // 2
        sendColumn(1);
      } else if (result.Name === 'Column 3') { // 3
        sendColumn(2);
      } else if (result.Name === 'Column 4') { // 4
        sendColumn(3);
      } else if (result.Name === 'Column 5') { // 5
        sendColumn(4);
      } else if (result.Name === 'Column 6') { // 6
        sendColumn(5);
      } else if (result.Name === 'Move') { // M-Geste
        sendCommand('move');
      } else if (result.Name === 'Confirm') { // Häkchen-Geste
        sendConfirm();
      }
    } else {
      recognizedGesture.value = ''; // Keine Geste erkannt
    }
  } else {
    recognizedGesture.value = ''; // Zu wenig Punkte
  }
};


// Neue Funktionen für die Buttons
const sendCommand = async (command: 'new' | 'move') => {
  try {
    const response = await axios.post(`${apiUrl}/command`, { command });
    console.log(`/command response:`, response.data);
  } catch (error) {
    console.error(`Error sending command '${command}':`, error);
  }
};

const sendConfirm = async () => {
  try {
    const response = await axios.post(`${apiUrl}/confirm`, {});

    // sounds
    if(fusionTable.value.command === 'new')
      new_game.play();
    else if (fusionTable.value.command === 'move' && currentPlayer.value === "Player Yellow") {
      console.log("currentPlayer1");
      drop_sound_player_yellow.play()
    }
    else if (fusionTable.value.command === 'move' && currentPlayer.value === "Player Red") {
      console.log("currentPlayer2");
      drop_sound_player_red.play()
    }

    console.log(`/confirm response:`, response.data);
  } catch (error) {
    console.error('Error sending confirm:', error);
  }
};

const sendColumn = async (colIndex: number) => {
  try {
    const response = await axios.post(`${apiUrl}/column`, { column: colIndex });
    console.log(`/column response:`, response.data);
  } catch (error) {
    console.error(`Error sending column '${colIndex}':`, error);
  }
};


onMounted(() => {
  loadBoardState();
  loadFusionTable();

  socket.on("gameUpdated", () => {
    loadBoardState();
    loadFusionTable();
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
    loadFusionTable();
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
  <div class="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 py-2">
    <!-- Grid-Layout für Spielinfo, Spielfeld, Gestenfeld -->
    <div class="grid grid-cols-3 w-full items-center mt-4" style="max-width: 100vw;">
      <!-- Spielinfo (links, weiter nach außen) -->
      <div class="flex flex-col items-center justify-center h-full pl-20">
        <div class="bg-[#293e56] rounded-xl shadow-lg p-4 mb-2 w-[350px] h-[620px] flex flex-col justify-center mx-auto">
          <h3 class="text-lg font-semibold text-white mb-2 text-center">Game info</h3>
          <div class="mb-2 text-center">
            <span v-if="!winnerMessage" class="font-semibold text-gray-200 block mb-1">
              Current Player:
              <span :class="currentPlayer === 'Player Yellow' ? 'text-yellow-300 font-bold' : 'text-red-400 font-bold'">
                {{ currentPlayer }}
              </span>
            </span>
            <span v-else class="font-semibold text-green-400 block mb-1">
              {{ winnerMessage }}
            </span>
            <span class="text-xs text-gray-300 font-semibold tracking-wider block">
              Round {{ movesCounter }}
            </span>
          </div>
          <h4 class="text-base font-semibold text-white mb-2 mt-8 text-center">Fusion Table</h4>
          <table class="min-w-[180px] border border-gray-600 text-white text-sm bg-gray-700 rounded overflow-hidden shadow mx-auto">
            <tbody>
            <tr v-for="key in keys" :key="key">
              <td class="border bg-[#293e56] px-2 py-1 font-bold bg-gray-800">{{ key }}</td>
              <td class="border bg-[#293e56] px-2 py-1">
                {{ fusionTable[key] ?? '—' }}
              </td>
            </tr>
            </tbody>
          </table>
          <h3 class="text-lg font-semibold text-white mb-2 mt-8 text-center">Instructions</h3>
          <p class="text-white">Each full move consists of three steps:</p>
          <ol class="text-white list-decimal list-inside">
            <li>Select a column to drop your pawn into.</li>
            <li>Use "move" command.</li>
            <li>Use "confirm" command to finalize the move.</li>
          </ol>
          <p class="text-white mt-4">To reset game use "reset" and "confirm".</p>
          <p class="text-white mt-4">Possible modalities: mouse, gestures, voice.</p>
          <p class="text-white">Modalities can be mixed for different kinds of actions.</p>
        </div>
      </div>
      <!-- Spielfeld (zentriert, volle Breite) -->
      <div class="flex justify-center items-center w-full">
        <div class="flex space-x-1 bg-[#293e56] rounded-2xl shadow-xl p-6">
          <div
            v-for="(col, colIndex) in board"
            :key="colIndex"
            class="flex flex-col items-center mx-2"
          >
            <button
              @click="sendColumn(colIndex)"
              :disabled="winnerMessage !== null"
              :class="[
                'w-10 h-10 text-white rounded-full mb-5 transition shadow',
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
                'w-[50px] h-[50px] rounded-full border-2 border-gray-900 m-1 shadow-md transition-all duration-800',
                cell === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-red-700/40' : cell === 'yellow' ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-yellow-400/40' :'bg-gray-200'
              ]"
            ></div>
          </div>
        </div>
      </div>
      <!-- Gestenfeld (rechts, weiter nach außen) -->
      <div class="flex flex-col items-center justify-center h-full pr-20">
        <div class="bg-[#293e56] rounded-xl shadow-lg p-4 w-[360px] h-[620px] flex flex-col justify-center">
        <canvas
            id="gesture-canvas"
            ref="gestureCanvas"
            width="320"
            height="320"
            class="rounded-lg border-2 border-blue-400 shadow-lg bg-white mx-auto"
            style="touch-action: none;"
          >
            Ihr Browser unterstützt kein Canvas.
          </canvas>
          <div class="mt-3 text-center text-base text-white">
            <span v-if="recognizedGesture">Recognized gesture: <b class="text-blue-300">{{ recognizedGesture }}</b></span>
            <span v-else class="text-gray-300">Gesture not recognized.</span>
          </div>
          <div class="mt-8 text-base text-white">
            Available gestures:
            <ul class="list-disc pl-5">
              <li><strong class="font-bold">Number 1-6</strong>: choose a column</li>
              <li><strong class="font-bold">Letter "M"</strong>: "move" command.</li>
              <li><strong class="font-bold">Sign ✓</strong>: "confirm" command.</li>
              <li><strong class="font-bold">Letter "O" (circle)</strong>: reset the board</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <!-- Button-Leiste -->
    <div class="flex justify-center mt-4 space-x-4 gap-4">
      <button
        @click="sendCommand('new')"
        class="px-8 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg font-semibold shadow hover:from-red-600 hover:to-red-800"
      >
        Reset
      </button>
      <button
        @click="sendCommand('move')"
        :disabled="winnerMessage !== null"
        :class="[
          'px-8 py-2 rounded-lg font-semibold shadow',
          winnerMessage === null
            ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800'
            : 'bg-gray-400 text-white cursor-not-allowed'
        ]"
      >
        Move
      </button>
      <button
        @click="sendConfirm"
        class="px-8 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg font-semibold shadow hover:from-green-600 hover:to-green-800"
      >
        Confirm
      </button>
    </div>
  </div>
</template>
