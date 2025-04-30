const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const projectRoutes = require('./projects');

// Mount all client routes
router.use('/', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/projects', projectRoutes);

module.exports = router; 