const User = require("../db/models/user-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validateRegisterInput = require("../validation/register");
const validateLoginInput = require("../validation/login");
const secretKey = require("../db/secretKey");

const registerUser = (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const { firstname, lastname, email, password } = req.body;
      const newUser = new User({
        firstname,
        lastname,
        email,
        password,
      });

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    }
  });
};

const getUserByMail = async (req, res) => {
  try {
    const user = await User.findOne(
      { email: req.params.email },
      { role: 1, firstname: 1, lastname: 1, email: 1, date: 1, __v: 1 }
    );
    if (!user) {
      return res.status(404).json({ success: false, error: `User not found` });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    return res.status(400).json({ success: false, error: err });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      { role: 1, firstname: 1, lastname: 1, email: 1, date: 1, __v: 1 }
    );
    if (!users.length) {
      return res.status(404).json({ success: false, error: `Users not found` });
    }
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err });
  }
};

const loginUser = (req, res) => {
  const { errors, isValid } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;

  // Find user by email
  User.findOne({ email }).then((user) => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          status: user.status,
          avatar: user.avatar,
          role: user.role,
        };

        // Sign token
        jwt.sign(
          payload,
          secretKey,
          {
            expiresIn: 31556926, // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token,
              data: payload,
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
};

module.exports = {
  registerUser,
  getUserByMail,
  getUsers,
  loginUser,
};
