<template>
  <div class="home">
    <h1 class="home__title">Today's Crosswords</h1>

    <div v-if="loading" class="home__status">Loading crosswords…</div>
    <div v-else-if="error" class="home__status home__status--error">{{ error }}</div>

    <div v-else class="home__hosts">
      <section v-for="host in hosts" :key="host.hostId" class="host">
        <h2 class="host__name">{{ host.displayName }}</h2>
        <div class="host__providers">
          <div
            v-for="provider in host.providers"
            :key="provider.providerId"
            class="provider-card"
          >
            <div class="provider-card__type">{{ formatType(provider.crosswordType) }}</div>
            <div class="provider-card__meta">
              <span v-if="crosswordData[provider.providerId]">
                #{{ crosswordData[provider.providerId]!.number }}
              </span>
              <span v-else-if="loadingProviders.has(provider.providerId)" class="muted">
                Fetching…
              </span>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { CrosswordHostMeta, CrosswordData } from '@/types';
import { fetchHosts, fetchTodaysCrossword, createGame } from '@/services/api';

const router = useRouter();
const hosts = ref<CrosswordHostMeta[]>([]);
const crosswordData = ref<Record<string, CrosswordData | null>>({});
const loadingProviders = ref(new Set<string>());
const loading = ref(true);
const error = ref('');

function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

async function loadProvider(providerId: string) {
  loadingProviders.value.add(providerId);
  try {
    const data = await fetchTodaysCrossword(providerId);
    crosswordData.value[providerId] = data;
  } catch {
    crosswordData.value[providerId] = null;
  } finally {
    loadingProviders.value.delete(providerId);
  }
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
    const providers = hosts.value.flatMap((h) => h.providers);
    await Promise.all(providers.map((p) => loadProvider(p.providerId)));
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load';
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.home {
  &__title {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    font-weight: 700;
  }

  &__status {
    color: $color-text-muted;
    &--error { color: $color-primary; }
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

.muted { color: $color-text-muted; }
</style>
