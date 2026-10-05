# Configuration Beaufort

1. Dans le fichier Google Sheets existant, ouvrir **Extensions → Apps Script**.
2. Copier `Code.gs` dans l’éditeur. Remplacer l’ancien `doPost` s’il existe : ne pas garder deux fonctions portant ce nom.
3. Exécuter **setupBeaufort** et autoriser le script. Il crée **Reponses Beaufort** et **Tableau de bord Beaufort**. Si Reponses Beaufort existe déjà, il ajoute les colonnes de participation et d’utilisation aux lignes existantes. Les anciennes lignes de **sondage**, avec le schéma de huit colonnes du script précédent, sont copiées sans modifier cet onglet. Les anciens codes et les anciennes participations sont conservés. Ne pas déplacer les lignes de sondage entre deux exécutions de setupBeaufort : l’identifiant d’import utilise le numéro de ligne.
4. Déployer en **application Web**, exécutée en tant que propriétaire, accessible à **Tout le monde**. Pour un déploiement existant, sélectionner une nouvelle version dans la gestion des déploiements.
5. Renseigner l’URL `/exec` dans **WEBHOOK_URL** sur Vercel puis redéployer le projet avec le dossier `api/`. La variable existante **VITE_WEBHOOK_URL** fonctionne aussi comme solution de compatibilité. En local, `.env.local` accepte ces deux noms, puis `npm run dev` fournit aussi l’API. `npm run preview` sert seulement les fichiers statiques et ne fournit pas l’API.
6. Dans le partage du Google Sheets, choisir **Accès général → Limité** et donner l’accès uniquement au patron et aux personnes autorisées. La feuille contient des contacts, des codes et des identifiants permettant de retrouver un résultat. L’application Web Apps Script reste accessible au public pour recevoir les participations ; elle ne retourne aucune liste de clients.
7. Faire une participation avec un numéro de test : vérifier que la ligne apparaît **avant** de gratter, puis gratter, recharger et vérifier que le même résultat apparaît. Cliquer sur Rejouer et participer avec le même numéro : une nouvelle ligne et un nouveau tirage doivent être créés.

Le tableau de bord suit le nombre de réponses, les trois moyennes, les clients avec au moins une note ≤ 2, les commentaires, les lots gagnés et les sources de découverte. Filtrer les réponses pour lire les commentaires associés aux mauvaises notes.

## Jeu et suivi des cadeaux

L’avis est sauvegardé au clic sur **Envoyer mon avis et jouer**, avant l’accès à la carte. Une API Vercel appelle Apps Script et confirme l’enregistrement ; une erreur laisse le formulaire disponible pour réessayer. Un avis abandonné avant ce clic reste non enregistré.

Le script attribue un lot une seule fois sous verrou, avec les probabilités existantes (4 % par cadeau, 80 % sans lot), et génère le code. Le grattage révèle ce résultat sans refaire de tirage. Le navigateur conserve uniquement un identifiant de participation : un rechargement retrouve la carte ou le résultat. Les tentatives répétées après une coupure réseau restent sans doublon.

**Plusieurs participations par numéro sont autorisées** (`CAMPAIGN` dans le script). Le bouton **Rejouer** ouvre un nouveau questionnaire avec un nouvel identifiant. Chaque partie produit une ligne et un tirage distincts. Recharger ou répéter une requête pour la même partie conserve son résultat sans doublon. Les formats ivoiriens local, +225 et 00225 sont normalisés. Pour une autre opération, changer volontairement CAMPAIGN et la clé locale du frontend. Les anciens résultats de l’opération précédente ne sont alors plus accessibles par le parcours actuel.

Pour valider un cadeau, recharger le Google Sheets puis ouvrir **Beaufort → Vérifier / utiliser un code**. Saisir le code présenté, vérifier le cadeau et le numéro du client, puis confirmer son utilisation. Le script renseigne **Code utilisé le** et refuse toute seconde utilisation, même si deux personnes tentent de le valider simultanément. Il ne propose pas de validation de code par l’API publique.

Le script v2 est indispensable : l’API refuse une réponse d’un ancien script au lieu d’annoncer un enregistrement non confirmé. Mettre à jour Apps Script **avant** de déployer le frontend. Aucun service payant supplémentaire n’est ajouté ; les quotas gratuits habituels de Vercel et Google restent applicables.

## Erreur d’enregistrement

