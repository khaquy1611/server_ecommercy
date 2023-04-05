const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Types.ObjectId,
    ref: "Category",
  },
});

subCategorySchema.pre(/^find/, function (next) {
  this.populate({
    path: "category",
    select: "name -_id",
  });
  next();
});

//Export the model
module.exports = mongoose.model("SubCategory", subCategorySchema);
