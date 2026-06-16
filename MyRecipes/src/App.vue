<template>
  <main class="app-shell">
    <h1>Meine Rezepte App</h1>
    <RecipeList />
  </main>
</template>

<script>
import RecipeList from "./components/RecipeList.vue";

export default {
  components: {
    RecipeList
  }
};
</script>
