const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl, isLoggedIn, isTranslator } = require("../middleware.js");
const { upload } = require("../cloudinary");

const userController = require("../controllers/users.js")

const validateListing = (req,res,next) =>{
    let {error} = listingSchema.validate(req.body);
    if(error){
      let errMsg = err.details.map((el) => el.message).join(",");
      throw new ExpressError(404, errMsg);
    }else{
      next();
    }
  };
  
router.route("/signup")
.get(userController.renderSignupForm)
.post(upload.single('introVideo'), wrapAsync(userController.signup));

router.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl, 
    passport.authenticate("user-local", {
        failureRedirect: '/login',
        failureFlash: true
    }), 
    userController.login
);

router.get("/logout", userController.logout);

// Dashboard route
router.get("/users/dashboard", isLoggedIn, isTranslator, userController.renderDashboard);

// Edit profile routes
router.get("/users/edit", isLoggedIn, isTranslator, userController.renderEditForm);
router.post("/users/edit", isLoggedIn, isTranslator, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'introVideo', maxCount: 1 }
]), wrapAsync(userController.updateProfile));

module.exports = router;