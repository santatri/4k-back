const db = require('../db');

// Récupérer tous les utilisateurs
exports.getAllClients = (req, res) => {
    const query = 'SELECT id, nom, adresse, telephone, email FROM clients ORDER BY id DESC';
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        return res.status(500).send('Erreur interne du serveur');
      }
      res.status(200).json(result);
    });
  };

// controllers/clientController.js
const mysql = require('mysql');

exports.createClient = async (req, res) => {
    const { nom, adresse, telephone, email } = req.body;

    // Validation des données
    if (!nom || !telephone || !email) {
        return res.status(400).json({ 
            success: false,
            message: 'Nom, téléphone et email sont obligatoires' 
        });
    }

    // Vérification du format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false,
            message: 'Format d\'email invalide' 
        });
    }

    const connection = mysql.createConnection(db.config);

    try {
        // Vérification des doublons
        const checkDuplicateQuery = 
            'SELECT id FROM clients WHERE email = ? OR telephone = ? LIMIT 1';
        
        const duplicateCheck = await new Promise((resolve, reject) => {
            connection.query(
                checkDuplicateQuery, 
                [email, telephone], 
                (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                }
            );
        });

        if (duplicateCheck.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Un client avec cet email ou téléphone existe déjà'
            });
        }

        // Insertion du nouveau client
        const insertQuery = 
            'INSERT INTO clients (nom, adresse, telephone, email) VALUES (?, ?, ?, ?)';
        
        const insertResult = await new Promise((resolve, reject) => {
            connection.query(
                insertQuery,
                [nom, adresse, telephone, email],
                (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                }
            );
        });

        // Récupération du client créé
        const getClientQuery = 'SELECT * FROM clients WHERE id = ?';
        const client = await new Promise((resolve, reject) => {
            connection.query(
                getClientQuery,
                [insertResult.insertId],
                (error, results) => {
                    if (error) reject(error);
                    resolve(results[0]);
                }
            );
        });

        res.status(201).json({
            success: true,
            message: 'Client créé avec succès',
            client
        });

    } catch (error) {
        console.error('Erreur MySQL:', {
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });

        // Gestion des erreurs de duplication (au cas où la vérification préalable échoue)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Un client avec cet email ou téléphone existe déjà'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du client',
            ...(process.env.NODE_ENV === 'development' && {
                errorDetails: {
                    code: error.code,
                    sqlMessage: error.sqlMessage
                }
            })
        });
    } finally {
        connection.end(); // Fermer la connexion
    }
};


exports.updateClient = (req, res) => {
    const { id } = req.params;
    const { nom, adresse, telephone, email } = req.body;

    // 1. Vérifier si le numéro de téléphone existe déjà pour un autre client
    db.query(
        'SELECT id FROM clients WHERE telephone = ? AND id != ?',
        [telephone, id],
        (error, phoneResults) => {
            if (error) {
                console.error("Erreur vérification téléphone:", error);
                return res.status(500).json({ message: 'Erreur de vérification téléphone' });
            }

            if (phoneResults.length > 0) {
                return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé' });
            }

            // 2. Vérifier si l'email existe déjà pour un autre client
            db.query(
                'SELECT id FROM clients WHERE email = ? AND id != ?',
                [email, id],
                (error, emailResults) => {
                    if (error) {
                        console.error("Erreur vérification email:", error);
                        return res.status(500).json({ message: 'Erreur de vérification email' });
                    }

                    if (emailResults.length > 0) {
                        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
                    }

                    // 3. Si tout est bon, faire la mise à jour
                    db.query(
                        'UPDATE clients SET nom = ?, adresse = ?, telephone = ?, email = ? WHERE id = ?',
                        [nom, adresse, telephone, email, id],
                        (error, results) => {
                            if (error) {
                                console.error("Erreur mise à jour:", error);
                                return res.status(500).json({ message: 'Échec mise à jour' });
                            }

                            if (results.affectedRows === 0) {
                                return res.status(404).json({ message: 'Client non trouvé' });
                            }

                            res.json({ 
                                success: true,
                                message: 'Client mis à jour avec succès',
                                client: { id, nom, adresse, telephone, email }
                            });
                        }
                    );
                }
            );
        }
    );
};

