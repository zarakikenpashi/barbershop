# Beaufort Barbershop

Application de satisfaction client pour Le BeauFORT BarberShop. Le parcours commence par trois notes (coupe, accueil, attente), la source de découverte et un commentaire facultatif. La tranche d’âge est facultative ; aucune coordonnée n’est demandée avant le jeu. Après le résultat, seuls les gagnants doivent enregistrer leur nom complet et leur WhatsApp pour réclamer leur cadeau. Le consentement à recevoir des actualités et offres WhatsApp est distinct, facultatif et décoché par défaut. Pour les autres, les coordonnées restent facultatives et Rejouer est disponible sans inscription. Le résultat reste visible dans l’application ; le joueur peut choisir d’écrire au salon sur WhatsApp pour présenter son code ou d’inviter un proche à jouer.

## Développement

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
```

Le frontend utilise React, Vite et Tailwind CSS. Le dossier `api/` fournit l’API Vercel ; Vite fournit son équivalent en développement. Une prévisualisation statique (`npm run preview`) ne fournit pas cette API.

## Google Sheets et déploiement

Suivre [le guide d’installation](google-apps-script/INSTALLATION.md) et installer [le script Apps Script](google-apps-script/Code.gs) avant de déployer le frontend. Le webhook est fourni par la variable serveur `WEBHOOK_URL` (ou `VITE_WEBHOOK_URL` pour compatibilité).

Le tirage est effectué dans Apps Script et enregistré une seule fois par partie. Le bouton Rejouer permet plusieurs participations. Un identifiant conservé dans le navigateur permet de reprendre après rechargement. Les codes gagnants sont vérifiés et utilisés depuis le menu Le BeauFORT BarberShop dans Sheets. Aucun message WhatsApp automatique n’est envoyé.

Les tests simulent les services Google : enregistrement, reprise, doublons, formats de téléphone, refus d’un lot imposé par le client, utilisation unique des codes et compatibilité du proxy. Une participation de test après déploiement reste nécessaire pour vérifier les accès réels.
