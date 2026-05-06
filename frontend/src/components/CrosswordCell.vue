<template>
  <div
    class="cell"
    :class="{
      'cell--black': isBlack,
      'cell--active': isActive,
      'cell--highlighted': isHighlighted && !isActive,
      'cell--sep-right-comma': sepRight === 'comma',
      'cell--sep-bottom-comma': sepBottom === 'comma',
      'cell--sep-left-comma': sepLeft === 'comma',
      'cell--sep-top-comma': sepTop === 'comma',
    }"
    @click="$emit('click')"
  >
    <span v-if="clueNumber" class="cell__number">{{ clueNumber }}</span>
    <input
      v-if="!isBlack"
      ref="inputRef"
      class="cell__input"
      type="text"
      maxlength="1"
      :value="value"
      autocomplete="off"
      autocorrect="off"
      spellcheck="false"
      @keydown="onKeydown"
    />
    <span
      v-if="!isBlack && sepRight === 'dash'"
      class="cell__sep cell__sep--right"
      aria-hidden="true"
      >|</span
    >
    <span
      v-if="!isBlack && sepBottom === 'dash'"
      class="cell__sep cell__sep--bottom"
      aria-hidden="true"
      >|</span
    >
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  x: number;
  y: number;
  isBlack: boolean;
  value: string;
  clueNumber?: number;
  isActive: boolean;
  isHighlighted: boolean;
  sepRight?: "dash" | "comma";
  sepBottom?: "dash" | "comma";
  sepLeft?: "dash" | "comma";
  sepTop?: "dash" | "comma";
}>();

const emit = defineEmits<{
  click: [];
  input: [value: string];
  keydown: [e: KeyboardEvent];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.isActive,
  (active) => {
    if (active) inputRef.value?.focus();
  },
);

function onKeydown(e: KeyboardEvent) {
  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    e.preventDefault();
    emit("input", e.key.toUpperCase());
    return;
  }
  e.preventDefault();
  emit("keydown", e);
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.cell {
  position: relative;
  width: $cell-size;
  height: $cell-size;
  border: 1px solid $color-cell-border;
  background: $color-cell-bg;
  overflow: visible;

  &--black {
    background: $color-cell-black;
    border-color: $color-cell-black;
  }

  &--highlighted {
    background: $color-cell-highlight;
  }

  &--active {
    background: $color-cell-active;
  }

  &--sep-right-comma {
    border-right-color: $color-cell-text;
  }
  &--sep-bottom-comma {
    border-bottom-color: $color-cell-text;
  }
  &--sep-left-comma {
    border-left-color: $color-cell-text;
  }
  &--sep-top-comma {
    border-top-color: $color-cell-text;
  }

  &__number {
    position: absolute;
    top: 1px;
    left: 2px;
    font-size: 9px;
    font-family: $font-sans;
    color: $color-cell-text;
    line-height: 1;
    pointer-events: none;
    z-index: 1;
  }

  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: none;
    background: transparent;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 700;
    font-family: $font-mono;
    color: $color-cell-text;
    cursor: default;
    outline: none;
    caret-color: transparent;
    text-transform: uppercase;
    padding: 0;
  }

  &__sep {
    position: absolute;
    z-index: 10;
    font-weight: 900;
    font-size: 13px;
    color: $color-cell-text;
    line-height: 1;
    pointer-events: none;

    &--right {
      left: 100%;
      top: 50%;
      transform: translate(0%, -50%) rotate(90deg);
      padding: 2px 0;
    }

    &--bottom {
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 50%);
      padding: 0 2px;
    }
  }
}
</style>
