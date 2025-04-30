const express = require('express');
const router = express.Router();
const passport = require('passport');
const Client = require('../../models/client');

// Client Signup
router.post('/signup', async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            confirmPassword,
            age,
            location,
            country,
            company,
            preferredLanguages,
            budget,
            address
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !confirmPassword || !age || !location || !country || !preferredLanguages || !budget) {
            return res.render('client/signup', { 
                error: 'All fields except company and address are required',
                ...req.body
            });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.render('client/signup', { 
                error: 'Passwords do not match',
                ...req.body
            });
        }

        // Check if email already exists
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            return res.render('client/signup', { 
                error: 'Email already registered',
                ...req.body
            });
        }

        // Create new client
        const client = new Client({
            name,
            email,
            age,
            location,
            country,
            company,
            preferredLanguages: Array.isArray(preferredLanguages) ? preferredLanguages : [preferredLanguages],
            budget,
            address
        });

        // Register client with passport-local-mongoose
        Client.register(client, password, (err, client) => {
            if (err) {
                console.error('Registration error:', err);
                return res.render('client/signup', { 
                    error: err.message,
                    ...req.body
                });
            }

            // Authenticate the client
            passport.authenticate('client-local')(req, res, () => {
                req.flash('success', 'Welcome to Translator Hire!');
                res.redirect('/client/dashboard');
            });
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.render('client/signup', { 
            error: 'An error occurred during signup',
            ...req.body
        });
    }
});

// Client Login
router.post('/login', passport.authenticate('client-local', {
    failureRedirect: '/client/login',
    failureFlash: true
}), (req, res) => {
    req.flash('success', 'Welcome back!');
    res.redirect('/client/dashboard');
});

// Client Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You have been logged out');
    res.redirect('/');
});

module.exports = router; 