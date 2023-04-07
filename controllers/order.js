const User = require("../models/user");
const Order = require("../models/order");
const Coupon = require("../models/coupon");
const asyncHandler = require("express-async-handler");
const { PAGE } = require("../const/index.js");
const { CURRENT_PAGE, LIMITS_PAGE } = require("../const/const");
// CREATE BLOG
const createOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { coupon } = req.body;
  const userCart = await User.findById(_id)
    .select("cart")
    .populate("cart.product", "title price");
  const products = userCart?.cart?.map((el) => ({
    product: el.product._id,
    count: el.quantity,
    color: el.color,
  }));
  let total = userCart?.cart?.reduce(
    (sum, el) => el.product.price * el.quantity + sum,
    0
  );
  const createData = { products, total, orderBy: _id };
  if (coupon) {
    const selectedCoupon = await Coupon.findById(coupon);
    total =
      Math.round((total * (1 - +selectedCoupon?.discount / 100)) / 1000) *
        1000 || total;
    createData.total = total;
    createData.coupon = coupon;
  }
  const result = await Order.create(createData);
  return res.json({
    success: result ? true : false,
    createdBlog: result ? result : "Cannot create order",
  });
});

// UPDATE STATUS ORDER
const updateStatusOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) throw new Error("Missing status");
  const response = await Order.findByIdAndUpdate(id, { status }, { new: true });
  return res.json({
    success: response ? true : false,
    response: response
      ? response
      : "Cannot update status order something went wrong",
  });
});

// GET ORDER USER
const getUserOrder = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const response = await Order.find({ orderBy: _id });
  return res.json({
    success: response ? true : false,
    response: response ? response : "Something went wrong",
  });
});

// GET ORDERS
const getOrders = asyncHandler(async (req, res) => {
  const response = await Order.find();
  return res.json({
    success: response ? true : false,
    response: response ? response : "Something went wrong",
  });
});

module.exports = {
  createOrder,
  updateStatusOrder,
  getUserOrder,
  getOrders
};
