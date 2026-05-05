<template>
  <div>
    <h1>Meine Rezepte App</h1>
    <RecipeList />
  </div>
</template>

<script>
import RecipeList from "./components/RecipeList.vue";

export default {
  components: {
    RecipeList
  }
};
</script>