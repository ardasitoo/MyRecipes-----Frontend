<template>
  <section class="recipes-app">
    <header class="recipes-header">
      <div>
        <h2>Rezepte</h2>
        <p>{{ filteredRecipes.length }} von {{ recipes.length }} Rezepten</p>
      </div>
      <button type="button" class="secondary-button" @click="resetForm">Neues Rezept</button>
    </header>

    <div class="toolbar">
      <label>
        Suche
        <input v-model="searchTerm" type="search" placeholder="Name, Zutaten oder Beschreibung" />
      </label>

      <label>
        Kategorie
        <select v-model="selectedCategory">
          <option value="">Alle Kategorien</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="loading" class="status">Rezepte werden geladen...</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <div v-else class="content-grid">
      <aside class="recipe-list" aria-label="Rezeptliste">
        <p v-if="filteredRecipes.length === 0" class="empty-state">Keine passenden Rezepte gefunden.</p>

        <button
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          type="button"
          class="recipe-row"
          :class="{ active: selectedRecipe && selectedRecipe.id === recipe.id }"
          @click="selectRecipe(recipe)"
        >
          <span>
            <strong>{{ recipe.name }}</strong>
            <small>{{ recipe.category || "Ohne Kategorie" }}</small>
          </span>
          <span>{{ recipe.preparationTime || 0 }} min</span>
        </button>
      </aside>

      <section class="recipe-detail" aria-label="Rezeptdetails">
        <template v-if="selectedRecipe">
          <div class="detail-header">
            <div>
              <p>{{ selectedRecipe.category || "Ohne Kategorie" }}</p>
              <h3>{{ selectedRecipe.name }}</h3>
            </div>
            <span>{{ selectedRecipe.preparationTime || 0 }} min</span>
          </div>

          <p>{{ selectedRecipe.description || "Keine Beschreibung vorhanden." }}</p>

          <dl>
            <div>
              <dt>Zutaten</dt>
              <dd>{{ selectedRecipe.ingredients || "Keine Zutaten eingetragen." }}</dd>
            </div>
            <div>
              <dt>Zubereitung</dt>
              <dd>{{ selectedRecipe.steps || "Keine Schritte eingetragen." }}</dd>
            </div>
          </dl>

          <div class="actions">
            <button type="button" @click="startEdit(selectedRecipe)">Bearbeiten</button>
            <button type="button" class="danger-button" @click="deleteRecipe(selectedRecipe)">Löschen</button>
          </div>
        </template>

        <p v-else class="empty-state">Wähle ein Rezept aus der Liste aus.</p>
      </section>

      <section class="recipe-form" aria-label="Rezeptformular">
        <h3>{{ editingRecipeId ? "Rezept bearbeiten" : "Neues Rezept anlegen" }}</h3>

        <form @submit.prevent="saveRecipe">
          <label>
            Name
            <input v-model="form.name" type="text" placeholder="z. B. Pizza Margherita" />
          </label>

          <label>
            Beschreibung
            <textarea v-model="form.description" placeholder="Kurze Beschreibung"></textarea>
          </label>

          <div class="form-row">
            <label>
              Kategorie
              <input v-model="form.category" type="text" placeholder="z. B. Hauptgericht" />
            </label>

            <label>
              Zeit in Minuten
              <input v-model.number="form.preparationTime" type="number" min="0" />
            </label>
          </div>

          <label>
            Zutaten
            <textarea v-model="form.ingredients" placeholder="z. B. Tomaten, Mehl, Mozzarella"></textarea>
          </label>

          <label>
            Zubereitung
            <textarea v-model="form.steps" placeholder="Schritte zur Zubereitung"></textarea>
          </label>

          <p v-if="saveError" class="error">{{ saveError }}</p>

          <div class="actions">
            <button type="submit">{{ saving ? "Speichert..." : editingRecipeId ? "Änderungen speichern" : "Rezept speichern" }}</button>
            <button v-if="editingRecipeId" type="button" class="secondary-button" @click="resetForm">
              Abbrechen
            </button>
          </div>
        </form>
      </section>
    </div>
  </section>
