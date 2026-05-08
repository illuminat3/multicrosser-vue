<template>
  <div class="home">
    <div class="home__header">
      <h1 class="home__title">
        {{ isToday ? "Today's Crosswords" : formatDisplayDate(selectedDate) }}
      </h1>
      <div class="home__date-nav">
        <button
          class="btn btn--ghost home__date-btn"
          :disabled="selectedDate <= minDate"
          @click="stepDate(-1)"
        >
          ‹
        </button>
        <input
          type="date"
          class="home__date-input"
          :value="selectedDate"
          :min="minDate"
          :max="todayDate"
          @change="onDateChange"
        />
        <button class="btn btn--ghost home__date-btn" :disabled="isToday" @click="stepDate(1)">
          ›
        </button>
      </div>
    </div>

    <div v-if="loading" class="home__status">Loading crosswords…</div>
    <div v-else-if="error" class="home__status home__status--error">{{ error }}</div>

    <div v-else class="home__hosts">
      <section v-for="host in hosts" :key="host.hostId" class="host">
        <h2 class="host__name">{{ host.displayName }}</h2>
        <div class="host__providers">
          <div v-for="provider in host.providers" :key="provider.providerId" class="provider-card">
            <div class="provider-card__type">{{ formatType(provider.crosswordType) }}</div>
            <div class="provider-card__meta">
              <span v-if="crosswordData[provider.providerId]">
                #{{ crosswordData[provider.providerId]!.number }}
              </span>
              <span v-else-if="loadingProviders.has(provider.providerId)" class="muted">
                Fetching…
              </span>
              <span v-else class="muted">Unavailable</span>
            </div>
            <button
              class="btn btn--primary provider-card__btn"
              :disabled="!crosswordData[provider.providerId]"
              @click="startGame(provider.providerId)"
            >
              Play
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { CrosswordHostMeta, CrosswordData } from "@/types";
import {
  fetchHosts,
  fetchTodaysCrossword,
  fetchCrosswordForDate,
  createGame,
} from "@/services/api";

const router = useRouter();
const hosts = ref<CrosswordHostMeta[]>([]);
const crosswordData = ref<Record<string, CrosswordData | null>>({});
const loadingProviders = ref(new Set<string>());
const loading = ref(true);
const error = ref("");

function toUKDateStr(date: Date): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function ukToday(): string {
  return toUKDateStr(new Date());
}

const todayDate = ukToday();
const thirtyDaysAgo = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return toUKDateStr(d);
})();

const selectedDate = ref(todayDate);
const minDate = thirtyDaysAgo;

const isToday = computed(() => selectedDate.value === ukToday());

function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  });
}

let loadTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleLoad() {
  if (loadTimer !== null) clearTimeout(loadTimer);
  loadTimer = setTimeout(() => {
    loadTimer = null;
    void loadAllProviders();
  }, 250);
}

function onDateChange(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (val) {
    selectedDate.value = val;
    scheduleLoad();
  }
}

function stepDate(delta: number) {
  const d = new Date(`${selectedDate.value}T12:00:00Z`);
  d.setDate(d.getDate() + delta);
  const newDate = toUKDateStr(d);
  if (newDate >= minDate && newDate <= todayDate) {
    selectedDate.value = newDate;
    scheduleLoad();
  }
}

async function loadProvider(providerId: string) {
  loadingProviders.value.add(providerId);
  crosswordData.value[providerId] = null;
  try {
    const data = isToday.value
      ? await fetchTodaysCrossword(providerId)
      : await fetchCrosswordForDate(providerId, selectedDate.value);
    crosswordData.value[providerId] = data;
  } catch {
    crosswordData.value[providerId] = null;
  } finally {
    loadingProviders.value.delete(providerId);
  }
}

async function loadAllProviders() {
  loading.value = true;
  error.value = "";
  const providers = hosts.value.flatMap((h) => h.providers);
  await Promise.all(providers.map((p) => loadProvider(p.providerId)));
  loading.value = false;
}

async function startGame(providerId: string) {
  const data = crosswordData.value[providerId];
  if (!data) return;
  const game = await createGame(data.id);
  await router.push(`/game/${encodeURIComponent(data.id)}/${game.guid}`);
}

onMounted(async () => {
  try {
    hosts.value = await fetchHosts();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Failed to load";
    loading.value = false;
    return;
  }
  await loadAllProviders();
});
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.home {
  &__header {
    display: table;
    width: 100%;
    margin-bottom: 1.5rem;
  }

  &__title {
    display: table-cell;
    font-size: 1.8rem;
    font-weight: 700;
    max-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  &__date-nav {
    display: table-cell;
    width: 14rem;
    white-space: nowrap;
    vertical-align: middle;
    text-align: right;
  }

  &__date-btn {
    font-size: 1.2rem;
    padding: 0.25rem 0.5rem;
    line-height: 1;
    width: 2.25rem;
    flex-shrink: 0;

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  &__date-input {
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    color: $color-text;
    font-size: 0.9rem;
    padding: 0.3rem 0.5rem;
    cursor: pointer;
    width: 9rem;
    flex-shrink: 0;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }

  &__status {
    color: $color-text-muted;
    &--error {
      color: $color-primary;
    }
  }

  &__hosts {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
}

.host {
  &__name {
    font-size: 1.2rem;
    color: $color-text-muted;
    margin-bottom: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__providers {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
}

.provider-card {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 1.25rem 1.5rem;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__type {
    font-size: 1.1rem;
    font-weight: 700;
  }

  &__meta {
    font-size: 0.85rem;
    color: $color-text-muted;
    min-height: 1.2em;
  }

  &__btn {
    margin-top: 0.5rem;
    width: 100%;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.muted {
  color: $color-text-muted;
}
</style>
