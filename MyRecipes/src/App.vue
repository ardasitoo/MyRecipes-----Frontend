<template>
  <main class="app-shell">
    <section class="home-hero" aria-label="Startseite">
      <div class="home-copy">
        <p class="eyebrow">MyRecipes</p>
        <h1>Rezepte sammeln, ordnen und schnell wiederfinden.</h1>
        <p class="home-lead">
          Eine ruhige Rezeptverwaltung für eigene Gerichte, persönliche Benutzerbereiche, Kategorien, Zutaten und
          Zubereitungsschritte.
        </p>

        <div class="home-actions">
          <a class="primary-link" href="#recipes">Rezepte verwalten</a>
        </div>
      </div>

      <div class="home-panel" aria-label="Funktionsübersicht">
        <div class="panel-header">
          <span>Übersicht</span>
          <strong>Alles an einem Ort</strong>
        </div>

        <div class="feature-list">
          <div>
            <span>Suchen</span>
            <p>Rezepte über Namen, Zutaten und Beschreibung finden.</p>
          </div>
          <div>
            <span>Benutzer</span>
            <p>Zwischen Personen wechseln und jeweils nur die eigenen Rezepte sehen.</p>
          </div>
          <div>
            <span>Kategorien</span>
            <p>Eigene Kategorien anlegen und beim Rezept direkt verwenden.</p>
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
