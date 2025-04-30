const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const projectRoutes = require('./projects');

// Mount all translator routes
router.use('/', authRoutes);
router.use('/projects', projectRoutes);

module.exports = router; 