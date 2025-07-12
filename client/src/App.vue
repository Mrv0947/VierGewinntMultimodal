<script setup lang="ts">
import GameBoard from "@/components/GameBoard.vue";
</script>

<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col items-center justify-start">
    <header class="w-full">
      <div class="mx-auto w-full max-w-2xl pt-4 pb-2">
        <h1 class="text-3xl font-bold text-center text-white tracking-wide">Vier Gewinnt</h1>
      </div>
    </header>
    <main class="w-full flex flex-col items-center justify-center flex-1">
      <GameBoard />
    </main>
  </div>
</template>

<style scoped>
/* Keine weiteren Styles nötig, alles über Tailwind */
</style>
