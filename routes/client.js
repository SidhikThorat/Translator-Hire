const express = require('express');
const router = express.Router();
const passport = require('passport');
const Client = require('../models/client');
const Project = require('../models/project');
const { isClientLoggedIn } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ dest: 'uploads/' });
const Listing = require('../models/listing');
const User = require('../models/user');

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
            req.flash('error', 'All fields except company and address are required');
            return res.redirect('/client/signup');
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('/client/signup');
        }

        // Check if email already exists
        const existingClient = await Client.findOne({ email });
        if (existingClient) {
            req.flash('error', 'Email already registered');
            return res.redirect('/client/signup');
        }

        // Create new client
        const client = new Client({
            name,
            email,
            username: email,
            age,
            location,
            country,
            company,
            preferredLanguages: Array.isArray(preferredLanguages) ? preferredLanguages : [preferredLanguages],
            budget,
            address,
            isClient: true
        });

        // Register the client
        await Client.register(client, password);
        
        // Login the client after successful registration
        req.login(client, (err) => {
            if (err) {
                req.flash('error', 'Registration successful but login failed');
                return res.redirect('/client/login');
            }
            req.flash('success', 'Welcome to Translator Hire!');
            res.redirect('/client/dashboard');
        });
    } catch (err) {
        console.error('Signup error:', err);
        req.flash('error', err.message);
        res.redirect('/client/signup');
    }
});

// Show Login Form
router.get('/login', (req, res) => {
    res.render('client/login', { 
        error: req.flash('error'),
        success: req.flash('success')
    });
});

// Client Login
router.post('/login', (req, res, next) => {
    console.log('Client login attempt:', {
        email: req.body.email,
        hasPassword: !!req.body.password
    });

    passport.authenticate('client-local', (err, client, info) => {
        if (err) {
            console.error('Authentication error:', err);
            return next(err);
        }
        if (!client) {
            console.log('Authentication failed:', info);
            req.flash('error', info.message);
            return res.redirect('/client/login');
        }

        req.logIn(client, async (err) => {
            if (err) {
                console.error('Login error:', err);
                return next(err);
            }

            // Verify client exists using the Client model
            const verifiedClient = await Client.findOne({
                _id: client._id,
                email: client.email
            });

            if (!verifiedClient) {
                console.log('Client verification failed after login');
                req.flash('error', 'Invalid client credentials');
                return res.redirect('/client/login');
            }

            console.log('Client login successful:', {
                id: verifiedClient._id,
                email: verifiedClient.email,
                name: verifiedClient.name
            });

            // Save session before redirect
            req.session.save(() => {
                res.redirect('/client/dashboard');
            });
        });
    })(req, res, next);
});

// Client Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/');
});

// Client Dashboard
router.get('/dashboard', isClientLoggedIn, async (req, res) => {
    try {
        console.log('Accessing client dashboard for user:', req.user._id);
        
        // Fetch client details using the Client model
        const client = await Client.findById(req.user._id);

        if (!client) {
            console.log('Client not found in dashboard route');
            req.flash('error', 'Client not found');
            return res.redirect('/client/login');
        }

        console.log('Found client:', client.name);

        // Fetch all projects for this client
        const projects = await Project.find({ client: client._id })
            .populate('translator', 'name email')
            .sort({ createdAt: -1 });

        // Categorize projects
        const hiringRequests = projects.filter(p => p.status === 'pending');
        const activeProjects = projects.filter(p => p.status === 'accepted');
        const completedProjects = projects.filter(p => p.status === 'completed');
        const rejectedProjects = projects.filter(p => p.status === 'rejected');

        // Fetch available translators
        const translators = await User.find({ 
            isTranslator: true,
            status: 'active'
        }).select('name email location country profileImage languages charges rating');

        console.log('Projects found:', {
            total: projects.length,
            hiringRequests: hiringRequests.length,
            activeProjects: activeProjects.length,
            completedProjects: completedProjects.length,
            rejectedProjects: rejectedProjects.length
        });

        res.render('client/dashboard', {
            title: 'Client Dashboard',
            client,
            hiringRequests: [...hiringRequests, ...activeProjects], // Show both pending and accepted requests
            completedProjects,
            rejectedProjects,
            translators,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        console.error('Error in client dashboard:', err);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/client/login');
    }
});

// Create New Project
router.get('/projects/new', isClientLoggedIn, (req, res) => {
    res.render('client/projects/new');
});

// Create Project
router.post('/projects', isClientLoggedIn, upload.array('files'), async (req, res) => {
    try {
        const project = new Project({
            ...req.body,
            client: req.user._id,
            files: req.files.map(file => ({
                url: file.path,
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                uploadDate: new Date()
            }))
        });
        await project.save();
        req.flash('success', 'Project created successfully');
        res.redirect('/client/dashboard');
    } catch (err) {
        console.error('Project creation error:', err);
        req.flash('error', 'Error creating project');
        res.redirect('/client/projects/new');
    }
});

// View Project
router.get('/projects/:id', isClientLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('translator')
            .populate('client');
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }
        res.render('client/projects/show', { project });
    } catch (err) {
        console.error('Project view error:', err);
        req.flash('error', 'Error viewing project');
        res.redirect('/client/dashboard');
    }
});

