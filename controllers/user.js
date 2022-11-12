const {
  validateEmail,
  validateLength,
  validUserName,
} = require("../helpers/validation");
const User = require("../models/User");
const Code = require("../models/Code");
const bcrypt = require("bcrypt");
const { generateToken } = require("../helpers/token");
const { sentVerificationEmail, sentResetCode } = require("../helpers/mailer");
const jwt = require("jsonwebtoken");
const { redis } = require("googleapis/build/src/apis/redis");
const generateCode = require("../helpers/generateCode");
const Post = require("../models/Post");
const mongoose = require("mongoose");

//register
exports.register = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      username,
      bYear,
      bMonth,
      bDay,
      gender,
    } = req.body;

    //validations
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "invalid email address" });
    }

    const check = await User.findOne({ email });
    if (check) {
      return res
        .status(400)
        .json({ message: "This email address is already being used" });
    }

    if (!validateLength(first_name, 4, 20)) {
      return res
        .status(400)
        .json({ message: "first name must between 4 and 20 characters" });
    }
    if (!validateLength(last_name, 4, 20)) {
      return res
        .status(400)
        .json({ message: "last name must between 4 and 20 characters" });
    }
    if (!validateLength(password, 6, 20)) {
      return res
        .status(400)
        .json({ message: "password must be atleast 6 characters" });
    }

    const cryptedPassword = await bcrypt.hash(password, 12);

    const tempUsername = first_name + last_name;
    const newUsername = await validUserName(tempUsername);

    
    const user = await new User({
      first_name,
      last_name,
      email,
      password: cryptedPassword,
      username: newUsername,
      bYear,
      bMonth,
      bDay,
      gender,
      
    }).save();

    const emailVerificationToken = generateToken(
      { id: user._id.toString() },
      "30m"
    );

    const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
    sentVerificationEmail(user.email, user.first_name, url);
    const token = generateToken({ id: user._id.toString() }, "7d");
    res.send({
      id: user._id,
      username: user.username,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token: token,
      verified: user.verified,
      isBlocked: user.isBlocked,
      register: user.register,
      message: "Register success ! please activate your email to start",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

//activate account
exports.activateAccount = async (req, res) => {
  try {
    const validUser = req.user.id;
    const { token } = req.body;
    const user = jwt.verify(token, process.env.TOKEN_SECRET);
    const check = await User.findById(user.id);
    //it  means (validUser) if anyone get the activation link we have to make sure it's security,only user can active it
    if (validUser !== user.id) {
      return res.status(400).json({
        message: "You don't have the authorization to complete this operation",
      });
    }

    if (check.verified === true) {
      return res
        .status(400)
        .json({ message: "this email is already activated" });
    } else {
      await User.findByIdAndUpdate(user.id, { verified: true });
      res
        .status(200)
        .json({ message: "Account has been activated successfully" });
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "the email address you entered is not connected to account",
      });
    }
    const check = await bcrypt.compare(password, user.password);
    if (!check) {
      return res
        .status(400)
        .json({ message: "Invalid credentials.Please try again" });
    }
    const token = generateToken({ id: user._id.toString() }, "7d");
    res.send({
      id: user._id,
      username: user.username,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token: token,
      verified: user.verified,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// exports.auth = (req, res) => {
//   console.log(req.user);
//   res.json("Welcome from auth");
// };

exports.sendVerification = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    if (user.verified === true) {
      return res.status(400).json({
        message: "This account is already activated.",
      });
    }
    const emailVerificationToken = generateToken(
      { id: user._id.toString() },
      "30m"
    );

    const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
    sentVerificationEmail(user.email, user.first_name, url);
    return res
      .status(200)
      .json({ message: "Email verification link has been sent to your mail" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//resetting password
exports.findUser = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(400).json({ message: "Account does not exist" });
    }
    return res.status(200).json({
      email: user.email,
      picture: user.picture,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//creating reset password verification code
exports.sendResetPasswordCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("-password");
    await Code.findOneAndRemove({ user: user._id });
    const code = generateCode(5);
    const savedCode = await new Code({
      code,
      user: user._id,
    }).save();
    sentResetCode(user.email, user.first_name, code);
    return res.status(200).json({
      message: "Email reset code has been sent to your account",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// verifying req.body reset password code
exports.validateResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email });
    const Dbcode = await Code.findOne({ user: user._id });
    if (Dbcode.code !== code) {
      return res.status(400).json({
        message: "Invalid verification code",
      });
    }
    return res.status(200).json({ message: "Okay" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// new password

exports.newPassword = async (req, res) => {
  try {
    const { password, email } = req.body;

    const cryptedPassword = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate(
      { email },
      {
        password: cryptedPassword,
      }
    );
    res
      .status(200)
      .send({ message: "Password has been updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findById(req.user.id);
    const profile = await User.findOne({ username }).select("-password");
    // .populate("friends", "first_name last_name username picture");
    const friendShip = {
      friends: false,
      following: false,
      requestSent: false,
      requestReceived: false,
    };
    if (!profile) {
      return res.json({ ok: false });
    }

    if (
      user.friends.includes(profile._id) &&
      profile.friends.includes(user._id)
    ) {
      friendShip.friends = true;
    }
    if (user.following.includes(profile._id)) {
      friendShip.following = true;
    }
    if (user.requests.includes(profile._id)) {
      friendShip.requestReceived = true;
    }
    if (profile.requests.includes(user._id)) {
      friendShip.requestSent = true;
    }

    const posts = await Post.find({ user: profile._id })

      .populate("user")
      .sort({ createdAt: -1 });

    await profile.populate("friends", "first_name last_name username picture");
    console.log(posts);
    res.json({ ...profile.toObject(), posts, friendShip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//updating profile_picture
exports.updateProfilePicture = async (req, res) => {
  try {
    const { url } = req.body;
  
    await User.findByIdAndUpdate(req.user.id, { picture: url });
    res.json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCover = async (req, res) => {
  try {
    const { url } = req.body;
    await User.findByIdAndUpdate(req.user.id, {
      cover: url,
    });
    res.json(url);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//add friend

// exports.addFriend = async (req, res) => {
//   try {
//     if (req.user.id !== req.params.id) {
//       const sender = await User.findById(req.user.id);
//       const receiver = await User.findById(req.params.id);
//       if (
//         !receiver.requests.includes(sender._id) &&
//         !receiver.friends.includes(sender._id)
//       ) {
//         await receiver.updateOne({ $push: { requests: sender._id } });
//         await receiver.updateOne({ $push: { followers: sender._id } });
//         await sender.updateOne({ $push: { following: receiver._id } });
//         res.json({ message: "friend request has been send" });
//       } else {
//         return res.status(400).json({ message: "Already sent" });
//       }
//     } else {
//       return res
//         .status(400)
//         .json({ message: "You can't send a request to yourselves" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.addFriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        !receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({
          $push: { requests: sender._id },
        });
        await receiver.updateOne({
          $push: { followers: sender._id },
        });
        await sender.updateOne({
          $push: { following: receiver._id },
        });
        res.json({ message: "friend request has been sent" });
      } else {
        return res.status(400).json({ message: "Already sent" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't send a request to yourself" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//cancel friend request
exports.cancelRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.requests.includes(sender._id) &&
        !receiver.friends.includes(sender._id)
      ) {
        await receiver.updateOne({ $pull: { requests: sender._id } });
        await receiver.updateOne({ $pull: { followers: sender._id } });
        await sender.updateOne({ $pull: { following: sender._id } });
        res.json({ message: "you successfully cancelled request" });
      } else {
        return res.status(400).json({ message: "Already Cancelled" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't send a  cancel request to yourselves" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//follow
exports.follow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);

      if (
        !receiver.followers.includes(sender._id) &&
        !sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({ $push: { followers: sender._id } });
        await sender.updateOne({ $push: { following: receiver._id } });
        res.json({ message: "Follow success" });
      } else {
        return res.json({ message: "Already following" });
      }
    } else {
      return res.status(400).json({ message: "You can't follow yourselves" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//unFollow
exports.unfollow = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);

      if (
        receiver.followers.includes(sender._id) &&
        sender.following.includes(receiver._id)
      ) {
        await receiver.updateOne({ $pull: { followers: sender._id } });
        await sender.updateOne({ $pull: { following: receiver._id } });
        res.json({ message: "UnFollow success" });
      } else {
        return res.json({ message: "Already not following" });
      }
    } else {
      return res.status(400).json({ message: "You can't unFollow yourselves" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//accepting friend request
exports.acceptRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $push: { friends: sender._id, following: sender._id },
        });
        await sender.update({
          $push: { friends: receiver._id, followers: receiver._id },
        });
        await receiver.updateOne({ $pull: { requests: sender._id } });
      }
      return res.status(400).json({ message: "Already friends" });
    } else {
      return res
        .status(400)
        .json({ message: "You can't accept a request from yourselves" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//unFriend

exports.unfriend = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const sender = await User.findById(req.user.id);
      const receiver = await User.findById(req.params.id);
      if (
        receiver.friends.includes(sender._id) &&
        sender.friends.includes(receiver._id)
      ) {
        await receiver.update({
          $pull: {
            friends: sender._id,
            following: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            friends: receiver._id,
            following: receiver._id,
            followers: receiver._id,
          },
        });
        res.json({ message: "unfriend request accepted" });
      } else {
        return res.status(400).json({ message: "Already not a friend" });
      }
    } else {
      return res.status(400).json({ message: "You can't unFriend yourselves" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//deleteRequest
exports.deleteRequest = async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      const receiver = await User.findById(req.user.id);
      const sender = await User.findById(req.params.id);
      if (receiver.requests.includes(sender._id)) {
        await receiver.update({
          $pull: {
            requests: sender._id,
            followers: sender._id,
          },
        });
        await sender.update({
          $pull: {
            following: receiver._id,
          },
        });
        res.json({ message: "delete request accepted" });
      } else {
        return res.status(400).json({ message: "Already deleted" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "You can't delete your yourselves" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//search in home page
exports.search = async (req, res) => {
  try {
    const searchTerm = req.params.searchTerm;
    const results = await User.find({ $text: { $search: searchTerm } }).select(
      "first_name last_name username picture"
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//adding search history
exports.addToSearchHistory = async (req, res) => {
  try {
    const { searchUser } = req.body;
    const search = {
      user: searchUser,
      createdAt: new Date(),
    };
    const user = await User.findById(req.user.id);
    const check = user.search.find((x) => x.user.toString() === searchUser);
    if (check) {
      await User.updateOne(
        {
          _id: req.user.id,
          "search._id": check._id,
        },
        {
          $set: { "search.$.createdAt": new Date() },
        }
      );
    } else {
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          search,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get search history

exports.getSearchHistory = async (req, res) => {
  try {
    const results = await User.findById(req.user.id)
      .select("search")
      .populate("search.user", "first_name last_name username picture");
    const { search } = results;

    res.json(search);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//deleting search history
exports.removeFromSearch = async (req, res) => {
  try {
    const { searchUser } = req.body;
    await User.updateOne(
      {
        _id: req.user.id,
      },
      { $pull: { search: { user: searchUser } } }
    );
    res.json({ message: "User has been deleted from search history" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// finding user's friends,requests and sent requests
exports.getFriendsPageInfos = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("friends request")
      .populate("friends", "first_name last_name username picture")
      .populate("requests", "first_name last_name username picture");
    //checking if any other users have current user request
    const sentRequests = await User.find({
      requests: mongoose.Types.ObjectId(req.user.id),
    }).select("first_name last_name username picture");

    res.json({
      friends: user.friends,
      requests: user.requests,
      sentRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get my friends

exports.getMyFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "first_name last_name username picture");
    res.status(200).json({friends:user.friends});
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