exports.deleteClient = (req, res) => {
    const { id } = req.params;

    // Validation de l'ID
    if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'ID client invalide' });
    }

    // 1. Vérifier d'abord si le client existe
    db.query('SELECT id FROM clients WHERE id = ?', [id], (err, clientResults) => {
        if (err) {
            console.error('Erreur vérification client:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (clientResults.length === 0) {
            return res.status(404).json({ message: 'Client non trouvé' });
        }

        // 2. Vérifier les factures associées
        db.query('SELECT id FROM factures WHERE client_id = ? LIMIT 1', [id], (err, factureResults) => {
            if (err) {
                console.error('Erreur vérification factures:', err);
                // On continue quand même la suppression (à adapter selon vos besoins)
            }

            if (factureResults && factureResults.length > 0) {
                return res.status(409).json({ 
                    message: 'Impossible de supprimer il a une facture associée',
                    reason: 'Des factures sont associées à ce client'
                });
            }

            // 3. Suppression du client
            db.query('DELETE FROM clients WHERE id = ?', [id], (err, result) => {
                if (err) {
                    console.error('Erreur suppression:', err);
                    
                    // Gestion spécifique des contraintes FOREIGN KEY
                    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                        return res.status(409).json({
                            message: 'Suppression bloquée',
                            reason: 'Ce client est référencé dans d\'autres tables'
                        });
                    }
                    
                    return res.status(500).json({ message: 'Erreur lors de la suppression' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Aucun client supprimé' });
                }

                res.json({ 
                    success: true,
                    message: `Client ${id} supprimé avec succès`
                });
            });
        });
    });
};

// Récupérer un client par son ID
exports.getClientById = async (req, res) => {
    const connection = mysql.createConnection(db.config);
    
    try {
        const [client] = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT * FROM clients WHERE id = ?', 
                [req.params.id], 
                (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                }
            );
        });
        
        if (!client) {
            return res.status(404).json({ 
                success: false,
                message: 'Client non trouvé' 
            });
        }
        
        res.status(200).json({
            success: true,
            client
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération du client',
            error: error.message 
        });
    } finally {
        connection.end();
    }
};

// Récupérer les factures d'un client
exports.getClientFactures = async (req, res) => {
    const connection = mysql.createConnection(db.config);
    
    try {
        // Vérifier que le client existe
        const [client] = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT id FROM clients WHERE id = ?', 
                [req.params.id], 
                (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                }
            );
        });
        
        if (!client) {
            return res.status(404).json({ 
                success: false,
                message: 'Client non trouvé' 
            });
        }
        
        // Récupérer les factures
        const factures = await new Promise((resolve, reject) => {
            connection.query(
                'SELECT id, numero_facture, date_facture, Objet, prix_total FROM factures WHERE client_id = ? ORDER BY date_facture DESC', 
                [req.params.id], 
                (error, results) => {
                    if (error) reject(error);
                    resolve(results);
                }
            );
        });
        
        res.status(200).json({
            success: true,
            factures
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération des factures',
            error: error.message 
        });
    } finally {
        connection.end();
    }
};

// Récupérer les clients fidèles (avec statistiques)
exports.getLoyalClients = (req, res) => {
    const query = `
        SELECT 
            c.id, 
            c.nom, 
            c.adresse, 
            c.telephone, 
            c.email,
            COUNT(f.id) AS nombre_factures,
            SUM(f.prix_total) AS total_depense,
            MAX(f.prix_total) AS facture_max
        FROM clients c
        LEFT JOIN factures f ON c.id = f.client_id
        GROUP BY c.id
        HAVING nombre_factures > 0
        ORDER BY nombre_factures DESC, total_depense DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération des clients fidèles:', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        
        // Ajouter un indicateur de fidélité
        const clientsWithLoyalty = results.map(client => ({
            ...client,
            isLoyal: client.nombre_factures >= 3 || client.total_depense >= 1000 // seuil à ajuster
        }));
        
        res.status(200).json(clientsWithLoyalty);
    });
};