// Edit Project
router.get('/projects/:id/edit', isClientLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }
        res.render('client/projects/edit', { project });
    } catch (err) {
        console.error('Project edit error:', err);
        req.flash('error', 'Error editing project');
        res.redirect('/client/dashboard');
    }
});

// Update Project
router.put('/projects/:id', isClientLoggedIn, upload.array('files'), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }

        const newFiles = req.files.map(file => ({
            url: file.path,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            uploadDate: new Date()
        }));

        project.set({
            ...req.body,
            files: [...project.files, ...newFiles]
        });

        await project.save();
        req.flash('success', 'Project updated successfully');
        res.redirect(`/client/projects/${project._id}`);
    } catch (err) {
        console.error('Project update error:', err);
        req.flash('error', 'Error updating project');
        res.redirect(`/client/projects/${req.params.id}/edit`);
    }
});

// Delete Project
router.delete('/projects/:id', isClientLoggedIn, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        req.flash('success', 'Project deleted successfully');
        res.redirect('/client/dashboard');
    } catch (err) {
        console.error('Project deletion error:', err);
        req.flash('error', 'Error deleting project');
        res.redirect('/client/dashboard');
    }
});

// Add Message to Project
router.post('/projects/:id/messages', isClientLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }

        project.messages.push({
            sender: req.user._id,
            content: req.body.content,
            timestamp: new Date()
        });

        await project.save();
        req.flash('success', 'Message sent successfully');
        res.redirect(`/client/projects/${project._id}`);
    } catch (err) {
        console.error('Message error:', err);
        req.flash('error', 'Error sending message');
        res.redirect(`/client/projects/${req.params.id}`);
    }
});

// Submit Rating and Review
router.post('/projects/:id/review', isClientLoggedIn, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('translator');
            
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }

        // Only allow reviews for completed projects
        if (project.status !== 'completed') {
            req.flash('error', 'You can only review completed projects');
            return res.redirect(`/client/projects/${project._id}`);
        }

        // Check if already reviewed
        if (project.rating || project.review) {
            req.flash('error', 'You have already reviewed this project');
            return res.redirect(`/client/projects/${project._id}`);
        }

        // Validate rating
        const rating = parseInt(req.body.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            req.flash('error', 'Rating must be between 1 and 5');
            return res.redirect(`/client/projects/${project._id}`);
        }

        // Update project with review
        project.rating = rating;
        project.review = {
            text: req.body.review,
            date: new Date()
        };

        await project.save();

        // Update translator's average rating
        const translatorProjects = await Project.find({
            translator: project.translator._id,
            status: 'completed',
            rating: { $exists: true }
        });

        const ratings = translatorProjects.map(p => p.rating);
        const avgRating = ratings.reduce((a, b) => a + b) / ratings.length;

        await Listing.findOneAndUpdate(
            { user: project.translator._id },
            { 
                $set: { 
                    avgRating,
                    totalReviews: ratings.length
                }
            }
        );

        req.flash('success', 'Review submitted successfully');
        res.redirect(`/client/projects/${project._id}`);
    } catch (err) {
        console.error('Review error:', err);
        req.flash('error', 'Error submitting review');
        res.redirect(`/client/projects/${req.params.id}`);
    }
});

// Hire a translator
router.post('/hire', isClientLoggedIn, async (req, res) => {
    try {
        const { translatorId } = req.body;
        
        // Create a new project
        const project = new Project({
            client: req.user._id,
            translator: translatorId,
            status: 'pending',
            createdAt: new Date()
        });
        
        await project.save();
        
        res.json({ success: true, message: 'Hiring request sent successfully!' });
    } catch (err) {
        console.error('Hire error:', err);
        res.status(500).json({ success: false, error: 'Error processing hire request' });
    }
});

// Show Edit Profile Form
router.get('/profile/edit', isClientLoggedIn, async (req, res) => {
    try {
        const client = await Client.findById(req.user._id);
        res.render('client/edit-profile', { client });
    } catch (err) {
        console.error('Error loading edit profile form:', err);
        req.flash('error', 'Error loading edit profile form');
        res.redirect('/client/dashboard');
    }
});

