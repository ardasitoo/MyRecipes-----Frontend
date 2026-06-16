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
    steps: "Kochen und servieren"
  },
  {
    id: 2,
    name: "Apfelkuchen",
    description: "Süßer Kuchen",
    category: "Dessert",
    preparationTime: 60,
    ingredients: "Äpfel, Mehl",
    steps: "Backen"
  }
];

const jsonResponse = (body, ok = true) =>
  Promise.resolve({
    ok,
    json: () => Promise.resolve(body)
  });

const mountWithFetch = async (response = jsonResponse(recipes)) => {
  fetch.mockResolvedValueOnce(response);
  const wrapper = mount(RecipeList);
  await flushPromises();
  return wrapper;
};

describe("RecipeList", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads recipes when the component is mounted", async () => {
    await mountWithFetch();

    expect(fetch).toHaveBeenCalledWith("https://myrecipes-backend-dew0.onrender.com/recipes");
  });

  it("renders loaded recipe names and details", async () => {
    const wrapper = await mountWithFetch();

    expect(wrapper.text()).toContain("Pasta");
    expect(wrapper.text()).toContain("Schnelles Abendessen");
    expect(wrapper.text()).toContain("Nudeln, Tomaten");
  });

  it("selects a recipe and shows its detail view", async () => {
    const wrapper = await mountWithFetch();

    await wrapper.findAll(".recipe-row")[1].trigger("click");

    expect(wrapper.find(".recipe-detail").text()).toContain("Apfelkuchen");
    expect(wrapper.find(".recipe-detail").text()).toContain("Backen");
  });

  it("filters recipes by search term", async () => {
    const wrapper = await mountWithFetch();

    await wrapper.find('input[type="search"]').setValue("Apfel");

    expect(wrapper.find(".recipe-list").text()).toContain("Apfelkuchen");
    expect(wrapper.find(".recipe-list").text()).not.toContain("Pasta");
  });

  it("filters recipes by category", async () => {
    const wrapper = await mountWithFetch();

    await wrapper.find("select").setValue("Dessert");

    expect(wrapper.find(".recipe-list").text()).toContain("Apfelkuchen");
    expect(wrapper.find(".recipe-list").text()).not.toContain("Pasta");
  });

  it("does not submit an empty recipe name", async () => {
    const wrapper = await mountWithFetch();

    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.text()).toContain("Bitte gib einen Rezeptnamen ein.");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("creates a recipe with all form fields", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ ...recipes[0], id: 3, name: "Pizza" }));
    const wrapper = mount(RecipeList);
    await flushPromises();

    const inputs = wrapper.findAll("input");
    await inputs[1].setValue("Pizza");
    await wrapper.find("textarea").setValue("Klassiker");
    await inputs[2].setValue("Hauptgericht");
    await inputs[3].setValue(30);
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
          steps: "Backen"
        })
      })
    );
  });

  it("starts editing a selected recipe", async () => {
    const wrapper = await mountWithFetch();

    await wrapper.find(".recipe-detail .actions button").trigger("click");

    expect(wrapper.find(".recipe-form h3").text()).toBe("Rezept bearbeiten");
    expect(wrapper.findAll("input")[1].element.value).toBe("Pasta");
  });

  it("updates an existing recipe", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse(recipes))
      .mockResolvedValueOnce(jsonResponse({ ...recipes[0], name: "Pasta Napoli" }));
    const wrapper = mount(RecipeList);
    await flushPromises();

    await wrapper.find(".recipe-detail .actions button").trigger("click");
    await wrapper.findAll("input")[1].setValue("Pasta Napoli");
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
    fetch.mockResolvedValueOnce(jsonResponse(recipes)).mockResolvedValueOnce(Promise.resolve({ ok: true }));
    const wrapper = mount(RecipeList);
    await flushPromises();

    await wrapper.find(".danger-button").trigger("click");
    await flushPromises();

    expect(fetch).toHaveBeenLastCalledWith("https://myrecipes-backend-dew0.onrender.com/recipes/1", {
      method: "DELETE"
    });
    expect(wrapper.find(".recipe-list").text()).not.toContain("Pasta");
  });
});
