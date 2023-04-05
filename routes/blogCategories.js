const router = require("express").Router();
const blogCategoriesController = require("../controllers/blogCategory");
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");

router.post(
  "/create",
  [verifyAccessToken, allowedTo("user")],
  blogCategoriesController.createBlogCategories
);
router.get("/all", blogCategoriesController.getBlogCategories);
router.put(
  "/update/:id",
  [verifyAccessToken, allowedTo("user")],
  blogCategoriesController.updatedBlogCategories
);
router.delete(
  "/delete/:id",
  [verifyAccessToken],
  blogCategoriesController.deleteBlogCategories
);

module.exports = router;
