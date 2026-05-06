<template>
  <header class="app-header">
    <div class="container app-header__inner">
      <router-link to="/" class="app-header__logo">Multicrosser</router-link>
    </div>
  </header>
  <main class="app-main container">
    <router-view />
  </main>
</template>

<style lang="scss">
@use "@/styles/variables" as *;

.app-header {
  background: $color-surface;
  border-bottom: 1px solid $color-border;
  padding: 0.75rem 0;

  &__inner {
    display: flex;
    align-items: center;
  }

  &__logo {
    font-size: 1.4rem;
    font-weight: 700;
    color: $color-primary;
    text-decoration: none;
    letter-spacing: 0.02em;
  }
}

.app-main {
  padding-top: 2rem;
  padding-bottom: 2rem;
  flex: 1;
}
</style>
