const userRouter = require("./user");
const productRouter = require("./product");
const categoriesRouter = require("./category");
const subCategoriesRouter = require("./subCategory");
const productCategoriesRouter = require("./productCategories");
const blogCategoriesRouter = require("./blogCategories");
const blogRouter = require("./blog");

const { notFound, errHandler } = require("../middleware/errHandler");

const initRoutes = (app) => {
  app.use("/api/users", userRouter);
  app.use("/api/products", productRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/blog", blogRouter);
  app.use("/api/subCategories", subCategoriesRouter);
  app.use("/api/productCategories", productCategoriesRouter);
  app.use("/api/blogCategories", blogCategoriesRouter);
  app.use(notFound);
  app.use(errHandler);
};

module.exports = initRoutes;
