<template>
  <div class="crossword-grid" :style="gridStyle">
    <CrosswordCell
      v-for="cell in cells"
      :key="`${cell.x},${cell.y}`"
      :x="cell.x"
      :y="cell.y"
      :is-black="cell.isBlack"
      :value="gameStore.cells[`${cell.x},${cell.y}`] ?? ''"
      :clue-number="cell.clueNumber"
      :is-active="isActive(cell.x, cell.y)"
      :is-highlighted="isHighlighted(cell.x, cell.y)"
      :sep-right="cellSeparators.get(`${cell.x},${cell.y}`)?.right"
      :sep-bottom="cellSeparators.get(`${cell.x},${cell.y}`)?.bottom"
      :sep-left="cellSeparators.get(`${cell.x},${cell.y}`)?.left"
      :sep-top="cellSeparators.get(`${cell.x},${cell.y}`)?.top"
      @click="handleCellClick(cell.x, cell.y)"
      @input="handleInput(cell.x, cell.y, $event)"
      @keydown="handleKeydown(cell.x, cell.y, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CrosswordData } from "@/types";
import { useGameStore } from "@/stores/game";
import CrosswordCell from "./CrosswordCell.vue";

const props = defineProps<{ crossword: CrosswordData }>();
const gameStore = useGameStore();

type SepType = "dash" | "comma";

interface GridCell {
  x: number;
  y: number;
  isBlack: boolean;
  clueNumber?: number;
}

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.crossword.dimensions.cols}, var(--cell-size))`,
  gridTemplateRows: `repeat(${props.crossword.dimensions.rows}, var(--cell-size))`,
}));

const whiteCells = computed(() => {
  const set = new Set<string>();
  props.crossword.entries.forEach((e) => {
    for (let i = 0; i < e.length; i++) {
      const x = e.direction === "across" ? e.position.x + i : e.position.x;
      const y = e.direction === "down" ? e.position.y + i : e.position.y;
      set.add(`${x},${y}`);
    }
  });
  return set;
});

const cellNumbers = computed(() => {
  const map = new Map<string, number>();
  props.crossword.entries.forEach((e) => {
    const key = `${e.position.x},${e.position.y}`;
    if (!map.has(key)) map.set(key, e.number);
  });
  return map;
});

const cellSeparators = computed(() => {
  const map = new Map<string, { right?: SepType; bottom?: SepType; left?: SepType; top?: SepType }>();

  function mark(key: string, patch: { right?: SepType; bottom?: SepType; left?: SepType; top?: SepType }) {
    map.set(key, { ...map.get(key), ...patch });
  }

  for (const entry of props.crossword.entries) {
    const locs = entry.separatorLocations;
    if (!locs) continue;

    for (const [sep, positions] of Object.entries(locs)) {
      const sepType: SepType = sep === "-" ? "dash" : "comma";

      for (const pos of positions as number[]) {
        if (entry.direction === "across") {
          const x = entry.position.x + pos - 1;
          const y = entry.position.y;
          mark(`${x},${y}`, { right: sepType });
          if (sepType === "comma") mark(`${x + 1},${y}`, { left: sepType });
        } else {
          const x = entry.position.x;
          const y = entry.position.y + pos - 1;
          mark(`${x},${y}`, { bottom: sepType });
          if (sepType === "comma") mark(`${x},${y + 1}`, { top: sepType });
        }
      }
    }
  }

  return map;
});

const cells = computed((): GridCell[] => {
  const result: GridCell[] = [];
  const { rows, cols } = props.crossword.dimensions;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      result.push({
        x,
        y,
        isBlack: !whiteCells.value.has(key),
        clueNumber: cellNumbers.value.get(key),
      });
    }
  }
  return result;
});

function isActive(x: number, y: number): boolean {
  return gameStore.activeCell?.x === x && gameStore.activeCell?.y === y;
}

function isHighlighted(x: number, y: number): boolean {
  const clue = gameStore.activeClue;
  if (!clue) return false;
  if (clue.direction === "across") {
    return (
      clue.position.y === y &&
      x >= clue.position.x &&
      x < clue.position.x + clue.length
    );
  }
  return (
    clue.position.x === x &&
    y >= clue.position.y &&
    y < clue.position.y + clue.length
  );
}

function handleCellClick(x: number, y: number) {
  if (whiteCells.value.has(`${x},${y}`)) {
    gameStore.setActiveCell(x, y);
  }
}

function handleInput(x: number, y: number, value: string) {
  gameStore.setCell(x, y, value);
  if (value) advanceCursor(x, y);
}

function handleKeydown(x: number, y: number, e: KeyboardEvent) {
  if (e.key === "Backspace") {
    const key = `${x},${y}`;
    if (!gameStore.cells[key]) {
      retreatCursor(x, y);
    } else {
      gameStore.setCell(x, y, "");
    }
  } else if (e.key === "ArrowRight") {
    gameStore.activeDirection = "across";
    advanceCursor(x, y);
  } else if (e.key === "ArrowLeft") {
    gameStore.activeDirection = "across";
    retreatCursor(x, y);
  } else if (e.key === "ArrowDown") {
    gameStore.activeDirection = "down";
    advanceCursor(x, y);
  } else if (e.key === "ArrowUp") {
    gameStore.activeDirection = "down";
    retreatCursor(x, y);
  } else if (e.key === "Tab") {
    e.preventDefault();
    gameStore.toggleDirection();
  }
}

function advanceCursor(x: number, y: number) {
  const dir = gameStore.activeDirection;
  const next = dir === "across" ? { x: x + 1, y } : { x, y: y + 1 };
  if (whiteCells.value.has(`${next.x},${next.y}`)) {
    gameStore.activeCell = next;
  }
}

function retreatCursor(x: number, y: number) {
  const dir = gameStore.activeDirection;
  const prev = dir === "across" ? { x: x - 1, y } : { x, y: y - 1 };
  if (whiteCells.value.has(`${prev.x},${prev.y}`)) {
    gameStore.activeCell = prev;
  }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.crossword-grid {
  --cell-size: #{$cell-size};
  display: grid;
  border: $cell-border solid $color-cell-text;
  width: fit-content;
  user-select: none;
}
</style>
