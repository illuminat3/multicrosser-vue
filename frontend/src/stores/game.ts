import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { CrosswordData, CrosswordEntry } from "@/types";
import { GameSocket } from "@/services/websocket";

export const useGameStore = defineStore("game", () => {
  const crossword = ref<CrosswordData | null>(null);
  const cells = ref<Record<string, string>>({});
  const activeCell = ref<{ x: number; y: number } | null>(null);
  const activeDirection = ref<"across" | "down">("across");
  const socket = ref<GameSocket | null>(null);

  const activeClue = computed((): CrosswordEntry | null => {
    if (!crossword.value || !activeCell.value) return null;
    const { x, y } = activeCell.value;
    return (
      crossword.value.entries.find((e) => {
        if (e.direction !== activeDirection.value) return false;
        if (activeDirection.value === "across") {
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
      if (msg.type === "state") {
        cells.value = { ...msg.state.cells };
      } else if (msg.type === "cell_update") {
        const key = `${msg.x},${msg.y}`;
        if (msg.value === "") {
          delete cells.value[key];
        } else {
          cells.value[key] = msg.value;
        }
      }
    });
  }

  function setCell(x: number, y: number, value: string) {
    const key = `${x},${y}`;
    if (value === "") {
      delete cells.value[key];
    } else {
      cells.value[key] = value;
    }
    socket.value?.sendCellUpdate(x, y, value);
  }

  function buildSolutionMap(): Map<string, string> {
    const map = new Map<string, string>();
    if (!crossword.value) return map;
    for (const entry of crossword.value.entries) {
      if (!entry.solution) continue;
      for (let i = 0; i < entry.length; i++) {
        const x = entry.direction === "across" ? entry.position.x + i : entry.position.x;
        const y = entry.direction === "down" ? entry.position.y + i : entry.position.y;
        map.set(`${x},${y}`, entry.solution[i].toUpperCase());
      }
    }
    return map;
  }

  function checkWord() {
    const entry = activeClue.value;
    if (!entry?.solution) return;
    for (let i = 0; i < entry.length; i++) {
      const x = entry.direction === "across" ? entry.position.x + i : entry.position.x;
      const y = entry.direction === "down" ? entry.position.y + i : entry.position.y;
      const key = `${x},${y}`;
      const typed = cells.value[key];
      if (typed && typed !== entry.solution[i].toUpperCase()) {
        setCell(x, y, "");
      }
    }
  }

  function checkAll() {
    const solution = buildSolutionMap();
    for (const [key, correct] of solution) {
      const typed = cells.value[key];
      if (typed && typed !== correct) {
        const [xStr, yStr] = key.split(",");
        setCell(Number(xStr), Number(yStr), "");
      }
    }
  }

  function revealAll() {
    const solution = buildSolutionMap();
    for (const [key, correct] of solution) {
      const [xStr, yStr] = key.split(",");
      setCell(Number(xStr), Number(yStr), correct);
    }
  }

  function toggleDirection() {
    activeDirection.value = activeDirection.value === "across" ? "down" : "across";
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
    checkWord,
    checkAll,
    revealAll,
    toggleDirection,
    cleanup,
  };
});
