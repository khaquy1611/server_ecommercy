const router = require("express").Router();
const productController = require("../controllers/product");
const { verifyAccessToken, isAdmin } = require("../middleware/verifyToken");
const uploader = require('../config/cloudinary.config');

router.post("/create", [verifyAccessToken], productController.createProduct);
router.put("/update/:pid", [verifyAccessToken], productController.updateProduct);
router.delete("/delete/:pid", [verifyAccessToken], productController.deleteProduct);
router.put("/ratings", [verifyAccessToken], productController.ratings);
router.get("/all", productController.getProducts);
router.get("/:pid", productController.getProduct);
router.put("/uploadImage/:pid", [verifyAccessToken], uploader.array('images'), productController.uploadImagesProduct)
module.exports = router;
