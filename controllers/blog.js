const Blog = require("../models/blog");
const asyncHandler = require("express-async-handler");
const { PAGE } = require("../const/index.js");
const { CURRENT_PAGE, LIMITS_PAGE } = require("../const/const");
// CREATE BLOG
const createNewBlog = asyncHandler(async (req, res) => {
  const { name, description, category } = req.body;
  if (!name || !description || !category) throw new Error("Missing Inputs");
  const response = await Blog.create(req.body);
  return res.json({
    success: response ? true : false,
    createdBlog: response ? response : "Cannot create blog",
  });
});

// UPDATE BLOG
const updateBlog = asyncHandler(async (req, res) => {
  const { bid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  const response = await Blog.findByIdAndUpdate(bid, req.body, {
    new: true,
  });
  return res.json({
    success: response ? true : false,
    createBlog: response ? response : "Cannot updated new Blog",
  });
});

// GET BLOG
const getBlogs = asyncHandler(async (req, res) => {
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
  let queryCommand = Blog.find(forMatedQueries).select("name _id");

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
  queryCommand.exec(async (err, blog) => {
    if (err) throw new Error(err.message);
    const counts = await Blog.find(forMatedQueries).countDocuments();
    return res.status(200).json({
      success: blog ? true : false,
      blogData: blog ? blog : "Cannot get list blog",
      total: counts,
    });
  });
});

// LIKE AND DISLIKE BLOG
const likeBlog = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { bid } = req.body;
  if (!bid) throw new Error("Missing Inputs");
  const blog = await Blog.findById(bid);
  const alreadyDisliked = blog?.dislikes?.find(
    (el) => el.toString() === _id.toString()
  );
  if (alreadyDisliked) {
    const response = await Blog.findByIdAndUpdate(
      bid,
      {
        $pull: { dislikes: _id },
        isDisliked: false,
      },
      { new: true }
    );
    return res.json({
        success: response ? true : false,
        result: response 
    });
  }
  const isLiked = blog?.isLiked
  if (isLiked) {
    const response = await Blog.findByIdAndUpdate(bid, {
        $pull: { likes: _id },
        isLiked: false },
        { new: true }
    );
    return res.json({
        success: response ? true : false,
        result: response
    });
  } else {
    const response = await Blog.findByIdAndUpdate(bid, {
        $push: { likes: _id }, 
        isLiked: true
    }, { new : true });
    return res.json({
        success: response ? true : false,
        result: response
    });
  }
});

module.exports = {
  createNewBlog,
  updateBlog,
  getBlogs,
  likeBlog
};
