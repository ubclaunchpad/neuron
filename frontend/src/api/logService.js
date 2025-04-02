import api from "./api";

export const getLogHistory = (page, perPage, search) =>
  api
    .get("logs", {
      params: {
        page,
        perPage,
        q: search,
      },
    })
    .then((response) => response.data)
    .catch((error) => {
      console.error(error);
    });
