import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCategory,
  createRecipe,
  deleteRecipeById,
  getCategories,
  getRecipes,
  updateRecipe
} from "./recipeApi";

const jsonResponse = (body, ok = true) => ({
  ok,
  json: () => Promise.resolve(body)
});

describe("recipeApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads recipes for the selected owner", async () => {
    fetch.mockResolvedValueOnce(jsonResponse([{ id: 1, name: "Pasta" }]));

    const result = await getRecipes("Familie");

    expect(result).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/recipes?owner=Familie");
  });

  it("creates a recipe with JSON payload", async () => {
    const payload = { name: "Pizza", ownerName: "Simar" };
    fetch.mockResolvedValueOnce(jsonResponse({ id: 3, ...payload }));

    const result = await createRecipe(payload);

    expect(result.id).toBe(3);
    expect(fetch).toHaveBeenCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/recipes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload)
      })
    );
  });

  it("updates a recipe by id", async () => {
    const payload = { name: "Pasta Napoli", ownerName: "Simar" };
    fetch.mockResolvedValueOnce(jsonResponse({ id: 1, ...payload }));

    await updateRecipe(1, payload);

    expect(fetch).toHaveBeenCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/recipes/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(payload)
      })
    );
  });

  it("deletes a recipe by id", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}));

    await deleteRecipeById(7);

    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/recipes/7", {
      method: "DELETE"
    });
  });

  it("loads categories for the selected owner", async () => {
    fetch.mockResolvedValueOnce(jsonResponse([{ id: 2, name: "Dessert" }]));

    const result = await getCategories("Dozent");

    expect(result[0].name).toBe("Dessert");
    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/categories?owner=Dozent");
  });

  it("creates a category with JSON payload", async () => {
    const payload = { name: "Meal Prep", ownerName: "Simar" };
    fetch.mockResolvedValueOnce(jsonResponse({ id: 9, ...payload }));

    await createCategory(payload);

    expect(fetch).toHaveBeenCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/categories",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload)
      })
    );
  });
});
