const router = require("express").Router();
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");
const orderController = require("../controllers/order");

router.post(
  "/create",
  [verifyAccessToken, allowedTo("user")],
  orderController.createOrder
);
router.put(
  "/status/:id",
  [verifyAccessToken, allowedTo("user")],
  orderController.updateStatusOrder
);

router.get("/all", [verifyAccessToken], orderController.getUserOrder);
router.get("/admin", [verifyAccessToken, allowedTo("user")], orderController.getOrders);
module.exports = router;
