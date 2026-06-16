<template>
  <main class="app-shell">
    <section class="home-hero" aria-label="Startseite">
      <div class="home-copy">
        <p class="eyebrow">MyRecipes</p>
        <h1>Rezepte sammeln, ordnen und schnell wiederfinden.</h1>
        <p class="home-lead">
          Eine ruhige Rezeptverwaltung für eigene Gerichte, Kategorien, Zutaten und Zubereitungsschritte.
        </p>

        <div class="home-actions">
          <a class="primary-link" href="#recipes">Rezepte verwalten</a>
          <span>7 Use-Cases bereit für die Dokumentation</span>
        </div>
      </div>

      <div class="home-preview" aria-label="Rezeptvorschau">
        <div class="preview-card featured">
          <span>Hauptgericht</span>
          <strong>Pizza Margherita</strong>
          <p>Tomaten, Mozzarella, Basilikum</p>
        </div>
        <div class="preview-grid">
          <div class="preview-card">
            <span>Dessert</span>
            <strong>Apfelkuchen</strong>
          </div>
          <div class="preview-card">
            <span>Suche</span>
            <strong>Pasta</strong>
          </div>
        </div>
      </div>
    </section>

    <section id="recipes">
      <RecipeList />
    </section>
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
