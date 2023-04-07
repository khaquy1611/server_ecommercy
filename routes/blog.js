const router = require("express").Router();
const blogController = require("../controllers/blog");
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");
const uploader = require("../config/cloudinary.config");

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
router.put("/like/:bid", [verifyAccessToken], blogController.likeBlog);
router.put("/dislike/:bid", [verifyAccessToken], blogController.dislikedBlog);
router.get("/:bid", [verifyAccessToken], blogController.getBlog);
router.delete("/delete/:bid", [verifyAccessToken], blogController.deleteBlog);
router.put(
  "/uploadImage/:bid",
  [verifyAccessToken, allowedTo("user")],
  uploader.single('image'),
  blogController.uploadImagesBlog
);
module.exports = router;
