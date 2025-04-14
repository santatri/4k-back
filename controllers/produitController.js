// produitController.js
const db = require('../db');

// Récupérer tous les produits
exports.getAllProduits = (req, res) => {
    const query = 'SELECT id, nom, description, quantite, prix , unité FROM produits ORDER BY id DESC';

    db.query(query, (err, result) => {
        if (err) {
            console.error('Erreur lors de la récupération des produits:', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        res.status(200).json(result);
    });
};

// Créer un nouveau produit
exports.createProduit = async (req, res) => {
    const { nom, description, quantite, prix ,unité } = req.body;
    
    try {
        // 1. Vérifier si un produit avec le même nom existe déjà
        const checkQuery = 'SELECT * FROM produits WHERE nom = ?';
        db.query(checkQuery, [nom], async (error, results, fields) => {
            if (error) {
                console.error("Erreur vérification produit existant:", error);
                return res.status(500).json({ 
                    message: 'Erreur lors de la vérification du produit', 
                    error: error.message 
                });
            }

            // Si un produit existe déjà
            if (results.length > 0) {
                return res.status(409).json({ 
                    message: 'Un produit avec ce nom existe déjà' 
                });
            }

            // 2. Si le produit n'existe pas, procéder à l'insertion
            const insertQuery = 'INSERT INTO produits (nom, description, quantite, prix , unité) VALUES (?, ?, ?, ? , ?)';
            db.query(insertQuery, [nom, description, quantite, prix , unité], (error, results) => {
                if (error) {
                    console.error("Erreur insertion produit:", error);
                    return res.status(500).json({ 
                        message: 'Erreur lors de la création du produit', 
                        error: error.message 
                    });
                }

                // Retourner le produit créé
                res.status(201).json({
                    id: results.insertId,
                    nom,
                    description,
                    quantite,
                    prix,
                    unité
                });
            });
        });
    } catch (error) {
        console.error("Erreur backend:", error);
        res.status(500).json({ 
            message: 'Erreur lors de la création du produit', 
            error: error.message 
        });
    }
};

// Mettre à jour un produit existant
exports.updateProduit = async (req, res) => {
    const { id } = req.params;
    const { nom, description, quantite, prix , unité} = req.body;
    try {
        await db.query(
            'UPDATE produits SET nom = ?, description = ?, quantite = ?, prix = ? ,unité = ? WHERE id = ?',
            [nom, description, quantite, prix, unité, id]
        );
        res.json({ id, nom, description, quantite, prix , unité });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour du produit', error });
    }
};

// Supprimer un produit
exports.deleteProduit = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM produits WHERE id = ?', [id]);
        res.json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression du produit', error });
    }
};

exports.addQuantite = async (req, res) => {
    const { id } = req.params;
    const { quantite } = req.body;

    try {
        // Validation
        if (!id) {
            return res.status(400).json({ message: 'ID de produit requis' });
        }

        const quantiteAAjouter = parseInt(quantite);
        if (isNaN(quantiteAAjouter)) {
            return res.status(400).json({ message: 'La quantité doit être un nombre' });
        }
        if (quantiteAAjouter < 1) {
            return res.status(400).json({ message: 'La quantité doit être positive' });
        }

        // 1. Récupérer le produit actuel (version pour mysql standard)
        db.query('SELECT * FROM produits WHERE id = ?', [id], async (err, rows) => {
            if (err) {
                console.error("Erreur SQL:", err);
                return res.status(500).json({ message: 'Erreur de base de données' });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Produit non trouvé' });
            }

            const produit = rows[0];
            const nouvelleQuantite = produit.quantite + quantiteAAjouter;

            // 2. Mettre à jour la quantité
            db.query(
                'UPDATE produits SET quantite = ? WHERE id = ?',
                [nouvelleQuantite, id],
                async (err, result) => {
                    if (err) {
                        console.error("Erreur SQL:", err);
                        return res.status(500).json({ message: 'Erreur de mise à jour' });
                    }

                    // 3. Récupérer le produit mis à jour
                    db.query('SELECT * FROM produits WHERE id = ?', [id], (err, updatedRows) => {
                        if (err) {
                            console.error("Erreur SQL:", err);
                            return res.status(500).json({ message: 'Erreur de récupération' });
                        }

                        const updatedProduit = updatedRows[0];
                        res.json({
                            success: true,
                            data: updatedProduit,
                            message: `Quantité ajoutée avec succès (+${quantiteAAjouter})`
                        });
                    });
                }
            );
        });
    } catch (err) {
        console.error("Erreur addQuantite:", err);
        res.status(500).json({ 
            success: false,
            message: err.message || "Erreur serveur"
        });
    }
};