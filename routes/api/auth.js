const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

//@route    GET api/auth
//@desc     Test Rout
//@access   Public
router.get('/', (req, res)=>{
    res.send("Auth Route")
})

module.exports = router;