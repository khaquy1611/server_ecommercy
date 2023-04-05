const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var userVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "user",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 3600
  }
}, {
  timestamps: true,
});

//Export the model
module.exports = mongoose.model("userVerification", userVerificationSchema);