Le serveur vérifie d’abord l’URL `/exec?action=health` avec une requête GET sans écriture. Le script à jour doit retourner `{"version":2,"ok":true}`. Une page HTML « Fonction de script introuvable : doGet » signifie que le déploiement n’inclut pas le script fourni ici. Copier le fichier complet, exécuter setupBeaufort, puis modifier le déploiement existant avec **Nouvelle version** ; enregistrer le code dans l’éditeur seul ne met pas l’application Web à jour.

Le diagnostic `SETUP_REQUIRED` indique que setupBeaufort n’a pas été exécuté ou que les colonnes attendues manquent. `SCRIPT_UPDATE_REQUIRED` indique un script incompatible ou une réponse Google non JSON. `GOOGLE_ACCESS` indique une réponse HTTP d’erreur : vérifier le déploiement et les autorisations. Ces codes figurent dans le terminal local / les logs Vercel, sans coordonnées client.

## WhatsApp — Green API existante

Le script conserve l’envoi du résultat par Green API, uniquement lors de la première révélation. L’enregistrement du questionnaire et les diagnostics n’envoient aucun message. Les lignes historiques ne reçoivent pas de nouveau message.

Dans **Apps Script → Paramètres du projet → Propriétés du script**, renseigner :

- **GREEN_API_ID_INSTANCE** : l’identifiant de l’instance existante.
- **GREEN_API_TOKEN_INSTANCE** : le nouveau jeton après renouvellement du jeton partagé dans la conversation.
- **GREEN_API_URL** : l’apiUrl de l’instance indiqué par la console Green API. À défaut, le script conserve `https://api.green-api.com`, utilisé par l’ancien script.

Ne pas coller ces identifiants dans le code, dans Git ou dans des variables VITE. Les autorisations Apps Script doivent permettre UrlFetchApp ; relancer setupBeaufort et accepter les autorisations demandées lors de l’installation.

Les colonnes **WhatsApp statut** et **WhatsApp ID message** suivent la tentative. « Accepté par Green API » signifie que l’API a accepté le message, pas que WhatsApp l’a livré. Une erreur WhatsApp ne supprime ni l’avis ni le cadeau. Pour éviter les doublons après un timeout, il n’y a pas de renvoi automatique : vérifier la console Green API si le statut est incertain. Sans identifiants, le jeu fonctionne mais le statut est « Non configuré ».

Le script corrige aussi la normalisation des numéros ivoiriens : un numéro local de dix chiffres conserve son zéro initial dans le format international +225. Les messages sans lot remercient le client sans l’inviter à rejouer à cette même opération.

### Vérification du destinataire et anciens comptes

Avant chaque envoi, le script appelle `checkWhatsapp` avec le numéro complet et `force: true`, puis utilise le `chatId` reconnu par Green API (y compris `@lid`). Le numéro saisi et le numéro normalisé restent conservés dans la feuille. Aucun préfixe opérateur n’est supprimé automatiquement.

Si un client confirme que son compte est resté enregistré sous son ancien numéro, le salon peut ajouter une correspondance dans la propriété de script **GREEN_API_VERIFIED_PHONE_ALIASES**. Sa valeur est un objet JSON : les clés sont les numéros actuels complets, les valeurs les anciens numéros internationaux confirmés, sans `+`, espace ni suffixe. Ne créer une correspondance qu’après confirmation du titulaire et un test de réception. Garder ces données dans les propriétés du script, pas dans le dépôt.

Le numéro actuel est toujours vérifié en premier. Si aucun compte n’est trouvé et qu’une correspondance confirmée existe, l’ancien numéro est vérifié à son tour. Sans correspondance ou sans compte reconnu, la feuille indique **Compte WhatsApp non trouvé — vérifier avec le client**. Une erreur de vérification ou de quota est aussi inscrite, sans envoi et sans perdre la participation. Chaque révélation déclenche au maximum un envoi ; changer une correspondance ne renvoie pas les messages des participations déjà révélées.

Pour activer cette mise à jour, remplacer le code complet par `Code.gs`, enregistrer, puis **Déployer → Gérer les déploiements → crayon → Nouvelle version → Déployer**, sur le déploiement existant. L’URL `/exec` et la configuration Vercel restent les mêmes. Vérifier ensuite avec un nouveau numéro de test autorisé ; ne pas supprimer une vraie participation pour refaire un tirage.

Documentation du fournisseur : [CheckWhatsapp](https://green-api.com/en/docs/api/service/CheckWhatsapp/).

