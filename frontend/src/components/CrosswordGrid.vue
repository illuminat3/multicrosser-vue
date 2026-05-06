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

// Which directions are playable at each cell
const cellDirections = computed(() => {
  const map = new Map<string, Set<'across' | 'down'>>();
  props.crossword.entries.forEach((e) => {
    for (let i = 0; i < e.length; i++) {
      const x = e.direction === 'across' ? e.position.x + i : e.position.x;
      const y = e.direction === 'down' ? e.position.y + i : e.position.y;
      const key = `${x},${y}`;
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(e.direction);
    }
  });
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
  if (!whiteCells.value.has(`${x},${y}`)) return;

  const dirs = cellDirections.value.get(`${x},${y}`) ?? new Set<'across' | 'down'>();
  const alreadyActive = gameStore.activeCell?.x === x && gameStore.activeCell?.y === y;

  if (alreadyActive) {
    const other = gameStore.activeDirection === 'across' ? 'down' : 'across';
    if (dirs.has(other)) gameStore.activeDirection = other;
    return;
  }

  // Check against the OLD clue before moving active cell
  const prevClue = gameStore.activeClue;
  const keepDirection = (() => {
    if (!prevClue || !dirs.has(prevClue.direction)) return false;
    return prevClue.direction === 'across'
      ? prevClue.position.y === y && x >= prevClue.position.x && x < prevClue.position.x + prevClue.length
      : prevClue.position.x === x && y >= prevClue.position.y && y < prevClue.position.y + prevClue.length;
  })();

  gameStore.activeCell = { x, y };

  if (!keepDirection) {
    // Not in current clue — prefer across, fall back to down
    gameStore.activeDirection = dirs.has('across') ? 'across' : 'down';
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
    e.preventDefault();
    gameStore.activeDirection = "across";
    moveCursor(x, y, 1, 0);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    gameStore.activeDirection = "across";
    moveCursor(x, y, -1, 0);
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    gameStore.activeDirection = "down";
    moveCursor(x, y, 0, 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    gameStore.activeDirection = "down";
    moveCursor(x, y, 0, -1);
  } else if (e.key === "Tab") {
    e.preventDefault();
    gameStore.toggleDirection();
  }
}

function moveCursor(x: number, y: number, dx: number, dy: number) {
  const next = { x: x + dx, y: y + dy };
  if (whiteCells.value.has(`${next.x},${next.y}`)) {
    gameStore.activeCell = next;
  }
}

function advanceCursor(x: number, y: number) {
  const dir = gameStore.activeDirection;
  moveCursor(x, y, dir === "across" ? 1 : 0, dir === "across" ? 0 : 1);
}

function retreatCursor(x: number, y: number) {
  const dir = gameStore.activeDirection;
  moveCursor(x, y, dir === "across" ? -1 : 0, dir === "across" ? 0 : -1);
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
