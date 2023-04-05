const router = require('express').Router();
const productCategoriesController = require('../controllers/productCategory');
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");

router.post('/create', [verifyAccessToken, allowedTo("user")], productCategoriesController.createProductCategories);
router.get('/all', productCategoriesController.getProductCategories);
router.put('/update/:id', [verifyAccessToken, allowedTo("user")], productCategoriesController.updatedProductCategories);
router.delete('/delete/:id', [verifyAccessToken, allowedTo("user")], productCategoriesController.deleteProductCategories);

module.exports = router;