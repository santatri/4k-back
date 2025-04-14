const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // JWT pour générer les tokens sécurisés

const SECRET_KEY = '8219'; // Remplacez par une clé secrète complexe


// Connexion d'un utilisateur
// exports.loginUser = async (req, res) => {
//     const { email, mdp } = req.body;
  
//     if (!email || !mdp) {
//       return res.status(400).send({ message: 'Veuillez fournir le email et le mot de passe.' });
//     }
  
//     try {
//       // Vérifier si le email existe
//       const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
//       db.query(checkUserQuery, [email], async (err, result) => {
//         if (err) {
//           console.error('Erreur lors de la vérification de l\'utilisateur:', err);
//           return res.status(500).send('Erreur interne du serveur');
//         }
  
//         if (result.length === 0) {
//           return res.status(404).send({ message: 'Utilisateur introuvable.' });
//         }
  
//         const user = result[0];
  
//         // Vérifier si l'utilisateur est validé
//         if (!user.validated) {
//           return res.status(403).send({ message: 'Votre compte n\'est pas encore validé par l\'administrateur.' });
//         }
  
//         // Vérifier le mot de passe
//         const isMatch = await bcrypt.compare(mdp, user.mdp);
//         if (!isMatch) {
//           return res.status(401).send({ message: 'Mot de passe incorrect.' });
//         }
  
//         // Générer un token JWT
//         const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        
//         res.status(200).send({
//           message: 'Connexion réussie',
//           token,
//           user: {
//             id: user.id,
//             nom: user.nom,
//             prenom: user.prenom,
//             role: user.role,
//             image: user.image  // Inclure l'image de l'utilisateur
//           },
//         });
//       });
//     } catch (err) {
//       res.status(500).send('Erreur interne du serveur');
//     }
//   };
exports.loginUser = async (req, res) => {
  const { email, mdp } = req.body;

  if (!email || !mdp) {
      return res.status(400).json({ 
          success: false,
          message: 'Email et mot de passe requis' 
      });
  }

  try {
      const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
      db.query(checkUserQuery, [email], async (err, result) => {
          if (err) {
              console.error('Erreur DB:', err);
              return res.status(500).json({
                  success: false,
                  message: 'Erreur serveur'
              });
          }

          if (result.length === 0) {
              return res.status(404).json({
                  success: false,
                  message: 'Utilisateur non trouvé'
              });
          }

          const user = result[0];

          if (!user.validated) {
              return res.status(403).json({
                  success: false,
                  message: 'Compte en attente de validation'
              });
          }

          const isMatch = await bcrypt.compare(mdp, user.mdp);
          if (!isMatch) {
              return res.status(401).json({
                  success: false,
                  message: 'Mot de passe incorrect'
              });
          }

          const token = jwt.sign(
              { id: user.id, role: user.role }, 
              SECRET_KEY, 
              { expiresIn: '1h' }
          );

          // Réponse standardisée
          res.status(200).json({
              success: true,
              message: 'Connexion réussie',
              token,
              user: {
                  id: user.id,
                  email: user.email,
                  nom: user.nom,
                  prenom: user.prenom,
                  role: user.role,
                  image: user.image
              }
          });
      });
  } catch (err) {
      console.error('Erreur login:', err);
      res.status(500).json({
          success: false,
          message: 'Erreur serveur'
      });
  }
};
    