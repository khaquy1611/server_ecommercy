const router = require("express").Router();
const subCategoryController = require("../controllers/subCategory");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");

router.post(
  "/create",
  [verifyAccessToken],
  subCategoryController.createSubCategory
);
router.get("/all", [verifyAccessToken], subCategoryController.getSubCategory);

module.exports = router;
