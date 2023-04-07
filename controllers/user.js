const User = require("../models/user.js");
const UserVerification = require("./../models/userVerification");
const asyncHandler = require("express-async-handler");
const createError = require("http-errors");
const { registerSchema } = require("../helpers/validator_schema");
const { sendEmailActive } = require("../utils/email");
const crypto = require("crypto");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../middleware/jwt.js");
const jwt = require("jsonwebtoken");
// user register
const register = asyncHandler(async (req, res) => {
  let { email, password, firstName, lastName, phone } = req.body;
  const result = await registerSchema.validateAsync(req.body);
  const doesExist = await User.findOne({
    email: result.email,
  });
  if (doesExist) {
    throw createError.Conflict(`${email} is already been registered`);
  }
  if (!email || !password || !lastName || !firstName || !phone) {
    return res.status(400).json({
      success: false,
      msg: "Missing Inputs",
    });
  } else if (!/^[a-zA-Z]*$/.test(firstName)) {
    res.json({
      success: false,
      msg: "Invalid firstName entered",
    });
  } else if (!/^[a-zA-Z]*$/.test(lastName)) {
    res.json({
      success: false,
      msg: "Invalid lastName entered",
    });
  } else {
    const user = await User.create(result);
    const userVerification = new UserVerification({
      userId: user._id,
      token: crypto.randomBytes(16).toString("hex"),
    });
    await userVerification.save();
    const link = `${process.env.BASE_URL}/api/users/verify/${userVerification.userId}/${userVerification.token}`;
    await sendEmailActive(user.email, "verify email", link);
    return res.status(200).json({
      success: true,
      msg: `Email send please check yours email`,
    });
  }
});

// user confirm email
const confirmEmail = asyncHandler(async (req, res) => {
  const { id, token } = req.params;
  const user = await User.findOne({
    _id: id,
  });
  if (!user) return res.status(400).json("Invalid link");
  const userConfirm = UserVerification.findOne({
    userId: user._id,
    token: token,
  });
  if (!userConfirm) return res.status(400).json("Invalid link");
  await User.updateOne(
    {
      _id: user._id,
    },
    {
      $set: {
        verified: true,
      },
    }
  );
  await UserVerification.findByIdAndRemove(userConfirm._id);
  res.status(200).json({
    success: true,
    msg: `Email verify successfully`,
  });
});

// Refresh token => cấp mới access token
// Access token => xác thực người dùng, phân quyền người dùng
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({
      success: false,
      mes: "Missing inputs",
    });
  // plain object
  const response = await User.findOne({ email });
  if (response && (await response.isCorrectPassword(password))) {
    // Tách password và role ra khỏi response
    const { password, role, refreshToken, ...userData } = response.toObject();
    // Tạo access token
    const accessToken = generateAccessToken(response._id, role);
    // Tạo refresh token
    const newRefreshToken = generateRefreshToken(response._id);
    // Lưu refresh token vào database
    await User.findByIdAndUpdate(
      response._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );
    const user = await User.findById(response._id);
    // Lưu refresh token vào cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    if (!user.verified) {
      let token = await UserVerification.findOne({
        userId: user._id,
      });
      if (!token) {
        token = await new UserVerification({
          userId: user._id,
          token: crypto.randomBytes(16).toString("hex"),
        }).save();
        const link = `${process.BASE_URL}/api/users/confirm/${token.userId}/${token.token}`;
        await sendEmailActive(user.email, "verify email", link);
      }
    }

    return res.status(200).json({
      success: true,
      accessToken,
      userData,
    });
  } else {
    throw new Error("Invalid credentials!");
  }
});

// GET INFO USER CURRENT
const getUserCurrent = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select("-refreshToken -password -role");
  return res.status(200).json({
    success: user ? true : false,
    userData: user ? user : "No data found",
    msg: user ? "Get All User Success" : "Get All User Failure",
  });
});

// GET ALL USER LIST
const getAllUser = asyncHandler(async (req, res) => {
  const user = await User.find({});
  return res.status(200).json({
    success: user ? true : false,
    userData: user ? user : "No data found",
    msg: user ? "Get all user Success" : "Get all user failure",
  });
});

// GET DETAIL INFO USER
const getDetailsUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({
      success: false,
      msg: "The userId is required",
    });
  const user = await User.findById(id);
  return res.status(200).json({
    success: user ? true : false,
    userData: user ? user : "No data found",
    msg: user ? "Get detail user success" : "Get detail user failure",
  });
});

// GENERATE REFRESH TOKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Lấy token từ cookies
  const cookie = req.cookies;
  // Check xem có token hay không
  if (!cookie && !cookie.refreshToken)
    throw new Error("No refresh token in cookies");
  // Check token có hợp lệ hay không
  const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
  const response = await User.findOne({
    _id: rs.id,
    refreshToken: cookie.refreshToken,
  });
  return res.status(200).json({
    success: response ? true : false,
    newAccessToken: response
      ? generateAccessToken(response._id, response.role)
      : "Refresh token not matched",
  });
});

// Logout
const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken)
    throw new Error("No refresh token in cookies");

  // Xóa refresh token ở db
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: "" },
    { new: true }
  );
  // Xóa refresh token ở cookie trình duyệt
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  return res.status(200).json({
    success: true,
    msg: "Logout is success",
  });
});

