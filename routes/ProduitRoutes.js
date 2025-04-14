const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');

// Routes pour les produits
router.get('/produits', produitController.getAllProduits);
router.post('/produits', produitController.createProduit);
router.put('/produits/:id', produitController.updateProduit);
router.delete('/produits/:id', produitController.deleteProduit);
router.put('/produits/:id/add', produitController.addQuantite);
module.exports = router;