export const collectCategories = (recipes = [], customCategories = []) => {
  const recipeCategories = recipes.map((recipe) => recipe.category);
  const savedCategories = customCategories.map((category) => category.name);

  return [...new Set([...recipeCategories, ...savedCategories].filter(Boolean))].sort();
};

export const filterRecipes = (recipes = [], searchTerm = "", selectedCategory = "", onlyFavorites = false) => {
  const term = searchTerm.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    const matchesFavorite = !onlyFavorites || recipe.favorite;
    const searchableText = [
      recipe.name,
      recipe.description,
      recipe.category,
      recipe.ingredients,
      recipe.steps,
      recipe.ownerName
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesCategory && matchesFavorite && (!term || searchableText.includes(term));
  });
};
