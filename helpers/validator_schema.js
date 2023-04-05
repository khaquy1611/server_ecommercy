const Joi = require("joi");

const registerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  userName: Joi.string(),
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(8).required(),
});

const productSchema = Joi.object({
  title: Joi.string().lowercase().required(),
  description: Joi.string().lowercase().required(),
  brand: Joi.string().lowercase().required(),
  price: Joi.number().required(),
  category: Joi.string().required(),
});

const productRatingsSchema = Joi.object({
  star: Joi.number().required(),
  comment: Joi.string().required(),
  pid: Joi.string(),
})

const categorySchema = Joi.object({
  name: Joi.string().lowercase().required(),
});

const subCategorySchema = Joi.object({
  name: Joi.string().lowercase().required(),
  category: Joi.string().required(),
})
module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  categorySchema,
  subCategorySchema,
  productRatingsSchema
};
