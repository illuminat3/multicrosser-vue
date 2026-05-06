<template>
  <div class="clue-list">
    <div class="clue-list__section">
      <h3 class="clue-list__heading">Across</h3>
      <ul>
        <li
          v-for="entry in across"
          :key="entry.id"
          class="clue-list__item"
          :class="{ 'clue-list__item--active': activeClue?.id === entry.id }"
          @click="$emit('clue-click', entry)"
        >
          <span class="clue-list__num">{{ entry.humanNumber }}</span>
          <span class="clue-list__text">{{ entry.clue }}</span>
          <span class="clue-list__len">({{ entry.format ?? entry.length }})</span>
        </li>
      </ul>
    </div>
    <div class="clue-list__section">
      <h3 class="clue-list__heading">Down</h3>
      <ul>
        <li
          v-for="entry in down"
          :key="entry.id"
          class="clue-list__item"
          :class="{ 'clue-list__item--active': activeClue?.id === entry.id }"
          @click="$emit('clue-click', entry)"
        >
          <span class="clue-list__num">{{ entry.humanNumber }}</span>
          <span class="clue-list__text">{{ entry.clue }}</span>
          <span class="clue-list__len">({{ entry.format ?? entry.length }})</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CrosswordEntry } from '@/types';

const props = defineProps<{
  entries: CrosswordEntry[];
  activeClue: CrosswordEntry | null;
}>();

defineEmits<{ 'clue-click': [entry: CrosswordEntry] }>();

const across = computed(() => props.entries.filter((e) => e.direction === 'across'));
const down = computed(() => props.entries.filter((e) => e.direction === 'down'));
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.clue-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }

  &__heading {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: $color-text-muted;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    display: flex;
    gap: 0.4rem;
    padding: 0.3rem 0.5rem;
    border-radius: $radius-sm;
    cursor: pointer;
    font-size: 0.88rem;
    line-height: 1.4;
    transition: background 0.1s;

    &:hover { background: $color-surface; }

    &--active {
      background: rgba($color-primary, 0.2);
      color: $color-text;
    }
  }

  &__num {
    font-weight: 700;
    min-width: 1.8em;
    color: $color-primary;
    flex-shrink: 0;
  }

  &__text { flex: 1; }

  &__len {
    color: $color-text-muted;
    flex-shrink: 0;
  }
}
</style>
