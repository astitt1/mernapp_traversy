const express = require("express");
const router = express.Router();
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

//@route    POST api/profile/profile
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

router.get('/', async(req, res)=>{
    try {

        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles);

    } catch (error) {

        console.log(error)
        res.status(500).send('Server error');
    }
})

//@route    GET api/profile/user/:userid
//@desc     get profile by user id
//@access   Public

router.get('/users/:user_id', async(req, res)=>{
    try {

        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name', 'avatar'])
        
        if(!profile) return res.status(400).json({msg: 'Profile not found'})
        
        res.json(profile);

    } catch (error) {
        console.log(error)
        if(error.kind == 'ObjectId'){
            return res.status(400).json({ msg: 'Profile not found'});
        }
        res.status(500).send('Server error');  
    }
});

//@route    Delete api/profile/
//@desc     Delete profile user and posts
//@access   Private
router.delete('/', async (req, res)=> {
    try {
        //@todo - remove user posts

        //remove Profile
        await Profile.findOneAndRemove({ user: req.user.id })
        
        await User.findOneAndRemove({ _id: req.user.id })
        res.json({ msg: 'User Deleted'});
    } catch (error) {
        console.log(error.message)
        res.status(500).send('server error')
    }
})


module.exports = router;
