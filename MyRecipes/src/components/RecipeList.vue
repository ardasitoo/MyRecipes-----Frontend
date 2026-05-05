<template>
  <div>
    <h2>Rezepte</h2>
    <ul>
      <li v-for="recipe in recipes" :key="recipe.id">
        {{ recipe.name }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  data() {
    return {
      recipes: [
        { id: 1, name: "Lasagne" },
        { id: 2, name: "Yaglama" },
        { id: 3, name: "Pizza Diavola" }
      ]
    };
  }
};
</script>