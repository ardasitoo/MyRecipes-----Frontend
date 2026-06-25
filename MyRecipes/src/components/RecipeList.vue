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
          <option v-for="userName in userNames" :key="userName" :value="userName">{{ userName }}</option>
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
      <button type="button" :class="{ active: activeSection === 'users' }" @click="activeSection = 'users'">
        Benutzer
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

        <label class="checkbox-label">
          <input v-model="showFavoritesOnly" type="checkbox" />
          Nur Favoriten
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
            <span class="recipe-meta">
              <span v-if="recipe.favorite" class="favorite-badge">Favorit</span>
              <span>{{ recipe.preparationTime || 0 }} min</span>
            </span>
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
              <div>
                <dt>Status</dt>
                <dd>{{ selectedRecipe.favorite ? "Favorit" : "Normal gespeichert" }}</dd>
              </div>
            </dl>

            <div class="actions">
              <button type="button" class="secondary-button" @click="toggleFavorite(selectedRecipe)">
                {{ selectedRecipe.favorite ? "Favorit entfernen" : "Als Favorit markieren" }}
              </button>
              <button type="button" @click="startEdit(selectedRecipe)">Bearbeiten</button>
              <button type="button" class="danger-button" @click="deleteRecipe(selectedRecipe)">Löschen</button>
            </div>

            <div class="share-panel" aria-label="Rezept weitergeben">
              <label>
                Rezept weitergeben an
                <select v-model="shareTargetUser">
                  <option v-for="user in shareableUsers" :key="user" :value="user">{{ user }}</option>
                </select>
              </label>
              <button type="button" @click="shareSelectedRecipe(selectedRecipe)">Kopie senden</button>
            </div>

            <p v-if="shareMessage" class="success">{{ shareMessage }}</p>
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

    <section v-else-if="activeSection === 'categories'" class="category-workspace" aria-label="Kategorien verwalten">
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

    <section v-else class="category-workspace" aria-label="Benutzer verwalten">
      <div class="category-copy">
        <h3>Benutzer verwalten</h3>
        <p>
          Lege einen neuen Benutzer an. Danach kann diese Person im Benutzerwechsel ausgewählt werden und eigene Rezepte
          speichern. Nicht mehr benötigte Benutzer kannst du hier wieder löschen.
        </p>
      </div>

      <form class="category-form" @submit.prevent="saveUser">
        <label>
          Neuer Benutzer
          <input v-model="userFormName" type="text" placeholder="z. B. Mina" />
        </label>
        <button type="submit">{{ savingUser ? "Speichert..." : "Benutzer speichern" }}</button>
      </form>

      <p v-if="userError" class="error">{{ userError }}</p>

      <div class="category-list">
        <p v-if="users.length === 0" class="empty-state">Noch keine Benutzer angelegt.</p>
        <article v-for="user in users" :key="user.id || user.name" class="category-card">
          <div>
            <strong>{{ user.name }}</strong>
            <span>{{ user.name === currentUser ? "Aktiv ausgewählt" : "Verfügbar" }}</span>
          </div>
          <button type="button" class="danger-button" @click="deleteUser(user)">Löschen</button>
        </article>
      </div>
    </section>
  </section>
</template>

