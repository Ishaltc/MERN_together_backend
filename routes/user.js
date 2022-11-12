const express = require("express");
const { authUser } = require("../middlewares/auth");

const {
  register,
  activateAccount,
  login,
  sendVerification,
  findUser,
  sendResetPasswordCode,
  validateResetCode,
  newPassword,
  getProfile,
  updateProfilePicture,
  updateCover,
  addFriend,
  cancelRequest,
  unfollow,
  follow,
  acceptRequest,
  unfriend,
  deleteRequest,
  search,
  addToSearchHistory,
  getSearchHistory,
  removeFromSearch,
  getFriendsPageInfos,
  getMyFriends,
} = require("../controllers/user");
const { Router } = require("express");
const router = express.Router();

router.post("/register", register);
//here we have add authUser bcz we passing user token from frontend via header
router.post("/activate", authUser, activateAccount);
router.post("/login", login);
//make sure user is logged in (authUser)
router.post("/sendVerification", authUser, sendVerification);
router.post("/findUser", findUser);
router.post("/sendResetPasswordCode", sendResetPasswordCode);
router.post("/validateResetCode", validateResetCode);
router.post("/newPassword", newPassword);
router.get("/getProfile/:username", authUser, getProfile);
router.put("/updateProfilePicture", authUser, updateProfilePicture);
router.put("/updateCover", authUser, updateCover);
router.put("/addFriend/:id", authUser, addFriend);
router.put("/cancelRequest/:id", authUser, cancelRequest);
router.put("/follow/:id", authUser, follow);
router.put("/unfollow/:id", authUser, unfollow);
router.put("/acceptRequest/:id", authUser, acceptRequest);
router.put("/unfriend/:id", authUser, unfriend);
router.put("/deleteRequest/:id", authUser, deleteRequest);
router.post("/search/:searchTerm", authUser, search)
router.put("/addToSearchHistory", authUser, addToSearchHistory)
router.get("/getSearchHistory", authUser, getSearchHistory)
router.put("/removeFromSearch", authUser, removeFromSearch)
router.get("/getFriendsPageInfos",authUser, getFriendsPageInfos)
router.get("/getFriends", authUser, getMyFriends)
module.exports = router;
