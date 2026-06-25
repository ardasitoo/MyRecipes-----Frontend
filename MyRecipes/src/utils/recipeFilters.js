export const collectCategories = (recipes = [], customCategories = []) => {
  const recipeCategories = recipes.map((recipe) => recipe.category);
  const savedCategories = customCategories.map((category) => category.name);

  return [...new Set([...recipeCategories, ...savedCategories].filter(Boolean))].sort();
};

export const filterRecipes = (recipes = [], searchTerm = "", selectedCategory = "") => {
  const term = searchTerm.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
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

    return matchesCategory && (!term || searchableText.includes(term));
  });
};
