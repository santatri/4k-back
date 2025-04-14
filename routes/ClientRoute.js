const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/ClientsController');

router.get('/', clientsController.getAllClients);
router.get('/:id', clientsController.getClientById);
router.get('/:id/factures', clientsController.getClientFactures);
router.post('/', clientsController.createClient);
router.put('/:id', clientsController.updateClient);
router.delete('/:id', clientsController.deleteClient);
router.get('/loyal/clients', clientsController.getLoyalClients);
module.exports = router;