<template>
  <div class="clue-list">
    <div class="clue-list__section">
      <h3 class="clue-list__heading">Across</h3>
      <ul>
        <li
          v-for="entry in across"
          :key="entry.id"
          class="clue-list__item"
          :class="{
            'clue-list__item--active': activeClue?.id === entry.id,
            'clue-list__item--completed': isCompleted(entry),
          }"
          @click="$emit('clue-click', entry)"
        >
          <span class="clue-list__num">{{ entry.humanNumber }}</span>
          <span class="clue-list__text" v-html="sanitizeClueHtml(entry.clue)" />
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
          :class="{
            'clue-list__item--active': activeClue?.id === entry.id,
            'clue-list__item--completed': isCompleted(entry),
          }"
          @click="$emit('clue-click', entry)"
        >
          <span class="clue-list__num">{{ entry.humanNumber }}</span>
          <span class="clue-list__text" v-html="sanitizeClueHtml(entry.clue)" />
          <span class="clue-list__len">({{ entry.format ?? entry.length }})</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CrosswordEntry } from "@/types";
import { useGameStore } from "@/stores/game";

const props = defineProps<{
  entries: CrosswordEntry[];
  activeClue: CrosswordEntry | null;
}>();

defineEmits<{ "clue-click": [entry: CrosswordEntry] }>();

const gameStore = useGameStore();

const across = computed(() => props.entries.filter((e) => e.direction === "across"));
const down = computed(() => props.entries.filter((e) => e.direction === "down"));
const ALLOWED_CLUE_TAGS = new Set(["span", "i", "em", "b", "strong", "sup", "sub", "br"]);

function isCompleted(entry: CrosswordEntry): boolean {
  for (let i = 0; i < entry.length; i++) {
    const x = entry.direction === "across" ? entry.position.x + i : entry.position.x;
    const y = entry.direction === "down" ? entry.position.y + i : entry.position.y;
    if (!gameStore.lockedCells.has(`${x},${y}`)) return false;
  }
  return true;
}

function sanitizeClueHtml(clue: string): string {
  if (typeof window === "undefined" || !clue.includes("<")) return clue;

  const parser = new DOMParser();
  const doc = parser.parseFromString(clue, "text/html");
  sanitizeNode(doc.body, doc);
  return doc.body.innerHTML;
}

function sanitizeNode(node: HTMLElement, doc: Document): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const element = child as HTMLElement;
    const tagName = element.tagName.toLowerCase();
    if (!ALLOWED_CLUE_TAGS.has(tagName)) {
      const fragment = doc.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      node.replaceChild(fragment, element);
      sanitizeNode(node, doc);
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      if (!(tagName === "span" && attribute.name === "class")) {
        element.removeAttribute(attribute.name);
      }
    }

    sanitizeNode(element, doc);
  }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

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

    &:hover {
      background: $color-surface;
    }

    &--active {
      background: rgba($color-primary, 0.2);
      color: $color-text;
    }

    &--completed {
      color: $color-text-muted;

      .clue-list__num {
        color: $color-text-muted;
      }

      &::after {
        content: "✓";
        color: #4caf50;
        font-weight: 700;
        flex-shrink: 0;
        margin-left: 0.3rem;
      }
    }
  }

  &__num {
    font-weight: 700;
    min-width: 1.8em;
    color: $color-primary;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
  }

  &__len {
    color: $color-text-muted;
    flex-shrink: 0;
  }
}
</style>