// Update Profile
router.put('/profile', isClientLoggedIn, async (req, res) => {
    try {
        const {
            name,
            age,
            location,
            country,
            company,
            preferredLanguages,
            budget,
            phone,
            address
        } = req.body;

        const client = await Client.findById(req.user._id);
        
        // Update client fields
        client.name = name;
        client.age = age;
        client.location = location;
        client.country = country;
        client.company = company;
        client.preferredLanguages = Array.isArray(preferredLanguages) ? preferredLanguages : [preferredLanguages];
        client.budget = budget;
        client.phone = phone;
        client.address = address;

        await client.save();
        
        req.flash('success', 'Profile updated successfully');
        res.redirect('/client/dashboard');
    } catch (err) {
        console.error('Profile update error:', err);
        req.flash('error', 'Error updating profile');
        res.redirect('/client/profile/edit');
    }
});

// View Translator Details
router.get('/translator/:id', isClientLoggedIn, async (req, res) => {
    try {
        const translator = await User.findById(req.params.id);
        if (!translator || !translator.isTranslator) {
            req.flash('error', 'Translator not found');
            return res.redirect('/client/dashboard');
        }

        // Get translator's completed projects and average rating
        const projects = await Project.find({ 
            translator: translator._id,
            status: 'completed'
        }).populate('client', 'name email');

        const totalRatings = projects.reduce((sum, project) => sum + (project.rating || 0), 0);
        const averageRating = projects.length > 0 ? (totalRatings / projects.length).toFixed(1) : 0;

        res.render('client/translator-details', { 
            translator,
            projects,
            averageRating,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        console.error('Translator details error:', err);
        req.flash('error', 'Error loading translator details');
        res.redirect('/client/dashboard');
    }
});

// Hire Translator
router.post('/translator/:id/hire', isClientLoggedIn, async (req, res) => {
    try {
        console.log('Hiring request received:', {
            translatorId: req.params.id,
            clientId: req.user._id,
            projectDetails: req.body
        });

        const translator = await User.findById(req.params.id);
        if (!translator || !translator.isTranslator) {
            console.log('Translator not found or not a translator');
            req.flash('error', 'Translator not found');
            return res.redirect('/client/dashboard');
        }

        const project = new Project({
            client: req.user._id,
            translator: req.params.id,
            status: 'pending',
            title: `Translation Request from ${req.user.name}`,
            description: req.body.description,
            sourceLanguage: req.body.sourceLanguage,
            targetLanguage: req.body.targetLanguage,
            deadline: req.body.deadline,
            budget: req.body.budget
        });

        console.log('Project to be saved:', {
            id: project._id,
            client: project.client,
            translator: project.translator,
            status: project.status,
            title: project.title,
            description: project.description
        });

        await project.save();
        console.log('Project saved successfully');

        // Verify the project was saved correctly
        const savedProject = await Project.findById(project._id)
            .populate('client', 'name email')
            .populate('translator', 'name email');
        
        console.log('Verified saved project:', {
            id: savedProject._id,
            client: savedProject.client ? savedProject.client.name : 'No client',
            translator: savedProject.translator ? savedProject.translator.name : 'No translator',
            status: savedProject.status,
            title: savedProject.title,
            createdAt: savedProject.createdAt
        });

        req.flash('success', 'Hiring request sent successfully');
        res.redirect('/client/dashboard');
    } catch (error) {
        console.error('Error in hiring translator:', error);
        req.flash('error', 'Error sending hiring request');
        res.redirect('/client/dashboard');
    }
});

// Create New Project
router.post('/project/create', isClientLoggedIn, async (req, res) => {
    try {
        const { 
            translatorId,
            description,
            sourceLanguage,
            targetLanguage,
            deadline,
            budget
        } = req.body;

        // Validate required fields
        if (!translatorId || !description || !sourceLanguage || !targetLanguage || !deadline || !budget) {
            req.flash('error', 'All fields are required');
            return res.redirect('/client/dashboard');
        }

        // Verify translator exists and is active
        const translator = await User.findOne({ 
            _id: translatorId,
            isTranslator: true,
            status: 'active'
        });

        if (!translator) {
            req.flash('error', 'Selected translator is not available');
            return res.redirect('/client/dashboard');
        }

        // Create new project
        const project = new Project({
            client: req.user._id,
            translator: translatorId,
            description,
            sourceLanguage,
            targetLanguage,
            deadline: new Date(deadline),
            budget: parseFloat(budget),
            status: 'pending'
        });

        await project.save();

        // Add project to translator's projects array
        translator.projects.push(project._id);
        await translator.save();

        req.flash('success', 'Project created successfully!');
        res.redirect('/client/dashboard');
    } catch (err) {
        console.error('Create project error:', err);
        req.flash('error', 'Error creating project');
        res.redirect('/client/dashboard');
    }
});

module.exports = router; 