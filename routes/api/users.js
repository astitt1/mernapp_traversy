const express = require('express');
const router = express.Router();
const gravatar = require('gravatar'); //avatar
const bcrypt = require('bcryptjs'); //encrypt password
const jwt = require('jsonwebtoken');
const config = require('config')
const { check, validationResult } = require('express-validator');

const User = require('../../models/Users');

//@route    GET api/profile
//@desc     Test Route
//@access   Public
router.post('/', [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'please include email').isEmail(),
    check('password', 'password must be 6 characters or more').isLength({min: 6})

], 
async (req, res)=>{
    const errors = validationResult(req);
    console.log(req.body)
   
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }

    const { name, email, password} = req.body;

    try {
        //see if user exists 
        let user = await User.findOne({ email })
        if(user) {
            return res.status(400).json({ errors: [{ msg: 'user already exists' }] });
        }
        //get users gravatar --pass email into method
        const avatar = gravatar.url(email, {
            s: '200', //size
            r: 'pg', //rating = pg
            d:'mm' //default image
        })

        //create an instance of a user --does not save
        user = new User({
            name,
            email,
            avatar,
            password
        });

        //Encrypt password
        const salt = await bcrypt.genSalt(10);//10 is standard practice

        user.password = await bcrypt.hash(password, salt);
        
       await user.save();
        
        //get payload -- return json webtoken --logged in with webtoken
        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(payload, 
            config.get('jwtSecret'), 
            { expiresIn: 3600000 },
            (err, token) => {
                if(err) throw err;
                res.json({ token })
            }
        )
       // res.send("User Registered")

    }catch(err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
})

module.exports = router;
