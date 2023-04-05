const router = require("express").Router();
const categoryController = require("../controllers/category");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");

router.post("/create", [verifyAccessToken], categoryController.createCategories);
router.get("/all", [verifyAccessToken], categoryController.getCategories);
router.delete("/delete/:id", [verifyAccessToken], categoryController.deleteCategories);
router.put("/update/:id", [verifyAccessToken], categoryController.updateCategories);
module.exports = router;
