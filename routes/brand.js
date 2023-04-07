const router = require("express").Router();
const brandController = require("../controllers/brand");
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");

router.post(
  "/create",
  [verifyAccessToken, allowedTo("user")],
  brandController.createBrand
);
router.get("/all", brandController.getBrand);
router.put(
  "/update/:id",
  [verifyAccessToken, allowedTo("user")],
  brandController.updatedBrand
);
router.delete(
  "/delete/:id",
  [verifyAccessToken],
  brandController.deleteBrand
);

module.exports = router;
