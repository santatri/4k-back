const db = require('../db');


  // Récupérer tous les utilisateurs
  exports.getUsers = (req, res) => {
    const query = 'SELECT id, nom, prenom, email, role, image, created_at, validated FROM users';
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        return res.status(500).send('Erreur interne du serveur');
      }
      res.status(200).json(result);
    });
  };
  
  // suppression  de liste
  // Suppression d'un utilisateur
  exports.deleteUser = (req, res) => {
    const { id } = req.params;
  
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    db.query(deleteQuery, [id], (err, result) => {
      if (err) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', err);
        return res.status(500).send('Erreur interne du serveur');
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('Utilisateur non trouvé');
      }
      res.status(200).send({ message: 'Utilisateur supprimé avec succès' });
    });
  };
  
  
  // Mettre à jour les informations d'un utilisateur
  exports.updateUser = (req, res) => {
    const { id } = req.params;
    const { nom, prenom, email, role } = req.body;
  
    const updateQuery = `
      UPDATE users
      SET nom = ?, prenom = ?, email = ?, role = ?
      WHERE id = ?
    `;
  
    db.query(updateQuery, [nom, prenom, email, role, id], (err, result) => {
      if (err) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
        return res.status(500).send('Erreur interne du serveur');
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('Utilisateur non trouvé');
      }
      res.status(200).send({ message: 'Utilisateur mis à jour avec succès' });
    });
  };
  