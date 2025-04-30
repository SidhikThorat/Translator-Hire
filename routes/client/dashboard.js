const express = require('express');
const router = express.Router();
const Project = require('../../models/project');
const User = require('../../models/user');

// Middleware to check if client is authenticated
const isClientAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login first');
        return res.redirect('/client/login');
    }
    next();
};

// Client Dashboard
router.get('/dashboard', isClientAuthenticated, async (req, res) => {
    try {
        // Fetch client's projects
        const projects = await Project.find({ client: req.user._id })
            .populate('translator', 'name profileImage')
            .sort({ createdAt: -1 });
        
        // Fetch all available translators from User collection
        const translators = await User.find({ isTranslator: true }).sort({ name: 1 });
        
        res.render('client/dashboard', { 
            client: req.user, 
            projects,
            translators 
        });
    } catch (e) {
        console.error(e);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/');
    }
});

module.exports = router; 