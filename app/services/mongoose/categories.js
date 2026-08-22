const Categories = require("../../api/v1/categories/model");

const getAllCategories = async () => {
  const result = await Categories.find();

  return result;
};

module.exports = { getAllCategories };
