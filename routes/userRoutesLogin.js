const express = require('express');
const userController = require('../controllers/userControllerLogin');
const router = express.Router();

router.post('/login', userController.loginUser);

module.exports = router;
