const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../../models/user');
const Project = require('../../models/project');
const { isTranslator } = require('../../middleware');
const upload = require('../../middleware/upload');
const cloudinary = require('../../config/cloudinary');
const Client = require('../../models/client');

// Translator Signup
router.post('/signup', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            name,
            description,
            country,
            charges,
            location,
            contact,
            age,
            category,
            gender,
            experience = 0,  // Default to 0 if not provided
            languages = [],  // Default to empty array if not provided
            bio = description  // Use description as bio if not provided
        } = req.body;
        
        // Validate required fields
        if (!email || !password || !name || !description || !country || !charges || 
            !location || !contact || !age || !category || !gender) {
            req.flash('error', 'Please fill in all required fields');
            return res.redirect('/translator/signup');
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email is already registered');
            return res.redirect('/translator/signup');
        }

        // Create new translator user with all required fields
        const translator = new User({
            email,
            username: email,
            name,
            phone: contact,  // Use contact as phone
            country,
            location,
            gender,
            age,
            charges,
            languages: Array.isArray(languages) ? languages : [category], // Use category as default language if none provided
            experience,
            bio,
            isTranslator: true,
            profileImage: req.body.profilepic || 'https://img.freepik.com/premium-vector/vector-young-man-anime-style-character-vector-illustration-design-manga-anime-boy_147933-12479.jpg',
            description: description
        });

        // Register the translator user
        const registeredUser = await User.register(translator, password);
        
        // Login the translator after successful registration
        req.login(registeredUser, (err) => {
            if (err) {
                req.flash('error', 'Registration successful but login failed');
                return res.redirect('/translator/login');
            }
            req.flash('success', 'Welcome to Translator Hire!');
            res.redirect('/translator/dashboard');
        });
    } catch (err) {
        console.error('Signup error:', err);
        req.flash('error', err.message);
        res.redirect('/translator/signup');
    }
});

// Translator Login
router.post('/login', passport.authenticate('translator-local', {
    failureFlash: true,
    failureRedirect: '/translator/login'
}), (req, res) => {
    console.log('Translator login successful, redirecting to dashboard');
    req.flash('success', 'Welcome back!');
    res.redirect('/translator/dashboard');
});

// Translator Logout
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/');
});

// Translator Dashboard
router.get('/dashboard', isTranslator, async (req, res) => {
    try {
        console.log('Accessing translator dashboard for user:', req.user._id);
        
        // Fetch translator details with all necessary fields
        const translator = await User.findById(req.user._id)
            .select('name email phone country location gender age charges languages experience bio profileImage introVideo rating')
            .lean();

        if (!translator) {
            console.log('Translator not found');
            req.flash('error', 'Translator not found');
            return res.redirect('/translator/login');
        }

        console.log('Found translator:', translator.name);
        console.log('Profile Image:', translator.profileImage);
        console.log('Intro Video:', translator.introVideo);

        // Fetch hiring requests (pending projects)
        const hiringRequests = await Project.find({ 
            translator: req.user._id,
            status: 'pending'
        }).populate('client', 'name email')
          .sort('-createdAt');

        // Fetch active projects (accepted but not completed)
        const activeProjects = await Project.find({ 
            translator: req.user._id,
            status: 'accepted'
        }).populate('client', 'name email')
          .sort('-createdAt');

        // Fetch completed projects
        const completedProjects = await Project.find({ 
            translator: req.user._id,
            status: 'completed'
        }).populate('client', 'name email')
          .sort('-createdAt');

        // Add projects to translator object
        translator.hiringRequests = hiringRequests;
        translator.activeProjects = activeProjects;
        translator.completedProjects = completedProjects;

        // Calculate average rating
        const completedProjectsWithRating = completedProjects.filter(p => p.rating);
        translator.averageRating = completedProjectsWithRating.length > 0 
            ? completedProjectsWithRating.reduce((sum, p) => sum + p.rating, 0) / completedProjectsWithRating.length 
            : 0;

        console.log('Rendering dashboard with translator data');
        res.render('translator/dashboard', {
            title: 'Translator Dashboard',
            translator,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (error) {
        console.error('Error in translator dashboard:', error);
        req.flash('error', 'Error loading dashboard');
        res.redirect('/translator/login');
    }
});

// Accept Hiring Request
router.post('/projects/:id/accept', isTranslator, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/translator/dashboard');
        }

        if (project.translator.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized to accept this project');
            return res.redirect('/translator/dashboard');
        }

        project.status = 'accepted';
        project.acceptedAt = new Date();
        await project.save();

        // Notify the client
        const client = await Client.findById(project.client);
        if (client) {
            req.flash('success', `Your hiring request has been accepted by ${req.user.name}`);
        }

        req.flash('success', 'Project accepted successfully');
        res.redirect('/translator/dashboard');
    } catch (err) {
        console.error('Error accepting project:', err);
        req.flash('error', 'Error accepting project');
        res.redirect('/translator/dashboard');
    }
});

