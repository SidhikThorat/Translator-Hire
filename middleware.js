const Listing = require("./models/listing.js");
const Client = require("./models/client.js");
const User = require("./models/user.js");

// Middleware to pass authentication status to all views
const setAuthStatus = (req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    next();
};

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to access this page");
        // Check if the request is for a client route
        if (req.originalUrl.startsWith('/client')) {
            return res.redirect("/client/login");
        }
        return res.redirect("/login");
    }
    next();
};

const isTranslator = (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.isTranslator) {
        return next();
    }
    req.flash('error', 'You must be logged in as a translator to access this page');
    res.redirect('/login');
};

const saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

// Client Authentication Middleware
const isClientLoggedIn = (req, res, next) => {
    if (req.isAuthenticated() && req.user instanceof Client) {
        return next();
    }
    req.flash('error', 'You must be logged in as a client to access this page');
    res.redirect('/client/login');
};

module.exports = {
    setAuthStatus,
    isLoggedIn,
    isClientLoggedIn,
    isTranslator,
    saveRedirectUrl
};