</template>

<script>
const API_URL = "https://myrecipes-backend-dew0.onrender.com/recipes";

const emptyForm = () => ({
  name: "",
  description: "",
  category: "",
  preparationTime: 0,
  ingredients: "",
  steps: ""
});

export default {
  data() {
    return {
      recipes: [],
      selectedRecipe: null,
      editingRecipeId: null,
      form: emptyForm(),
      searchTerm: "",
      selectedCategory: "",
      loading: true,
      saving: false,
      error: "",
      saveError: ""
    };
  },

  computed: {
    categories() {
      return [...new Set(this.recipes.map((recipe) => recipe.category).filter(Boolean))].sort();
    },

    filteredRecipes() {
      const term = this.searchTerm.trim().toLowerCase();

      return this.recipes.filter((recipe) => {
        const matchesCategory = !this.selectedCategory || recipe.category === this.selectedCategory;
        const searchableText = [
          recipe.name,
          recipe.description,
          recipe.category,
          recipe.ingredients,
          recipe.steps
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return matchesCategory && (!term || searchableText.includes(term));
      });
    }
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
        this.selectedRecipe = this.recipes[0] || null;
      } catch (e) {
        this.error = "Rezepte konnten nicht geladen werden.";
      } finally {
        this.loading = false;
      }
    },

    selectRecipe(recipe) {
      this.selectedRecipe = recipe;
    },

    startEdit(recipe) {
      this.editingRecipeId = recipe.id;
      this.form = {
        name: recipe.name || "",
        description: recipe.description || "",
        category: recipe.category || "",
        preparationTime: recipe.preparationTime || 0,
        ingredients: recipe.ingredients || "",
        steps: recipe.steps || ""
      };
      this.saveError = "";
    },

    resetForm() {
      this.editingRecipeId = null;
      this.form = emptyForm();
      this.saveError = "";
    },

    recipePayload() {
      return {
        name: this.form.name.trim(),
        description: this.form.description.trim(),
        category: this.form.category.trim(),
        preparationTime: Number(this.form.preparationTime) || 0,
        ingredients: this.form.ingredients.trim(),
        steps: this.form.steps.trim()
      };
    },

    async saveRecipe() {
      const payload = this.recipePayload();

      if (!payload.name) {
        this.saveError = "Bitte gib einen Rezeptnamen ein.";
        return;
      }

      this.saving = true;
      this.saveError = "";

      try {
        const url = this.editingRecipeId ? `${API_URL}/${this.editingRecipeId}` : API_URL;
        const response = await fetch(url, {
          method: this.editingRecipeId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error("Fehler beim Speichern des Rezepts");
        }

        const savedRecipe = await response.json();

        if (this.editingRecipeId) {
          this.recipes = this.recipes.map((recipe) => (recipe.id === savedRecipe.id ? savedRecipe : recipe));
        } else {
          this.recipes.push(savedRecipe);
        }

        this.selectedRecipe = savedRecipe;
        this.resetForm();
      } catch (e) {
        this.saveError = "Rezept konnte nicht gespeichert werden.";
      } finally {
        this.saving = false;
      }
    },

    async deleteRecipe(recipe) {
      try {
        const response = await fetch(`${API_URL}/${recipe.id}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error("Fehler beim Löschen des Rezepts");
        }

        this.recipes = this.recipes.filter((existingRecipe) => existingRecipe.id !== recipe.id);
        this.selectedRecipe = this.recipes[0] || null;

        if (this.editingRecipeId === recipe.id) {
          this.resetForm();
        }
      } catch (e) {
        this.saveError = "Rezept konnte nicht gelöscht werden.";
      }
    }
  }
};
</script>
