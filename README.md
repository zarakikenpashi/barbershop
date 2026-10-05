# Beaufort Barbershop

Application de satisfaction client pour Le BeauFORT BarberShop. Le parcours commence par trois notes (coupe, accueil, attente), la source de découverte et un commentaire facultatif. La tranche d’âge est facultative ; le prénom et le WhatsApp sont demandés juste avant le jeu. L’avis est enregistré avant le grattage. Le résultat propose un partage sur WhatsApp ou ailleurs, sans coordonnées ni code cadeau.

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

Le tirage est effectué dans Apps Script et enregistré une seule fois par partie. Plusieurs parties sont autorisées avec le même numéro grâce au bouton Rejouer. Un identifiant conservé dans le navigateur permet de reprendre après rechargement. Les codes gagnants sont vérifiés et utilisés depuis le menu Le BeauFORT BarberShop dans Sheets. WhatsApp vérifie le compte destinataire et utilise uniquement des correspondances d’anciens numéros confirmées par le salon.

Les tests simulent les services Google : enregistrement, reprise, doublons, formats de téléphone, refus d’un lot imposé par le client, utilisation unique des codes et compatibilité du proxy. Une participation de test après déploiement reste nécessaire pour vérifier les accès réels.
