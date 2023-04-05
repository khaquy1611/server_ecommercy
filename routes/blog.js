const router = require("express").Router();
const blogController = require("../controllers/blog");
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");

router.post(
  "/create",
  [verifyAccessToken, allowedTo("user")],
  blogController.createNewBlog
);

router.put(
  "/update/:bid",
  [verifyAccessToken, allowedTo("user")],
  blogController.updateBlog
);

router.get("/all", blogController.getBlogs);
router.put("/like", [verifyAccessToken], blogController.likeBlog);
module.exports = router;
