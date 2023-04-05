const BlogCategory = require("../models/blogCategory");
const asyncHandler = require("express-async-handler");
const { PAGE } = require('../const/index');
const { CURRENT_PAGE, LIMITS_PAGE } = require('../const/const');

// CREATE BLOG CATEGORIES
const createBlogCategories = asyncHandler(async (req, res) => {
  const response = await BlogCategory.create(req.body);
  return res.json({
    success: response ? true : false,
    createdBlogCategories: response
      ? response
      : "Cannot create blog-categories",
  });
});

// GET BLOG CATEGORIES
const getBlogCategories = asyncHandler(async (req, res) => {
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
  if (queries?.title)
    forMatedQueries.title = { $regex: queries.title, $options: "i" };
  let queryCommand = BlogCategory.find(forMatedQueries).select("name _id");

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
  // Số lượng sp thỏa mãn điều kiện !== số lượng sp trả về 1 lần gọi API
  queryCommand.exec(async (err, blogCategories) => {
    if (err) throw new Error(err.message);
    const counts = await BlogCategory.find(forMatedQueries).countDocuments();
    return res.status(200).json({
      success: blogCategories ? true : false,
      blogCategoriesData: blogCategories ? blogCategories : "Cannot get list blog-categories",
      total: counts,
    });
  });
});

// UPDATE BLOG CATEGORIES
const updatedBlogCategories = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const response = await BlogCategory.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  return res.json({
    success: response ? true : false,
    blogCategoriesData: response
      ? response
      : "Cannot update new blog-category",
  });
});

const deleteBlogCategories = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const response = await BlogCategory.findByIdAndDelete(id);
  return res.json({
    success: response ? true : false,
    deletedBlogCategory: response
      ? response
      : "Cannot create new blog-category",
  });
});

module.exports = {
  createBlogCategories,
  getBlogCategories,
  updatedBlogCategories,
  deleteBlogCategories,
};
