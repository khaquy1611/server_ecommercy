const Coupon = require("../models/coupon");
const asyncHandler = require("express-async-handler");
const { PAGE } = require("../const/index");
const { CURRENT_PAGE, LIMITS_PAGE } = require("../const/const");

const createNewCoupon = asyncHandler(async (req, res) => {
  const { name, discount, expiry } = req.body;
  if (!name || !discount || !expiry) throw new Error("Missing inputs");
  const response = await Coupon.create({
    ...req.body,
    expiry: Date.now() + +(expiry * 24 * 60 * 60 * 1000),
  });
  return res.json({
    success: response ? true : false,
    createdCoupon: response ? response : "Cannot create new Coupon",
  });
});

// GET COUPONS
const getCoupons = asyncHandler(async (req, res) => {
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
  let queryCommand = Coupon.find(forMatedQueries).select("name _id");

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
  queryCommand.exec(async (err, coupon) => {
    if (err) throw new Error(err.message);
    const counts = await Coupon.find(forMatedQueries).countDocuments();
    return res.status(200).json({
      success: coupon ? true : false,
      couponData: coupon ? coupon : "Cannot get list coupon",
      total: counts,
    });
  });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing inputs");
  if (req.body.expiry)
    req.body.expiry = Date.now() + +expiry * 24 * 60 * 60 * 1000;
  const response = await Coupon.findByIdAndUpdate(cid, req.body, { new: true });
  return res.json({
    success: response ? true : false,
    createdCoupon: response ? response : "Cannot updated coupon",
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { cid } = req.params;
  if (req.body.expiry)
    req.body.expiry = Date.now() + +req.body.expiry * 24 * 60 * 60 * 1000;
  const response = await Coupon.findByIdAndDelete(cid);
  return res.json({
    success: response ? true : false,
    deletedCoupon: response ? response : "Cannot update coupon",
  });
});
module.exports = {
  createNewCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
};
