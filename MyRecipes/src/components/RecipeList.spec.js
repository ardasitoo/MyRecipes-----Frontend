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
    ownerName: "Simar",
    favorite: false
  },
  {
    id: 2,
    name: "Apfelkuchen",
    description: "Süßer Kuchen",
    category: "Dessert",
    preparationTime: 60,
    ingredients: "Äpfel, Mehl",
    steps: "Backen",
    ownerName: "Simar",
    favorite: true
  }
];

const categories = [
  {
    id: 10,
    name: "Meal Prep",
    ownerName: "Simar"
  }
];

const users = [{ name: "Simar" }, { name: "Familie" }, { name: "Dozent" }];

const jsonResponse = (body, ok = true) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(body)
  });

const installApiMock = ({ loadedRecipes = recipes, loadedCategories = categories, loadedUsers = users } = {}) => {
  global.fetch = vi.fn((url, options = {}) => {
    const method = options.method || "GET";
    const requestUrl = String(url);

    if (method === "GET" && requestUrl.includes("/recipes")) {
      return jsonResponse(loadedRecipes);
    }

    if (method === "GET" && requestUrl.includes("/categories")) {
      return jsonResponse(loadedCategories);
    }

    if (method === "GET" && requestUrl.includes("/users")) {
      return jsonResponse(loadedUsers);
    }

    if (method === "POST" && requestUrl.includes("/share")) {
      return jsonResponse({ id: 4, ...recipes[0], ownerName: JSON.parse(options.body).ownerName, favorite: false });
    }

    if (method === "POST" && requestUrl.endsWith("/recipes")) {
      return jsonResponse({ id: 3, ...JSON.parse(options.body) });
    }

    if (method === "PUT" && requestUrl.includes("/recipes/1")) {
      return jsonResponse({ id: 1, ...JSON.parse(options.body) });
    }

    if (method === "POST" && requestUrl.includes("/categories")) {
      return jsonResponse({ id: 11, ...JSON.parse(options.body) });
    }

    if (method === "POST" && requestUrl.includes("/users")) {
      return jsonResponse({ id: 12, ...JSON.parse(options.body) });
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

const clickDetailAction = async (wrapper, label) => {
  const button = wrapper.findAll(".recipe-detail .actions button").find((actionButton) => actionButton.text() === label);
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
    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/users");
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

  it("filters recipes by favorites", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find('.checkbox-label input[type="checkbox"]').setValue(true);

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
    expect(fetch).toHaveBeenCalledTimes(3);
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
          ownerName: "Simar",
          favorite: false
        })
      })
    );
  });

  it("starts editing a selected recipe", async () => {
    const wrapper = await mountWithApi();

    await clickDetailAction(wrapper, "Bearbeiten");

    expect(wrapper.find(".recipe-form h3").text()).toBe("Rezept bearbeiten");
    expect(wrapper.find('input[placeholder="z. B. Pizza Margherita"]').element.value).toBe("Pasta");
  });

  it("updates an existing recipe", async () => {
    const wrapper = await mountWithApi();

    await clickDetailAction(wrapper, "Bearbeiten");
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

  it("marks the selected recipe as favorite", async () => {
    const wrapper = await mountWithApi();

    await wrapper.findAll(".recipe-detail .actions button")[0].trigger("click");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/recipes/1",
      expect.objectContaining({
        method: "PUT",
        body: expect.stringContaining('"favorite":true')
      })
    );
    expect(wrapper.find(".recipe-detail").text()).toContain("Favorit");
  });

  it("shares the selected recipe with another user", async () => {
    const wrapper = await mountWithApi();

    await wrapper.find(".share-panel select").setValue("Familie");
    await wrapper.find(".share-panel button").trigger("click");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/recipes/1/share",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ownerName: "Familie"
        })
      })
    );
    expect(wrapper.text()).toContain("Rezept wurde als Kopie an Familie weitergegeben.");
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

  it("creates a user in the users section", async () => {
    const wrapper = await mountWithApi();

    await clickTab(wrapper, "Benutzer");
    await wrapper.find('input[placeholder="z. B. Mina"]').setValue("Mina");
    await wrapper.find(".category-form").trigger("submit.prevent");
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith(
      "https://myrecipes-backend-dew0.onrender.com/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Mina"
        })
      })
    );
    expect(wrapper.find(".user-switch select").element.value).toBe("Mina");
  });
});
