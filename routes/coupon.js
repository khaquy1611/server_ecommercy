const router = require("express").Router();
const couponController = require("../controllers/coupon");
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");

router.post(
  "/create",
  [verifyAccessToken, allowedTo("user")],
  couponController.createNewCoupon
);

router.get(
    "/all",
    [verifyAccessToken, allowedTo("user")],
    couponController.getCoupons
);

router.put("/update/:cid", [verifyAccessToken], couponController.updateCoupon)
router.delete("/delete/:cid", [verifyAccessToken], couponController.deleteCoupon)
module.exports = router;
