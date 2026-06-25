import { describe, expect, it } from "vitest";
import { collectCategories, filterRecipes } from "./recipeFilters";

const recipes = [
  {
    name: "Pasta",
    description: "Schnelles Abendessen",
    category: "Hauptgericht",
    ingredients: "Nudeln, Tomaten",
    steps: "Kochen",
    ownerName: "Simar",
    favorite: false
  },
  {
    name: "Apfelkuchen",
    description: "Süßer Kuchen",
    category: "Dessert",
    ingredients: "Äpfel, Mehl",
    steps: "Backen",
    ownerName: "Mina",
    favorite: true
  }
];

describe("recipeFilters", () => {
  it("filters recipes by search text across multiple fields", () => {
    expect(filterRecipes(recipes, "tomaten", "")).toHaveLength(1);
    expect(filterRecipes(recipes, "tomaten", "")[0].name).toBe("Pasta");
  });

  it("filters recipes by selected category", () => {
    expect(filterRecipes(recipes, "", "Dessert")).toEqual([recipes[1]]);
  });

  it("combines search text and category filter", () => {
    expect(filterRecipes(recipes, "kuchen", "Hauptgericht")).toEqual([]);
  });

  it("filters only favorite recipes when requested", () => {
    expect(filterRecipes(recipes, "", "", true)).toEqual([recipes[1]]);
  });

  it("collects categories from recipes and custom categories without duplicates", () => {
    const customCategories = [{ name: "Meal Prep" }, { name: "Dessert" }];

    expect(collectCategories(recipes, customCategories)).toEqual(["Dessert", "Hauptgericht", "Meal Prep"]);
  });
});
