<script setup lang="ts">
import GameBoard from "@/components/GameBoard.vue";
</script>

<template>
    <header>
      <div class="mx-auto mt-20 w-1/2">
        <h1 class="text-4xl font-bold text-center">Vier Gewinnt</h1>
      </div>
    </header>

    <main class="mt-20">
        <GameBoard>
        </GameBoard>
    </main>
</template>

<style scoped>

</style>
