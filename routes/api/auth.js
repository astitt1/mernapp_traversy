const express = require("express");
const router = express.Router();
const User = require("../../models/Users");
const auth = require("../../middleware/auth");
const bcrypt = require('bcryptjs'); //encrypt password
const config = require("config");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

//@route    GET api/auth
//@desc     Test Rout
//@access   Public
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }

  res.send("Auth Route");
});

//@route    GET api/auth
//@desc     Authenticate user and get token
//@access   Public
router.post(
  "/",
  [
    check("email", "please include email").isEmail(),
    check("password", "password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    console.log(req.body);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      //see if user exists
      let user = await User.findOne({ email });
      
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      //match user email and password
      const isMatch = await bcrypt.compare(password,  user.password);

      if(!isMatch){
        return res
        .status(400)
        .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      //get payload -- return json webtoken --logged in with webtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
      // res.send("User Registered")
    } catch (err) {
      console.error(err.message);
      res.status(500).send("server error");
    }
  }
);

module.exports = router;
