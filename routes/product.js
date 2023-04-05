const router = require("express").Router();
const productController = require("../controllers/product");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");

router.post("/create", [verifyAccessToken], productController.createProduct);
router.put("/update/:pid", [verifyAccessToken], productController.updateProduct);
router.delete("/delete/:pid", [verifyAccessToken], productController.deleteProduct);
router.put("/ratings", [verifyAccessToken], productController.ratings);
router.get("/all", productController.getProducts);
router.get("/:pid", productController.getProduct);
module.exports = router;
