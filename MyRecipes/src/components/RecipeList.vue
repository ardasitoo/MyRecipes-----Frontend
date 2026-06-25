<template>
  <section class="recipes-app">
    <header class="recipes-header">
      <div>
        <h2>Meine Rezepte</h2>
        <p>{{ filteredRecipes.length }} von {{ recipes.length }} Rezepten für {{ currentUser }}</p>
      </div>

      <label class="user-switch">
        Aktiver Benutzer
        <select v-model="currentUser">
          <option v-for="user in users" :key="user" :value="user">{{ user }}</option>
        </select>
      </label>
    </header>

    <nav class="section-tabs" aria-label="Rezeptbereiche">
      <button type="button" :class="{ active: activeSection === 'recipes' }" @click="activeSection = 'recipes'">
        Rezepte
      </button>
      <button type="button" :class="{ active: activeSection === 'categories' }" @click="activeSection = 'categories'">
        Kategorien
      </button>
    </nav>

    <template v-if="activeSection === 'recipes'">
      <div class="toolbar">
        <label>
          Suche
          <input v-model="searchTerm" type="search" placeholder="Name, Zutaten oder Beschreibung" />
        </label>

        <label>
          Kategorie
          <select v-model="selectedCategory">
            <option value="">Alle Kategorien</option>
            <option v-for="category in categoryOptions" :key="category" :value="category">
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
              <div>
                <dt>Besitzer</dt>
                <dd>{{ selectedRecipe.ownerName || currentUser }}</dd>
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
                <input v-model="form.category" type="text" list="category-options" placeholder="z. B. Hauptgericht" />
                <datalist id="category-options">
                  <option v-for="category in categoryOptions" :key="category" :value="category"></option>
                </datalist>
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
    </template>

    <section v-else class="category-workspace" aria-label="Kategorien verwalten">
      <div class="category-copy">
        <h3>Kategorien verwalten</h3>
        <p>
          Lege eigene Kategorien für {{ currentUser }} an. Beim Erstellen oder Bearbeiten eines Rezepts kannst du diese
          Kategorien direkt verwenden.
        </p>
      </div>

      <form class="category-form" @submit.prevent="saveCategory">
        <label>
          Neue Kategorie
          <input v-model="categoryFormName" type="text" placeholder="z. B. Meal Prep" />
        </label>
        <button type="submit">{{ savingCategory ? "Speichert..." : "Kategorie speichern" }}</button>
      </form>

      <p v-if="categoryError" class="error">{{ categoryError }}</p>

      <div class="category-list">
        <p v-if="customCategories.length === 0" class="empty-state">Noch keine eigenen Kategorien angelegt.</p>
        <article v-for="category in customCategories" :key="category.id || category.name" class="category-card">
          <div>
            <strong>{{ category.name }}</strong>
            <span>{{ category.ownerName || currentUser }}</span>
          </div>
          <button type="button" class="danger-button" @click="deleteCategory(category)">Löschen</button>
        </article>
      </div>
    </section>
  </section>
</template>

<script>
import {
  createCategory,
  createRecipe,
  deleteCategoryById,
  deleteRecipeById,
  getCategories,
  getRecipes,
  updateRecipe
} from "../services/recipeApi";
import { collectCategories, filterRecipes } from "../utils/recipeFilters";

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
      customCategories: [],
      selectedRecipe: null,
      editingRecipeId: null,
      currentUser: "Simar",
      users: ["Simar", "Familie", "Dozent"],
      activeSection: "recipes",
      form: emptyForm(),
      categoryFormName: "",
      searchTerm: "",
      selectedCategory: "",
      loading: true,
      saving: false,
      savingCategory: false,
      error: "",
      saveError: "",
      categoryError: ""
    };
  },

  computed: {
    categoryOptions() {
      return collectCategories(this.recipes, this.customCategories);
    },

    filteredRecipes() {
      return filterRecipes(this.recipes, this.searchTerm, this.selectedCategory);
    }
  },

  watch: {
    async currentUser() {
      this.resetForm();
      this.searchTerm = "";
      this.selectedCategory = "";
      this.selectedRecipe = null;
      await Promise.all([this.loadRecipes(), this.loadCategories()]);
    }
  },

  async mounted() {
    await Promise.all([this.loadRecipes(), this.loadCategories()]);
  },

  methods: {
    async loadRecipes() {
      this.loading = true;
      this.error = "";

      try {
        this.recipes = await getRecipes(this.currentUser);
        this.selectedRecipe = this.recipes[0] || null;
      } catch (e) {
        this.error = "Rezepte konnten nicht geladen werden.";
      } finally {
        this.loading = false;
      }
    },

    async loadCategories() {
      this.categoryError = "";

      try {
        this.customCategories = await getCategories(this.currentUser);
      } catch (e) {
        this.categoryError = "Kategorien konnten nicht geladen werden.";
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
        steps: this.form.steps.trim(),
        ownerName: this.currentUser
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
        const savedRecipe = this.editingRecipeId
          ? await updateRecipe(this.editingRecipeId, payload)
          : await createRecipe(payload);

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
        await deleteRecipeById(recipe.id);

        this.recipes = this.recipes.filter((existingRecipe) => existingRecipe.id !== recipe.id);
        this.selectedRecipe = this.recipes[0] || null;

        if (this.editingRecipeId === recipe.id) {
          this.resetForm();
        }
      } catch (e) {
        this.saveError = "Rezept konnte nicht gelöscht werden.";
      }
    },

    async saveCategory() {
      const name = this.categoryFormName.trim();

      if (!name) {
        this.categoryError = "Bitte gib einen Kategorienamen ein.";
        return;
      }

      this.savingCategory = true;
      this.categoryError = "";

      try {
        const savedCategory = await createCategory({
          name,
          ownerName: this.currentUser
        });
        this.customCategories.push(savedCategory);
        this.categoryFormName = "";
      } catch (e) {
        this.categoryError = "Kategorie konnte nicht gespeichert werden.";
      } finally {
        this.savingCategory = false;
      }
    },

    async deleteCategory(category) {
      try {
        await deleteCategoryById(category.id);

        this.customCategories = this.customCategories.filter((existingCategory) => existingCategory.id !== category.id);
      } catch (e) {
        this.categoryError = "Kategorie konnte nicht gelöscht werden.";
      }
    }
  }
};
</script>
