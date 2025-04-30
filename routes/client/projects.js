const express = require('express');
const router = express.Router();
const Project = require('../../models/project');
const multer = require('multer');
const { storage } = require('../../cloudinary');
const upload = multer({ storage });

// Middleware to check if client is authenticated
const isClientAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login first');
        return res.redirect('/client/login');
    }
    next();
};

// Create New Project
router.get('/projects/new', isClientAuthenticated, (req, res) => {
    res.render('client/projects/new', { client: req.user });
});

router.post('/projects', isClientAuthenticated, upload.array('files'), async (req, res) => {
    try {
        const project = new Project(req.body.project);
        project.client = req.user._id;
        
        if (req.files) {
            project.files = req.files.map(f => ({
                url: f.path,
                filename: f.filename,
                originalName: f.originalname,
                size: f.size
            }));
        }
        
        await project.save();
        req.flash('success', 'Project created successfully!');
        res.redirect(`/client/projects/${project._id}`);
    } catch (e) {
        req.flash('error', 'Error creating project');
        res.redirect('/client/projects/new');
    }
});

// View Project
router.get('/projects/:id', isClientAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('translator', 'name profileImage')
            .populate('client', 'name profileImage');
        
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }
        
        res.render('client/projects/show', { project });
    } catch (e) {
        req.flash('error', 'Error loading project');
        res.redirect('/client/dashboard');
    }
});

// Edit Project
router.get('/projects/:id/edit', isClientAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }
        res.render('client/projects/edit', { project });
    } catch (e) {
        req.flash('error', 'Error loading project');
        res.redirect('/client/dashboard');
    }
});

router.put('/projects/:id', isClientAuthenticated, upload.array('files'), async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }
        
        Object.assign(project, req.body.project);
        
        if (req.files) {
            project.files.push(...req.files.map(f => ({
                url: f.path,
                filename: f.filename,
                originalName: f.originalname,
                size: f.size
            })));
        }
        
        await project.save();
        req.flash('success', 'Project updated successfully!');
        res.redirect(`/client/projects/${project._id}`);
    } catch (e) {
        req.flash('error', 'Error updating project');
        res.redirect(`/client/projects/${req.params.id}/edit`);
    }
});

// Delete Project
router.delete('/projects/:id', isClientAuthenticated, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        req.flash('success', 'Project deleted successfully!');
        res.redirect('/client/dashboard');
    } catch (e) {
        req.flash('error', 'Error deleting project');
        res.redirect('/client/dashboard');
    }
});

// Add Message to Project
router.post('/projects/:id/messages', isClientAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }
        
        project.messages.push({
            sender: 'client',
            content: req.body.content
        });
        
        await project.save();
        res.redirect(`/client/projects/${project._id}`);
    } catch (e) {
        req.flash('error', 'Error sending message');
        res.redirect(`/client/projects/${req.params.id}`);
    }
});

// Rate and Review Project
router.post('/projects/:id/review', isClientAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/client/dashboard');
        }
        
        project.rating = req.body.rating;
        project.review = req.body.review;
        
        await project.save();
        req.flash('success', 'Thank you for your review!');
        res.redirect(`/client/projects/${project._id}`);
    } catch (e) {
        req.flash('error', 'Error submitting review');
        res.redirect(`/client/projects/${req.params.id}`);
    }
});

module.exports = router; 