// Description: Contrôleur pour gérer les factures, y compris la création et la récupération de factures

const db = require("../db");

// Créer une facture avec gestion de stock
exports.createFacture = async (req, res) => {
  const { client_id, date_facture, liste_articles, prix_total, created_by_id ,Objet,commentaire  } = req.body;

  if (!client_id || !liste_articles?.length || !prix_total) {
    return res.status(400).json({ message: "Données manquantes ou invalides" });
  }

  db.beginTransaction(async (err) => {
    if (err) {
      return res.status(500).json({ message: "Erreur de transaction" });
    }

    try {
      // 1. Vérifier le client
      db.query(
        "SELECT id FROM clients WHERE id = ?", 
        [client_id],
        async (err, client) => {
          if (err) throw err;
          if (client.length === 0) {
            return db.rollback(() => {
              res.status(400).json({ message: "Client introuvable" });
            });
          }

          // 2. Générer le numéro de facture
          db.query(
            "SELECT numero_facture FROM factures ORDER BY id DESC LIMIT 1",
            async (err, lastFacture) => {
              if (err) throw err;
              
              const lastNum = lastFacture[0]?.numero_facture?.split('-')[1] || 0;
              const numero_facture = `4K-${String(parseInt(lastNum) + 1).padStart(3, '0')}`;

              // 3. Vérifier les stocks
              for (const article of liste_articles) {
                db.query(
                  "SELECT quantite FROM produits WHERE id = ?",
                  [article.produit_id],
                  (err, produit) => {
                    if (err) throw err;
                    if (produit.length === 0 || produit[0].quantite < article.quantite) {
                      return db.rollback(() => {
                        res.status(400).json({ 
                          message: `Stock insuffisant pour ${article.nom || article.produit_id}`
                        });
                      });
                    }
                  }
                );
              }

              // 4. Créer la facture
              db.query(
                "INSERT INTO factures SET ?",
                {
                  client_id,
                  numero_facture,
                  date_facture: date_facture || new Date().toISOString().split('T')[0],
                  liste_articles: JSON.stringify(liste_articles),
                  prix_total,
                  created_by_id ,// Seulement l'ID
                  Objet,
                  commentaire
                },
                (err, result) => {
                  if (err) throw err;

                  // 5. Mettre à jour les stocks
                  const updates = liste_articles.map(article => {
                    return new Promise((resolve, reject) => {
                      db.query(
                        "UPDATE produits SET quantite = quantite - ? WHERE id = ?",
                        [article.quantite, article.produit_id],
                        (err) => err ? reject(err) : resolve()
                      );
                    });
                  });

                  Promise.all(updates)
                    .then(() => {
                      db.commit((err) => {
                        if (err) throw err;
                        res.status(201).json({
                          success: true,
                          id: result.insertId,
                          numero_facture
                        });
                      });
                    })
                    .catch(err => {
                      db.rollback(() => {
                        throw err;
                      });
                    });
                }
              );
            }
          );
        }
      );
    } catch (error) {
      db.rollback(() => {
        console.error("Erreur DB:", error);
        res.status(500).json({ 
          message: "Échec de création de la facture",
          error: error.message 
        });
      });
    }
  });
};
























// Dans votre backend (factureController.js)
exports.deleteFacture = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM factures WHERE id = ?';
    db.query(query, [id], (err, result) => {
      if (err) throw err;
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Facture non trouvée" });
      }
      
      res.status(200).json({ message: "Facture supprimée avec succès" });
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la facture",
      error: error.message 
    });
  }
};





exports.getAllFactures = async (req, res) => {
  try {
    const query = `
            SELECT 
        f.*, 
        u.nom, 
        u.prenom,
        CONCAT(u.nom, ' ', u.prenom) AS created_by_fullname
      FROM factures f
      LEFT JOIN users u ON f.created_by_id = u.id
      ORDER BY f.date_facture DESC, f.id DESC

    `;
    
    db.query(query, (err, results) => {
      if (err) throw err;
      
      const factures = results.map(facture => ({
        ...facture,
        created_by: facture.nom && facture.prenom 
          ? `${facture.nom} ${facture.prenom}` 
          : 'Utilisateur inconnu'
      }));
      
      res.status(200).json(factures);
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Erreur lors de la récupération des factures",
      error: error.message 
    });
  }
};