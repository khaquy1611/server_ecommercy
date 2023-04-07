const Product = require("../models/product");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const {
  productSchema,
  productRatingsSchema,
} = require("../helpers/validator_schema");
const { PAGE } = require("../const");
const { CURRENT_PAGE, LIMITS_PAGE } = require("../const/const");

// CREATE PRODUCT
const createProduct = asyncHandler(async (req, res) => {
  const result = await productSchema.validateAsync(req.body);
  if (Object.keys(req.body).length === 0) throw new Error("Missing Input");
  if (result && result.title) result.slug = slugify(result.title);
  const newProduct = await Product.create(result);
  return res.status(200).json({
    success: newProduct ? true : false,
    product: newProduct ? newProduct : "Cannot create new product",
  });
});

// GET ONE PRODUCT
const getProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const product = await Product.findById(pid);
  return res.status(200).json({
    success: product ? true : false,
    productData: product ? product : "Cannot get product",
  });
});

// GET PRODUCT Filtering, sorting & pagination
const getProducts = asyncHandler(async (req, res) => {
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
  let queryCommand = Product.find(forMatedQueries);

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
  queryCommand.exec(async (err, product) => {
    if (err) throw new Error(err.message);
    const counts = await Product.find(forMatedQueries).countDocuments();
    return res.status(200).json({
      success: product ? true : false,
      productData: product ? product : "Cannot get products",
      total: counts,
    });
  });
});

// UPDATE PRODUCT
const updateProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (req.body && req.body.title) req.body.slug = slugify(req.body.title);
  const updatedProduct = await Product.findByIdAndUpdate(pid, req.body, {
    new: true,
  });
  return res.status(200).json({
    success: updatedProduct ? true : false,
    updatedProduct: updatedProduct ? updatedProduct : "Cannot update product",
  });
});

// DELETE PRODUCT

const deleteProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const deletedProduct = await Product.findByIdAndDelete(pid);
  return res.status(200).json({
    success: deletedProduct ? true : false,
    deletedProduct: deletedProduct ? deletedProduct : "Cannot delete product",
  });
});

const ratings = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, comment, pid } = req.body;
  if (!star || !comment || !pid) throw new "Missing Inputs"();
  const product = await Product.findById(pid);
  const alreadyRated = product?.ratings?.find(
    (userId) => userId.postedBy.toString() === _id.toString()
  );
  if (alreadyRated) {
    // update star & comment
    await Product.updateOne(
      {
        ratings: { $elemMatch: alreadyRated },
      },
      {
        $set: { "ratings.$.star": star, "ratings.$.comment": comment },
      }
    );
  } else {
    // add star & comment
    await Product.findByIdAndUpdate(
      pid,
      {
        $push: { ratings: { star, comment, postedBy: _id } },
      },
      { new: true }
    );
  }
  // Sum Ratings
  const updatedProduct = await Product.findById(pid);
  const ratingsCount = updatedProduct.ratings.length;
  const sumRatings = updatedProduct.ratings.reduce(
    (sum, el) => sum + +el.star,
    0
  );
  updatedProduct.totalRatings =
    Math.round((sumRatings * 10) / ratingsCount) / 10;

  await updatedProduct.save();

  return res.status(200).json({
    status: true,
    updatedProduct,
  });
});

// UPLOAD MULTIPLE FILE IMAGES
const uploadImagesProduct = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  if (!req.files) throw new Error("Missing inputs");
  const response = await Product.findByIdAndUpdate(
    pid,
    { $push: { images: req.files.map((el) => el.path) } },
    { new: true }
  );
  return res.status(200).json({
    status: response ? true : false,
    updatedProduct: response ? response : "Cannot upload images product",
  });
});

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  ratings,
  uploadImagesProduct,
};
