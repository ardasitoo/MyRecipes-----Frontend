<template>
  <div>
    <h2>Rezepte</h2>

    <p v-if="loading">Rezepte werden geladen...</p>
    <p v-else-if="error">{{ error }}</p>

    <ul v-else>
      <li v-for="recipe in recipes" :key="recipe.name">
        {{ recipe.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      recipes: [],
      loading: true,
      error: ""
    };
  },

  async mounted() {
    try {
      const response = await fetch("https://myrecipes-backend-dew0.onrender.com/recipes");

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Rezepte");
      }

      this.recipes = await response.json();
    } catch (e) {
      this.error = "Rezepte konnten nicht geladen werden.";
    } finally {
      this.loading = false;
    }
  }
};
</script>