const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // JWT pour générer les tokens sécurisés
const multer = require('multer');

const SECRET_KEY = '8219'; // Remplacez par une clé secrète complexe
 
// Configuration Multer pour le téléchargement des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// Inscription d'un utilisateur
exports.registerUser = [ 
  upload.single('image'),
  (req, res) => {
  const { nom, prenom, email, mdp, confirmMdp, role } = req.body;
  const image = req.file ? req.file.filename : null;

  if (mdp !== confirmMdp) {
    return res.status(400).send({ message: 'Les mots de passe ne correspondent pas' });
  }

  try {
    // Vérifier si le email existe déjà
    const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkUserQuery, [email], async (err, result) => {
      if (err) return res.status(500).send('Erreur interne du serveur');
      if (result.length > 0) {
        return res.status(400).send('Le email est déjà utilisé');
      }

      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(mdp, 10);

      // Insérer l'utilisateur
      const insertQuery = `
        INSERT INTO users (nom, prenom, email, mdp, role, image, validated)
        VALUES (?, ?, ?, ?, ?, ?, FALSE)
      `;
      db.query(insertQuery, [nom, prenom, email, hashedPassword, role, image], (err, result) => {
        if (err) {
          console.error('Erreur lors de l\'insertion:', err);
          return res.status(500).send('Erreur interne du serveur');
        }
        res.status(201).send({ message: 'Inscription réussie. En attente de validation par l\'administrateur.' });
      });
    });
  } catch (err) {
    res.status(500).send('Erreur interne du serveur');
  }
},];
// Validation d'un utilisateur par l'admin
exports.validateUser = (req, res) => {
    const { id } = req.params;
  
    const updateQuery = 'UPDATE users SET validated = TRUE WHERE id = ?';
    db.query(updateQuery, [id], (err, result) => {
      if (err) {
        console.error('Erreur lors de la validation:', err);
        return res.status(500).send('Erreur interne du serveur');
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('Utilisateur non trouvé');
      }
      res.status(200).send({ message: 'Utilisateur validé avec succès' });
    });
  };

  exports.invalidateUser = (req, res) => {
    const { id } = req.params;
  
    const updateQuery = 'UPDATE users SET validated = FALSE WHERE id = ?';
    db.query(updateQuery, [id], (err, result) => {
      if (err) {
        console.error('Erreur lors de l’invalidation:', err);
        return res.status(500).send('Erreur interne du serveur');
      }
      if (result.affectedRows === 0) {
        return res.status(404).send('Utilisateur non trouvé');
      }
      res.status(200).send({ message: 'Validation de l’utilisateur annulée avec succès' });
    });
};

  // Récupérer les utilisateurs non validés
exports.getUnvalidatedUsers = (req, res) => {
    const query = 'SELECT id, nom, prenom, email, role, image,created_at FROM users WHERE validated = FALSE';
  
    db.query(query, (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération des utilisateurs non validés:', err);
        return res.status(500).send('Erreur interne du serveur');
      }
      res.status(200).json(result);
    });
  };


