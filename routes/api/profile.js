const express = require("express");
const router = express.Router();
const request = require('request');
const config = require('config')
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/Users");

//@route    GET api/profile/me
//@desc     Test Route user profile
//@access   Private
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    //res.json(profile);
  } catch (e) {
    //console.err(err.message);
    console.log(e);
    // res.status(500).send('Server Error')
  }

  //res.send("Profile Route")
});

//@route    POST api/profile
//@desc     Create or Update a User Profile
//@access   Private
router.post(
  "/",
  [
    auth, //use auth
    [
      //use middleware
      check("status", "Stutus is required").not().isEmpty(),
      check("skills", "Skills is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //build profile fields object to insert into the database
    const profileFields = {};
    profileFields.user = req.body.id;

    //check if the fields are coming in before setting the fields
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }
    //console.log(profileFields.skills);

    //build social object
    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    console.log(profileFields.social.twitter);

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //if the profile exsists update it

        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profile },
          { new: true }
        );
        return res.json(profile); //send back the profile
      }
      //if the profile does not exists create the profile
      profile = new Profile(profileFields);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.log(err);
      res.status(500).send("Server Error");
    }
  }
);

//@route    GET api/profile/
//@desc     Get All Profiles
//@access   Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

//@route    GET api/profile/user/:userid
//@desc     get profile by user id
//@access   Public

router.get("/users/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) return res.status(400).json({ msg: "Profile not found" });

    res.json(profile);
  } catch (error) {
    console.log(error);
    if (error.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found!" });
    }
    res.status(500).send("Server error");
  }
});

//@route    Delete api/profile/
//@desc     Delete profile user and posts
//@access   Private
router.delete("/", auth, async (req, res) => {
  try {
    //@todo - remove user posts

    //remove Profile
    await Profile.findOneAndRemove({ user: req.user.id });

    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: "User Deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("server error");
  }
});

//@route    Delete api/profile/
//@desc     add profile Experience
//@access   Private
router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("company", "Company is require").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty) {
      return res.status(400).json({ errors: errors.array() });
    }

    //get the body data
    const { title, company, location, from, to, current, description } =
      req.body;

    //create a new experience object
    const newEdu = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      //fetch profile to attach experience to
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newEdu); //push onto begining

      await profile.save();
      res.json(profile); //return profile
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

//@route    DELETE api/profile/experience/:exp_id
//@desc     Delete experence from profile
//@access   Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    //get profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //get remove index
    const removeIndex = profile.experince
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

//@route    Delete api/profile/
//@desc     add profile education
//@access   Private
router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").not().isEmpty(),
      check("degree", "Degree is require").not().isEmpty(),
      check("fieldofstudy", "Fiel of study is require").not().isEmpty(),
      check("from", "From date is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty) {
      return res.status(400).json({ errors: errors.array() });
    }

    //get the body data
    const { school, degree, feildofstudy, from, to, current, description } =
      req.body;

    //create a new education object
    const newEdu = {
      school,
      degree,
      feildofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      //fetch profile to attach education to
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu); //push onto begining

      await profile.save();
      res.json(profile); //return profile
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server error");
    }
  }
);

//@route    DELETE api/profile/education/:exp_id
//@desc     Delete experence from profile
//@access   Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    //get profile
    await Profile.findOneAndRemove({ user: req.user.id });

    //get remove index
    const removeIndex = profile.experince
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error");
  }
});

// @route GET api/profile/github/:username
// @desc  Get user repos from Github
// @access Public
router.get('/github/:username', (req, res)=>{
  try {
    const options ={
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      methof: 'GET',
      headers: { 'user-agent': 'node.js' }
    }

    //make request
    request(options, (error, response, body)=>{
      if(error){
        console.log(error);
      }

      //check 200 response
      if(response.statusCode !== 200){
        res.status(404).json({msg: 'No github profile found'})
      }

      res.json(JSON.parse(body));
    })

  } catch (error) {
    console.log(error);
    res.status(500).send('server error');
  }
})
module.exports = router;
