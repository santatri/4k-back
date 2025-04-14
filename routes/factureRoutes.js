const express = require("express");
const factureController = require("../controllers/factureController");

const router = express.Router();

router.post("/", factureController.createFacture);
router.get("/", factureController.getAllFactures);
// router.put("/:id/annuler", factureController.annulerFacture);
// router.put("/:id/modifier", factureController.modifierFacture);
// Dans vos routes
router.delete('/:id', factureController.deleteFacture);

module.exports = router;