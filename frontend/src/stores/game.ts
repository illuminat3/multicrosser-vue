import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CrosswordData, CrosswordEntry } from '@/types';
import { GameSocket } from '@/services/websocket';

export const useGameStore = defineStore('game', () => {
  const crossword = ref<CrosswordData | null>(null);
  const cells = ref<Record<string, string>>({});
  const activeCell = ref<{ x: number; y: number } | null>(null);
  const activeDirection = ref<'across' | 'down'>('across');
  const socket = ref<GameSocket | null>(null);

  const activeClue = computed((): CrosswordEntry | null => {
    if (!crossword.value || !activeCell.value) return null;
    const { x, y } = activeCell.value;
    return (
      crossword.value.entries.find((e) => {
        if (e.direction !== activeDirection.value) return false;
        if (activeDirection.value === 'across') {
          return e.position.y === y && x >= e.position.x && x < e.position.x + e.length;
        } else {
          return e.position.x === x && y >= e.position.y && y < e.position.y + e.length;
        }
      }) ?? null
    );
  });

  function initSocket(crosswordId: string, guid: string) {
    socket.value?.close();
    const s = new GameSocket(crosswordId, guid);
    socket.value = s;

    s.onMessage((msg) => {
      if (msg.type === 'state') {
        cells.value = { ...msg.state.cells };
      } else if (msg.type === 'cell_update') {
        const key = `${msg.x},${msg.y}`;
        if (msg.value === '') {
          delete cells.value[key];
        } else {
          cells.value[key] = msg.value;
        }
      }
    });
  }

  function setCell(x: number, y: number, value: string) {
    const key = `${x},${y}`;
    if (value === '') {
      delete cells.value[key];
    } else {
      cells.value[key] = value;
    }
    socket.value?.sendCellUpdate(x, y, value);
  }

  function setActiveCell(x: number, y: number) {
    if (activeCell.value?.x === x && activeCell.value?.y === y) {
      activeDirection.value = activeDirection.value === 'across' ? 'down' : 'across';
    } else {
      activeCell.value = { x, y };
    }
  }

  function toggleDirection() {
    activeDirection.value = activeDirection.value === 'across' ? 'down' : 'across';
  }

  function cleanup() {
    socket.value?.close();
    socket.value = null;
    crossword.value = null;
    cells.value = {};
    activeCell.value = null;
  }

  return {
    crossword,
    cells,
    activeCell,
    activeDirection,
    activeClue,
    initSocket,
    setCell,
    setActiveCell,
    toggleDirection,
    cleanup,
  };
});
