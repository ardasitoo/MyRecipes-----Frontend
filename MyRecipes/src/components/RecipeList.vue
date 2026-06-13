<template>
  <div>
    <h2>Rezepte</h2>

    <form @submit.prevent="createRecipe">
      <input
        v-model="newRecipeName"
        type="text"
        placeholder="Neues Rezept"
      />
      <button type="submit">Rezept speichern</button>
    </form>

    <p v-if="saving">Rezept wird gespeichert...</p>
    <p v-if="saveError">{{ saveError }}</p>

    <p v-if="loading">Rezepte werden geladen...</p>
    <p v-else-if="error">{{ error }}</p>

    <ul v-else>
      <li v-for="recipe in recipes" :key="recipe.id">
        {{ recipe.name }}
      </li>
    </ul>
  </div>
</template>

<script>
const API_URL = "https://myrecipes-backend-dew0.onrender.com/recipes";

export default {
  data() {
    return {
      recipes: [],
      newRecipeName: "",
      loading: true,
      saving: false,
      error: "",
      saveError: ""
    };
  },

  async mounted() {
    await this.loadRecipes();
  },

  methods: {
    async loadRecipes() {
      this.loading = true;
      this.error = "";

      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Fehler beim Laden der Rezepte");
        }

        this.recipes = await response.json();
      } catch (e) {
        this.error = "Rezepte konnten nicht geladen werden.";
      } finally {
        this.loading = false;
      }
    },

    async createRecipe() {
      const trimmedName = this.newRecipeName.trim();

      if (!trimmedName) {
        this.saveError = "Bitte gib einen Rezeptnamen ein.";
        return;
      }

      this.saving = true;
      this.saveError = "";

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: trimmedName
          })
        });

        if (!response.ok) {
          throw new Error("Fehler beim Speichern des Rezepts");
        }

        const savedRecipe = await response.json();
        this.recipes.push(savedRecipe);
        this.newRecipeName = "";
      } catch (e) {
        this.saveError = "Rezept konnte nicht gespeichert werden.";
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>