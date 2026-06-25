import { mount, flushPromises } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecipeList from "./RecipeList.vue";

const recipes = [
  {
    id: 1,
    name: "Pasta",
    description: "Schnelles Abendessen",
    category: "Hauptgericht",
    preparationTime: 25,
    ingredients: "Nudeln, Tomaten",
    steps: "Kochen und servieren",
    ownerName: "Simar"
  },
  {
    id: 2,
    name: "Apfelkuchen",
    description: "Süßer Kuchen",
    category: "Dessert",
    preparationTime: 60,
    ingredients: "Äpfel, Mehl",
    steps: "Backen",
    ownerName: "Simar"
  }
];

const categories = [
  {
    id: 10,
    name: "Meal Prep",
    ownerName: "Simar"
  }
];

const jsonResponse = (body, ok = true) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(body)
  });

const installApiMock = ({ loadedRecipes = recipes, loadedCategories = categories } = {}) => {
  global.fetch = vi.fn((url, options = {}) => {
    const method = options.method || "GET";
    const requestUrl = String(url);

    if (method === "GET" && requestUrl.includes("/recipes")) {
      return jsonResponse(loadedRecipes);
    }

    if (method === "GET" && requestUrl.includes("/categories")) {
      return jsonResponse(loadedCategories);
    }

    if (method === "POST" && requestUrl.includes("/recipes")) {
      return jsonResponse({ id: 3, ...JSON.parse(options.body) });
    }

    if (method === "PUT" && requestUrl.includes("/recipes/1")) {
      return jsonResponse({ id: 1, ...JSON.parse(options.body) });
    }

    if (method === "POST" && requestUrl.includes("/categories")) {
      return jsonResponse({ id: 11, ...JSON.parse(options.body) });
    }

    if (method === "DELETE") {
      return jsonResponse({}, true);
    }

    return jsonResponse({}, false);
  });
};

const mountWithApi = async (options) => {
  installApiMock(options);
  const wrapper = mount(RecipeList);
  await flushPromises();
  return wrapper;
};

const clickTab = async (wrapper, label) => {
  const button = wrapper.findAll(".section-tabs button").find((tabButton) => tabButton.text() === label);
  await button.trigger("click");
};

describe("RecipeList", () => {
  beforeEach(() => {
    installApiMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads recipes and categories for the active user when mounted", async () => {
    await mountWithApi();

    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/recipes?owner=Simar");
    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/categories?owner=Simar");
  });

  it("renders loaded recipe names and details", async () => {
    const wrapper = await mountWithApi();

    expect(wrapper.text()).toContain("Pasta");
    expect(wrapper.text()).toContain("Schnelles Abendessen");
    expect(wrapper.text()).toContain("Nudeln, Tomaten");
  });

  it("reloads user-specific data when the active user changes", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find(".user-switch select").setValue("Familie");
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/recipes?owner=Familie");
    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/categories?owner=Familie");
  });

  it("selects a recipe and shows its detail view", async () => {
    const wrapper = await mountWithApi();

    await wrapper.findAll(".recipe-row")[1].trigger("click");

    expect(wrapper.find(".recipe-detail").text()).toContain("Apfelkuchen");
    expect(wrapper.find(".recipe-detail").text()).toContain("Backen");
  });

  it("filters recipes by search term", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find('input[type="search"]').setValue("Apfel");

    expect(wrapper.find(".recipe-list").text()).toContain("Apfelkuchen");
    expect(wrapper.find(".recipe-list").text()).not.toContain("Pasta");
  });

  it("filters recipes by category", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find(".toolbar select").setValue("Dessert");

    expect(wrapper.find(".recipe-list").text()).toContain("Apfelkuchen");
    expect(wrapper.find(".recipe-list").text()).not.toContain("Pasta");
  });

  it("shows custom categories in the category filter", async () => {
    const wrapper = await mountWithApi();

    expect(wrapper.find(".toolbar select").text()).toContain("Meal Prep");
  });

  it("does not submit an empty recipe name", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("Bitte gib einen Rezeptnamen ein.");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("creates a recipe with all form fields and the active owner", async () => {
    const wrapper = await mountWithApi({ loadedRecipes: [] });

    await wrapper.find('input[placeholder="z. B. Pizza Margherita"]').setValue("Pizza");
    await wrapper.find("textarea").setValue("Klassiker");
    await wrapper.find('input[placeholder="z. B. Hauptgericht"]').setValue("Hauptgericht");
    await wrapper.find('input[type="number"]').setValue(30);
    await wrapper.findAll("textarea")[1].setValue("Mehl, Tomaten");
    await wrapper.findAll("textarea")[2].setValue("Backen");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/recipes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Pizza",
          description: "Klassiker",
          category: "Hauptgericht",
          preparationTime: 30,
          ingredients: "Mehl, Tomaten",
          steps: "Backen",
          ownerName: "Simar"
        })
      })
    );
  });

  it("starts editing a selected recipe", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find(".recipe-detail .actions button").trigger("click");

    expect(wrapper.find(".recipe-form h3").text()).toBe("Rezept bearbeiten");
    expect(wrapper.find('input[placeholder="z. B. Pizza Margherita"]').element.value).toBe("Pasta");
  });

  it("updates an existing recipe", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find(".recipe-detail .actions button").trigger("click");
    await wrapper.find('input[placeholder="z. B. Pizza Margherita"]').setValue("Pasta Napoli");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/recipes/1",
      expect.objectContaining({
        method: "PUT"
      })
    );
    expect(wrapper.text()).toContain("Pasta Napoli");
  });

  it("deletes the selected recipe", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find(".danger-button").trigger("click");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith("https://myrecipes-backend-dew0.onrender.com/recipes/1", {
      method: "DELETE"
    });
    expect(wrapper.find(".recipe-list").text()).not.toContain("Pasta");
  });

  it("creates a category in the category section", async () => {
    const wrapper = await mountWithApi();

    await clickTab(wrapper, "Kategorien");
    await wrapper.find('input[placeholder="z. B. Meal Prep"]').setValue("Frühstück");
    await wrapper.find(".category-form").trigger("submit.prevent");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/categories",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Frühstück",
          ownerName: "Simar"
        })
      })
    );
    expect(wrapper.text()).toContain("Frühstück");
  });
});
