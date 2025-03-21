// This file groups all the API calls related to the neuron Classes page.
import api from "./api";

const getAllClasses = () =>
  api
    .get("/classes")
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });

const getAllClassImages = () =>
  api
    .get("/classes/images")
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });

const getAllClassSchedules = () =>
  api
    .get("/schedules")
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });

const getClassById = (class_id) =>
  api
    .get("/classes/" + class_id)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error(error);
    });

const addClass = (classData) =>
  api.post("/classes", classData)

const updateClass = (class_id, classData) =>
  api.put("/classes/" + class_id, classData)

const deleteClass = (class_id) => 
  api.delete("/classes/" + class_id);

const updateSchedules = (class_id, schedules) =>
  api.put("/schedules/" + class_id, schedules)

const addSchedules = (class_id, schedules) => 
  api.post("/schedules/" + class_id, schedules)

const deleteSchedules = (class_id, schedules) =>
  api.delete("/schedules/" + class_id + "/soft-option", {
    data: {
      schedule_ids: schedules,
    }
  })

const uploadClassImage = (class_id, image) =>
  api.put(`/classes/${class_id}/upload`, image, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export { 
  getAllClasses, 
  getClassById, 
  getAllClassImages, 
  getAllClassSchedules, 
  addClass,
  updateClass,
  deleteClass,
  addSchedules,
  deleteSchedules,
  updateSchedules,
  uploadClassImage
};
