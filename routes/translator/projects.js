const express = require('express');
const router = express.Router();
const Project = require('../../models/project');

// Middleware to check if translator is authenticated
const isTranslatorAuthenticated = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isTranslator) {
        req.flash('error', 'Please login as a translator first');
        return res.redirect('/translator/login');
    }
    next();
};

// View Available Projects
router.get('/projects', isTranslatorAuthenticated, async (req, res) => {
    try {
        const projects = await Project.find({ 
            status: 'pending',
            translator: { $exists: false }
        }).populate('client', 'name profileImage');
        res.render('translator/projects/index', { projects });
    } catch (e) {
        req.flash('error', 'Error loading projects');
        res.redirect('/translator/dashboard');
    }
});

// View Project Details
router.get('/projects/:id', isTranslatorAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('client', 'name profileImage')
            .populate('translator', 'name profileImage');
        
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/translator/projects');
        }
        
        res.render('translator/projects/show', { project });
    } catch (e) {
        req.flash('error', 'Error loading project');
        res.redirect('/translator/projects');
    }
});

// Apply for Project
router.post('/projects/:id/apply', isTranslatorAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/translator/projects');
        }

        if (project.translator) {
            req.flash('error', 'Project already assigned');
            return res.redirect('/translator/projects');
        }

        project.translator = req.user._id;
        project.status = 'in_progress';
        await project.save();

        req.flash('success', 'Successfully applied for the project!');
        res.redirect(`/translator/projects/${project._id}`);
    } catch (e) {
        req.flash('error', 'Error applying for project');
        res.redirect('/translator/projects');
    }
});

// Add Message to Project
router.post('/projects/:id/messages', isTranslatorAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/translator/projects');
        }
        
        project.messages.push({
            sender: 'translator',
            content: req.body.content
        });
        
        await project.save();
        res.redirect(`/translator/projects/${project._id}`);
    } catch (e) {
        req.flash('error', 'Error sending message');
        res.redirect(`/translator/projects/${req.params.id}`);
    }
});

// Mark Project as Completed
router.post('/projects/:id/complete', isTranslatorAuthenticated, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            req.flash('error', 'Project not found');
            return res.redirect('/translator/dashboard');
        }

        if (project.translator.toString() !== req.user._id.toString()) {
            req.flash('error', 'Not authorized to complete this project');
            return res.redirect('/translator/dashboard');
        }

        project.status = 'completed';
        await project.save();

        req.flash('success', 'Project marked as completed!');
        res.redirect(`/translator/projects/${project._id}`);
    } catch (e) {
        req.flash('error', 'Error completing project');
        res.redirect('/translator/dashboard');
    }
});

module.exports = router; 