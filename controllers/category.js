const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const { categorySchema } = require("../helpers/validator_schema");
const { PAGE } = require("../const/index");
const { CURRENT_PAGE, LIMITS_PAGE } = require("../const/const");
// CREATE Category
const createCategories = asyncHandler(async (req, res) => {
  const result = await categorySchema.validateAsync(req.body);
  if (Object.keys(req.body).length === 0) throw new Error("Missing Input");
  if (result && result.name) result.slug = slugify(result.name);
  const newCategories = await Category.create(result);
  return res.status(200).json({
    success: newCategories ? true : false,
    categoriesData: newCategories ? newCategories : "Cannot create categories",
  });
});

// GET Category
const getCategories = asyncHandler(async (req, res) => {
  const queries = { ...req.query };
  // Tách các trường đặc biệt ra khỏi query
  const excludeFields = ["limit", "sort", "page", "fields"];
  excludeFields.forEach((el) => delete queries[el]);
  // Format lại các operators cho đúng cú pháp mongoose
  let queryString = JSON.stringify(queries);
  queryString = queryString.replace(
    /\b(gte|gt|lte|lt)\b/g,
    (match) => `$${match}`
  );
  const forMatedQueries = JSON.parse(queryString);

  /**
   * Filtering
   *
   */
  if (queries?.name)
    forMatedQueries.name = { $regex: queries.name, $options: "i" };
  let queryCommand = Category.find(forMatedQueries);

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = queryCommand.sort(sortBy);
  } else {
    query = queryCommand.sort("-createdAt");
  }

  // Field Limiting

  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  } else {
    query = query.select("-__v");
  }

  // Pagination
  // limit: số object lấy về sau 1 lần gọi API
  const page = +req.query.page * 1 || PAGE[CURRENT_PAGE];
  const limit = +req.query.limit * 1 || PAGE[LIMITS_PAGE];
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Execute query
  // Số lượng category thỏa mãn điều kiện !== số lượng category trả về 1 lần gọi API
  queryCommand.exec(async (err, category) => {
    if (err) throw new Error(err.message);
    const counts = await Category.find(forMatedQueries).countDocuments();
    return res.status(200).json({
      success: category ? true : false,
      categoriesData: category ? category : "Cannot get list categories",
      total: counts,
    });
  });
});

// DELETE CATEGORIES
const deleteCategories = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedCategories = await Category.findByIdAndDelete(id);
  return res.status(200).json({
    success: deletedCategories ? true : false,
    deletedCategories: deletedCategories
      ? deletedCategories
      : "Cannot delete categories",
  });
});

// UPDATE CATEGORIES
const updateCategories = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.body && req.body.name) req.body.slug = slugify(req.body.name);
  const updatedCategories = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updatedCategories ? true : false,
    updatedCategories: updatedCategories
      ? updatedCategories
      : "Cannot update categories",
  });
});

module.exports = {
  createCategories,
  getCategories,
  deleteCategories,
  updateCategories,
};