// Reject Hiring Request
router.post('/projects/:id/reject', isTranslator, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/translator/dashboard');
        }

        if (project.translator.toString() !== req.user._id.toString()) {
            req.flash('error', 'Unauthorized to reject this project');
            return res.redirect('/translator/dashboard');
        }

        project.status = 'rejected';
        project.rejectedAt = new Date();
        await project.save();

        // Notify the client
        const client = await Client.findById(project.client);
        if (client) {
            req.flash('error', `Your hiring request has been rejected by ${req.user.name}`);
        }

        req.flash('success', 'Project rejected successfully');
        res.redirect('/translator/dashboard');
    } catch (err) {
        console.error('Error rejecting project:', err);
        req.flash('error', 'Error rejecting project');
        res.redirect('/translator/dashboard');
    }
});

// Edit Profile Routes
router.get('/profile/edit', isTranslator, async (req, res) => {
    try {
        const translator = await User.findById(req.user._id);
        res.render('translator/edit-profile', { translator });
    } catch (error) {
        console.error('Error fetching translator profile:', error);
        req.flash('error', 'Error fetching profile');
        res.redirect('/translator/dashboard');
    }
});

router.post('/profile/edit', isTranslator, upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'introVideo', maxCount: 1 }
]), async (req, res) => {
    try {
        console.log('Starting profile update for translator:', req.user._id);
        const { name, email, phone, age, country, location, gender, experience, languages, charges, bio } = req.body;
        
        // Update basic info
        const updateData = {
            name,
            email,
            phone,
            age,
            country,
            location,
            gender,
            experience,
            languages: languages.split(',').map(lang => lang.trim()),
            charges,
            bio
        };

        // Handle profile image upload
        if (req.files && req.files['profileImage']) {
            console.log('Uploading new profile image');
            const profileImage = req.files['profileImage'][0];
            
            try {
                // Delete old profile image if it exists and is not the default
                const currentUser = await User.findById(req.user._id);
                if (currentUser.profileImage && 
                    !currentUser.profileImage.includes('default-profile.png') && 
                    currentUser.profileImage.includes('cloudinary.com')) {
                    const publicId = currentUser.profileImage.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`translator-profiles/${publicId}`);
                }

                const result = await cloudinary.uploader.upload(profileImage.path, {
                    folder: 'translator-profiles',
                    resource_type: 'image',
                    transformation: [
                        { width: 500, height: 500, crop: "fill" },
                        { quality: "auto" }
                    ]
                });
                updateData.profileImage = result.secure_url;
                console.log('Profile image uploaded successfully:', result.secure_url);
            } catch (uploadError) {
                console.error('Error uploading profile image:', uploadError);
                throw new Error('Failed to upload profile image: ' + uploadError.message);
            }
        }

        // Handle intro video upload
        if (req.files && req.files['introVideo']) {
            console.log('Uploading new introduction video');
            const introVideo = req.files['introVideo'][0];
            console.log('Video file details:', {
                originalname: introVideo.originalname,
                mimetype: introVideo.mimetype,
                size: introVideo.size
            });
            
            try {
                // Delete old video if it exists
                const currentUser = await User.findById(req.user._id);
                if (currentUser.introVideo && currentUser.introVideo.includes('cloudinary.com')) {
                    const publicId = currentUser.introVideo.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`translator-videos/${publicId}`, { resource_type: 'video' });
                }

                const result = await cloudinary.uploader.upload(introVideo.path, {
                    folder: 'translator-videos',
                    resource_type: 'video',
                    chunk_size: 6000000, // 6MB chunks
                    eager: [
                        { width: 300, height: 300, crop: "pad", audio_codec: "none" },
                        { width: 160, height: 100, crop: "crop", gravity: "south", audio_codec: "none" }
                    ],
                    eager_async: true
                });
                updateData.introVideo = result.secure_url;
                console.log('Introduction video uploaded successfully:', result.secure_url);
            } catch (uploadError) {
                console.error('Error uploading video to Cloudinary:', uploadError);
                throw new Error('Failed to upload video: ' + uploadError.message);
            }
        }

        console.log('Updating translator profile with data:', updateData);
        
        // Update translator profile
        const translator = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        );

        if (!translator) {
            throw new Error('Failed to update translator profile');
        }

        console.log('Profile updated successfully');
        console.log('Updated profile data:', {
            profileImage: translator.profileImage,
            introVideo: translator.introVideo
        });

        req.flash('success', 'Profile updated successfully');
        res.redirect('/translator/dashboard');
    } catch (error) {
        console.error('Error updating translator profile:', error);
        req.flash('error', 'Error updating profile: ' + error.message);
        res.redirect('/translator/profile/edit');
    }
});

module.exports = router; 