const express = require("express");
const router = express.Router();
const passport = require("passport");
const { clientUserSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ClientUser = require("../models/clientUser.js");

const validateClientUser = (req, res, next) => {
    const { error } = clientUserSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(",");
        throw new ExpressError(400, msg);
    } else {
        next();
    }
};

router.get("/login", (req, res) => {
    res.render("clientUser/login.ejs");
});

router.post("/login", 
    passport.authenticate("client-local", {
        failureRedirect: "/client/login",
        failureFlash: true
    }), 
    (req, res) => {
        req.flash("success", "Welcome back!");
        res.redirect("/listings");
    }
);

router.get("/signup", (req, res) => {
    res.render("clientUser/signup.ejs");
});

router.post("/signup", validateClientUser, wrapAsync(async (req, res, next) => {
    try {
        const { name, age, location, country, preferredLanguages, budget } = req.body.clientUser;
        const { username, password } = req.body;
        
        // Convert comma-separated languages string to array and trim whitespace
        const languagesArray = preferredLanguages.split(',').map(lang => lang.trim());
        
        const clientUser = new ClientUser({
            username,
            name,
            age,
            location,
            country,
            preferredLanguages: languagesArray,
            budget
        });
        
        const registeredUser = await ClientUser.register(clientUser, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Translator Hire!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/client/signup");
    }
}));

router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
});

module.exports = router; 