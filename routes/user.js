const router = require("express").Router();
const userController = require("../controllers/user");
const { verifyAccessToken, allowedTo } = require("../middleware/verifyToken");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/refreshToken", userController.refreshAccessToken);
router.get("/logout", userController.logout);
router.get("/verify/:id/:token", userController.confirmEmail);
router.get("/all", verifyAccessToken, userController.getAllUser);
router.get(
  "/current",
  [verifyAccessToken, allowedTo("user")],
  userController.getUserCurrent
);
router.get("/details/:id", verifyAccessToken, userController.getDetailsUser);
router.get("/forgot-password", userController.forgotPassword);
router.put("/reset-password/:token", userController.resetPassword);
router.delete(
  "/delete-user",
  [verifyAccessToken, allowedTo("user")],
  userController.deleteUser
);
router.put("/update-user", verifyAccessToken, userController.updateUser);
router.put(
  "/:uid",
  [verifyAccessToken,  allowedTo("user")],
  userController.updateUserByAdmin
);
module.exports = router;
