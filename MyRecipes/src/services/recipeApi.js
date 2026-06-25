const RECIPES_API_URL = "https://myrecipes-backend-dew0.onrender.com/recipes";
const CATEGORIES_API_URL = "https://myrecipes-backend-dew0.onrender.com/categories";

const ownerQuery = (ownerName) => `owner=${encodeURIComponent(ownerName)}`;

const parseJsonResponse = async (response, errorMessage) => {
  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
};

export const getRecipes = async (ownerName) => {
  const response = await fetch(`${RECIPES_API_URL}?${ownerQuery(ownerName)}`);
  return parseJsonResponse(response, "Fehler beim Laden der Rezepte");
};

export const createRecipe = async (payload) => {
  const response = await fetch(RECIPES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response, "Fehler beim Speichern des Rezepts");
};

export const updateRecipe = async (id, payload) => {
  const response = await fetch(`${RECIPES_API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response, "Fehler beim Speichern des Rezepts");
};

export const deleteRecipeById = async (id) => {
  const response = await fetch(`${RECIPES_API_URL}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Fehler beim Loeschen des Rezepts");
  }
};

export const getCategories = async (ownerName) => {
  const response = await fetch(`${CATEGORIES_API_URL}?${ownerQuery(ownerName)}`);
  return parseJsonResponse(response, "Fehler beim Laden der Kategorien");
};

export const createCategory = async (payload) => {
  const response = await fetch(CATEGORIES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseJsonResponse(response, "Fehler beim Speichern der Kategorie");
};

export const deleteCategoryById = async (id) => {
  const response = await fetch(`${CATEGORIES_API_URL}/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Fehler beim Loeschen der Kategorie");
  }
};
