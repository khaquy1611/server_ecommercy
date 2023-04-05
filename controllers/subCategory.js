const SubCategory = require("../models/subCategory");
const asyncHandler = require("express-async-handler");
const { subCategorySchema } = require("../helpers/validator_schema");

// CREATE SUB CATEGORY
const createSubCategory = asyncHandler(async (req, res) => {
  const result = await subCategorySchema.validateAsync(req.body);
  if (Object.keys(req.body).length === 0) throw new Error("Missing Input");
  const newSubCategories = await SubCategory.create(result);
  return res.status(200).json({
    success: newSubCategories ? true : false,
    subCategoriesData: newSubCategories
      ? newSubCategories
      : "Cannot create sub categories",
  });
});

// GET ALL SUB CATEGORY
const getSubCategory = asyncHandler(async (req, res) => {
  const subCategories = await SubCategory.find();
  return res.status(200).json({
    success: subCategories ? true : false,
    subCategoriesData: subCategories
      ? subCategories
      : "Cannot get list sub categories",
  });
});

module.exports = {
  createSubCategory,
  getSubCategory,
};
