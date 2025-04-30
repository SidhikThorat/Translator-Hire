const isTranslator = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isTranslator) {
        return next();
    }
    req.flash('error', 'You must be logged in as a translator to access this page');
    res.redirect('/translator/login');
};

module.exports = {
    isTranslator
}; 