<script>
import {
  createCategory,
  createRecipe,
  createUser,
  deleteCategoryById,
  deleteRecipeById,
  deleteUserById,
  getCategories,
  getRecipes,
  getUsers,
  shareRecipe,
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
      currentUser: "",
      users: [],
      activeSection: "recipes",
      form: emptyForm(),
      categoryFormName: "",
      userFormName: "",
      shareTargetUser: "",
      searchTerm: "",
      selectedCategory: "",
      showFavoritesOnly: false,
      loading: true,
      saving: false,
      savingCategory: false,
      savingUser: false,
      error: "",
      saveError: "",
      categoryError: "",
      userError: "",
      shareMessage: ""
    };
  },

  computed: {
    categoryOptions() {
      return collectCategories(this.recipes, this.customCategories);
    },

    filteredRecipes() {
      return filterRecipes(this.recipes, this.searchTerm, this.selectedCategory, this.showFavoritesOnly);
    },

    userNames() {
      return this.users.map((user) => user.name).filter(Boolean);
    },

    shareableUsers() {
      return this.userNames.filter((user) => user !== this.currentUser);
    }
  },

  watch: {
    async currentUser() {
      this.resetForm();
      this.searchTerm = "";
      this.selectedCategory = "";
      this.showFavoritesOnly = false;
      this.selectedRecipe = null;
      this.shareTargetUser = this.shareableUsers[0] || "";
      this.shareMessage = "";
      await Promise.all([this.loadRecipes(), this.loadCategories()]);
    }
  },

  async mounted() {
    await Promise.all([this.loadUsers(), this.loadRecipes(), this.loadCategories()]);
  },

  methods: {
    async loadUsers() {
      this.userError = "";

      try {
        const loadedUsers = await getUsers();
        this.users = loadedUsers.filter((user) => user.name);

        if (!this.userNames.includes(this.currentUser)) {
          this.currentUser = this.userNames[0] || "";
        }

        this.shareTargetUser = this.shareableUsers[0] || "";
      } catch (e) {
        this.userError = "Benutzer konnten nicht geladen werden.";
      }
    },

    async loadRecipes() {
      this.loading = true;
      this.error = "";

      if (!this.currentUser) {
        this.recipes = [];
        this.selectedRecipe = null;
        this.loading = false;
        return;
      }

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

      if (!this.currentUser) {
        this.customCategories = [];
        return;
      }

      try {
        this.customCategories = await getCategories(this.currentUser);
      } catch (e) {
        this.categoryError = "Kategorien konnten nicht geladen werden.";
      }
    },

    selectRecipe(recipe) {
      this.selectedRecipe = recipe;
      this.shareMessage = "";
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
        ownerName: this.currentUser,
        favorite: Boolean(this.selectedRecipe && this.editingRecipeId === this.selectedRecipe.id && this.selectedRecipe.favorite)
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

    async toggleFavorite(recipe) {
      const payload = {
        name: recipe.name,
        description: recipe.description || "",
        category: recipe.category || "",
        preparationTime: recipe.preparationTime || 0,
        ingredients: recipe.ingredients || "",
        steps: recipe.steps || "",
        ownerName: recipe.ownerName || this.currentUser,
        favorite: !recipe.favorite
      };

      try {
        const savedRecipe = await updateRecipe(recipe.id, payload);
        this.recipes = this.recipes.map((existingRecipe) => (existingRecipe.id === savedRecipe.id ? savedRecipe : existingRecipe));
        this.selectedRecipe = savedRecipe;
      } catch (e) {
        this.saveError = "Favorit konnte nicht gespeichert werden.";
      }
    },

    async shareSelectedRecipe(recipe) {
      if (!this.shareTargetUser) {
        this.shareMessage = "";
        this.saveError = "Bitte wähle einen Benutzer zum Weitergeben aus.";
        return;
      }

      try {
        await shareRecipe(recipe.id, this.shareTargetUser);
        this.shareMessage = `Rezept wurde als Kopie an ${this.shareTargetUser} weitergegeben.`;
      } catch (e) {
        this.saveError = "Rezept konnte nicht weitergegeben werden.";
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
    },

    async saveUser() {
      const name = this.userFormName.trim();

      if (!name) {
        this.userError = "Bitte gib einen Benutzernamen ein.";
        return;
      }

      this.savingUser = true;
      this.userError = "";

      try {
        const savedUser = await createUser({ name });

        if (!this.userNames.includes(savedUser.name)) {
          this.users.push(savedUser);
          this.users.sort((firstUser, secondUser) => firstUser.name.localeCompare(secondUser.name));
        }

        this.currentUser = savedUser.name;
        this.shareTargetUser = this.shareableUsers[0] || "";
        this.userFormName = "";
        await Promise.all([this.loadRecipes(), this.loadCategories()]);
      } catch (e) {
        this.userError = "Benutzer konnte nicht gespeichert werden.";
      } finally {
        this.savingUser = false;
      }
    },

    async deleteUser(user) {
      try {
        await deleteUserById(user.id);
        this.users = this.users.filter((existingUser) => existingUser.id !== user.id);

        if (this.currentUser === user.name) {
          this.currentUser = this.userNames[0] || "";
        }

        this.shareTargetUser = this.shareableUsers[0] || "";
        await Promise.all([this.loadRecipes(), this.loadCategories()]);
      } catch (e) {
        this.userError = "Benutzer konnte nicht gelöscht werden.";
      }
    }
  }
};
</script>
