const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const { isLoggedIn } = require("../middleware");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");

// Landing page
router.get("/", (req, res) => {
    res.render("landing", { title: "Translator Hire - Home" });
});

// Home page (after login)
router.get("/home", isLoggedIn, async (req, res) => {
    try {
        const listings = await Listing.find({}).populate("owner");
        res.render("listings/index", { listings });
    } catch (err) {
        console.error(err);
        req.flash("error", "Error fetching listings");
        res.redirect("/");
    }
});

// Client routes
router.get("/client/login", (req, res) => {
    res.render("client/login");
});

router.get("/client/signup", (req, res) => {
    res.render("client/signup");
});

// Translator routes
router.get("/translator/login", (req, res) => {
    res.render("translator/login");
});

router.get("/translator/signup", (req, res) => {
    res.render("translator/signup");
});

// About Us Page
router.get("/about", (req, res) => {
    res.render("about");
});

// Contact Us Page
router.get("/contact", (req, res) => {
    res.render("contact");
});

// Contact Form Submission
router.post("/contact", (req, res) => {
    // Here you would typically:
    // 1. Validate the form data
    // 2. Send an email or save to database
    // 3. Show a success message
    req.flash("success", "Thank you for your message! We'll get back to you soon.");
    res.redirect("/contact");
});

// Terms and Conditions Page
router.get("/terms", (req, res) => {
    res.render("terms");
});

// User Manual Pages
router.get("/manual", (req, res) => {
    res.render("manual");
});

router.get("/manual/translator", (req, res) => {
    res.render("manual/translator");
});

router.get("/manual/client", (req, res) => {
    res.render("manual/client");
});

module.exports = router; 