const express = require('express');
const userController = require('../controllers/userControllerCRUD');
const router = express.Router();

router.get('/list', userController.getUsers);

router.delete('/:id', userController.deleteUser);

router.put('/update/:id', userController.updateUser);



module.exports = router;