// Client gửi email
// Server check email có hợp lệ hay không => Gửi mail + kèm theo link (password change token)
// Client gửi api kèm token
// Check token có giống với token mà server gửi mail không
// Change password

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new Error("Missing email");
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  const resetToken = user.createPasswordChangedToken();
  await user.save();

  const link = `${process.BASE_URL}/api/users/reset-password/${resetToken}`;
  const rs = await sendEmailActive(user.email, "verify email", link);
  return res.status(200).json({
    success: true,
    rs,
  });
});
const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword, token, confirmPassWord } = req.body;
  if (!newPassword || !token) throw new Error("Missing imputs", 400);
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error("Invalid reset token");
  if (newPassword !== confirmPassWord)
    throw new Error("PassWord Not Match", 400);
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordChangeAt = Date.now();
  user.passwordResetExpires = undefined;
  await user.save();
  return res.status(200).json({
    success: user ? true : false,
    mes: user ? "Updated password" : "Something went wrong",
  });
});

// DELETE USER
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.query;
  if (!id) throw new Error("Missing Inputs");
  const response = await User.findByIdAndDelete(id);
  return res.status(200).json({
    success: response ? true : false,
    msg: response
      ? `User with email ${response.email} deleted successfully`
      : `No user deleted`,
  });
});

// UPDATE USER
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.query;
  const result = await registerSchema.validateAsync(req.body);
  if (!id || Object.keys(result).length === 0)
    throw new Error("Missing Inputs");
  const response = await User.findByIdAndUpdate(id, result, {
    new: true,
  }).select("-password -role -refreshToken");
  return res.status(200).json({
    success: response ? true : false,
    updateUserData: response ? response : "Some thing went wrong",
  });
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error("Missing Inputs");
  const response = await User.findByIdAndUpdate(uid, req.body, {
    new: true,
  }).select("-password -role -refreshToken");
  return res.status(200).json({
    success: response ? true : false,
    updateUser: response ? response : "Some thing went wrong",
  });
});

// UPDATE USER ADDRESS
const updateUserAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!req.body.address) throw new Error("Missing inputs");
  const response = await User.findByIdAndUpdate(
    _id,
    { $push: { address: req.body.address } },
    { new: true }
  ).select("-password -role -refreshToken");
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : "Some thing went wrong",
  });
});

const updateCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid, quantity, color } = req.body;
  if (!pid || !quantity || !color) throw new Error("Missing inputs");
  const user = await User.findById(_id).select("cart");
  const alreadyProduct = user?.cart.find((el) => el.product.toString() === pid);
  if (alreadyProduct) {
    if (alreadyProduct.color === color) {
      const response = await User.updateOne(
        { cart: { $elemMatch: alreadyProduct } },
        { $set: { "cart.$.quantity": quantity } },
        { new: true }
      );
      return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : "Some thing went wrong",
      });
    } else {
      const response = await User.findByIdAndUpdate(
        _id,
        { $push: { cart: { product: pid, quantity, color } } },
        { new: true }
      );
      return res.status(200).json({
        success: response ? true : false,
        updatedUser: response ? response : "Some thing went wrong",
      });
    }
  } else {
    const response = await User.findByIdAndUpdate(
      _id,
      { $push: { cart: { product: pid, quantity, color } } },
      { new: true }
    );
    return res.status(200).json({
      success: response ? true : false,
      updatedUser: response ? response : "Some thing went wrong",
    });
  }
});

// ADD PRODUCT TO WISHLIST
const addToWishList = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { pid } = req.body;
  if (!pid) throw new Error("Missing Inputs");
  const user = User.findById(_id);
  const alreadyAdded = user?.wishlist?.find(
    (id) => id.toString() === pid.toString()
  );
  if (alreadyAdded) {
    const user = await User.findByIdAndUpdate(
      _id,
      {
        $pull: { wishlist: pid },
      },
      { new: true }
    ).populate("wishlist", "title -category");
    return res.status(200).json({
      status: user ? true : false,
      userData: user ? user : "Cannot update product into wishlist",
    });
  } else {
    const user = await User.findByIdAndUpdate(
      _id,
      {
        $push: { wishlist: pid },
      },
      { new: true }
    ).populate("wishlist", "title -category");
    return res.status(200).json({
      status: user ? true : false,
      userData: user ? user : "Cannot update product into wishlist",
    });
  }
});


// BLOCK USER
const userBlocked = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const blockedUser = await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true });
  return res.status(200).json({
    status: blockedUser ? true : false,
    userData: blockedUser ? blockedUser : "Cannot blocked user"
  })
})

// UNBLOCK USER
const unblockedUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const unblocked = await User.findByIdAndUpdate(id , { isBlocked: false }, { new: true });
  return res.status(200).json({
    status: unblocked ? true : false,
    userData: unblocked ? unblocked : "Cannot unblocked user" 
  });
});

// GET WISHLIST 
const getWishList = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const response = await User.findById(_id).populate("wishlist");
  return res.status(200).json({
    status: response ? true : false,
    userData: response ? response : "Cannot get wishlist data"
  });
});

module.exports = {
  register,
  confirmEmail,
  login,
  getUserCurrent,
  refreshAccessToken,
  logout,
  getAllUser,
  getDetailsUser,
  forgotPassword,
  resetPassword,
  deleteUser,
  updateUser,
  updateUserByAdmin,
  updateUserAddress,
  updateCart,
  addToWishList,
  userBlocked,
  unblockedUser,
  getWishList
};
