<template>
  <div class="game">
    <div v-if="loading" class="game__status">Loading game…</div>
    <div v-else-if="error" class="game__status game__status--error">
      {{ error }}
      <router-link to="/" class="btn btn--ghost" style="margin-top: 1rem">Back to home</router-link>
    </div>

    <template v-else-if="gameStore.crossword">
      <div class="game__header">
        <div>
          <h1 class="game__title">{{ gameStore.crossword.name }}</h1>
          <p class="game__meta">
            Share this URL to play together &nbsp;·&nbsp;
            <span class="game__expires">Expires {{ expiresAt }}</span>
          </p>
        </div>
        <button class="btn btn--ghost" @click="copyLink">
          {{ copied ? "Copied!" : "Copy link" }}
        </button>
      </div>

      <div class="game__body">
        <div class="game__grid-wrap">
          <CrosswordGrid :crossword="gameStore.crossword" />
          <div class="game__active-clue">
            <template v-if="gameStore.activeClue">
              <span class="game__active-clue-num">
                {{ gameStore.activeClue.humanNumber }}
                {{ gameStore.activeClue.direction === "across" ? "A" : "D" }}
              </span>
              {{ gameStore.activeClue.clue }}
              <span class="muted"
                >({{ gameStore.activeClue.format ?? gameStore.activeClue.length }})</span
              >
            </template>
            <span v-else class="muted">Select a cell to see the clue</span>
          </div>
        </div>
        <div class="game__clues">
          <ClueList
            :entries="gameStore.crossword.entries"
            :active-clue="gameStore.activeClue"
            @clue-click="onClueClick"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useGameStore } from "@/stores/game";
import { fetchGame, fetchTodaysCrossword, createGame } from "@/services/api";
import type { CrosswordEntry } from "@/types";
import CrosswordGrid from "@/components/CrosswordGrid.vue";
import ClueList from "@/components/ClueList.vue";
import { useRouter } from "vue-router";

const props = defineProps<{ crosswordId: string; guid: string }>();
const router = useRouter();
const gameStore = useGameStore();
const loading = ref(true);
const error = ref("");
const copied = ref(false);
const expiresAt = ref("");

async function initGame() {
  loading.value = true;
  error.value = "";

  try {
    const game = await fetchGame(props.crosswordId, props.guid).catch((e: Error) => {
      throw Object.assign(e, { expired: true });
    });

    expiresAt.value = new Date(game.expiresAt).toLocaleString();

    const cwRes = await fetch(`/api/crosswords/by-id/${encodeURIComponent(game.crosswordId)}`);
    let cwData = cwRes.ok ? await cwRes.json() : null;

    if (!cwData) {
      const providerId = extractProviderId(game.crosswordId);
      cwData = await fetchTodaysCrossword(providerId);
    }

    gameStore.crossword = cwData;
    gameStore.initSocket(game.crosswordId, game.guid);
  } catch (e: unknown) {
    const isExpired =
      (e instanceof Error && (e.message.includes("not found") || e.message.includes("expired"))) ||
      (typeof e === "object" && e !== null && "expired" in e);

    if (isExpired) {
      try {
        const providerId = extractProviderId(props.crosswordId);
        const cwData = await fetchTodaysCrossword(providerId);
        const newGame = await createGame(cwData.id);
        await router.replace(`/game/${encodeURIComponent(cwData.id)}/${newGame.guid}`);
        return;
      } catch {
        error.value = "Game expired and could not create a new one.";
      }
    } else {
      error.value = e instanceof Error ? e.message : "Unknown error";
    }
  } finally {
    loading.value = false;
  }
}

function extractProviderId(crosswordId: string): string {
  const parts = crosswordId.split(":");
  return parts[0] ?? "";
}

function onClueClick(entry: CrosswordEntry) {
  gameStore.activeCell = { x: entry.position.x, y: entry.position.y };
  gameStore.activeDirection = entry.direction;
}

async function copyLink() {
  await navigator.clipboard.writeText(location.href);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

onMounted(initGame);
onUnmounted(() => gameStore.cleanup());
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.game {
  &__status {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: $color-text-muted;
    &--error {
      color: $color-primary;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  &__title {
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  &__meta {
    font-size: 0.85rem;
    color: $color-text-muted;
  }

  &__expires {
    color: $color-text-muted;
  }

  &__active-clue {
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: 0.6rem 1rem;
    margin-top: 0.75rem;
    font-size: 0.95rem;
    line-height: 1.4;
    min-height: 2.6rem;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  &__active-clue-num {
    font-weight: 700;
    color: $color-primary;
    margin-right: 0.4rem;
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  &__grid-wrap {
    overflow-x: auto;
    display: flex;
    flex-direction: column;
  }

  &__clues {
    flex: 1;
    min-width: 280px;
    max-height: 70vh;
    overflow-y: auto;
  }
}

.muted {
  color: $color-text-muted;
}
</style>
