# Configuration Beaufort

1. Dans le fichier Google Sheets existant, ouvrir **Extensions → Apps Script**.
2. Copier `Code.gs` dans l’éditeur. Remplacer l’ancien `doPost` s’il existe : ne pas garder deux fonctions portant ce nom.
3. Exécuter **setupBeaufort** et autoriser le script. Il crée **Reponses Beaufort** et **Tableau de bord Beaufort**. Si Reponses Beaufort existe déjà, il ajoute les colonnes de participation et d’utilisation aux lignes existantes. Les anciennes lignes de **sondage**, avec le schéma de huit colonnes du script précédent, sont copiées sans modifier cet onglet. Les anciens codes et les anciennes participations sont conservés. Ne pas déplacer les lignes de sondage entre deux exécutions de setupBeaufort : l’identifiant d’import utilise le numéro de ligne.
4. Déployer en **application Web**, exécutée en tant que propriétaire, accessible à **Tout le monde**. Pour un déploiement existant, sélectionner une nouvelle version dans la gestion des déploiements.
5. Renseigner l’URL `/exec` dans **WEBHOOK_URL** sur Vercel puis redéployer le projet avec le dossier `api/`. La variable existante **VITE_WEBHOOK_URL** fonctionne aussi comme solution de compatibilité. En local, `.env.local` accepte ces deux noms, puis `npm run dev` fournit aussi l’API. `npm run preview` sert seulement les fichiers statiques et ne fournit pas l’API.
6. Dans le partage du Google Sheets, choisir **Accès général → Limité** et donner l’accès uniquement au patron et aux personnes autorisées. La feuille peut contenir des coordonnées historiques, des codes et des identifiants permettant de retrouver un résultat. L’application Web Apps Script reste accessible au public pour recevoir les participations ; elle ne retourne aucune liste de clients.
7. Faire une participation de test : vérifier que la ligne apparaît **avant** de gratter, puis gratter, recharger et vérifier que le même résultat apparaît. Cliquer sur Rejouer : une nouvelle ligne et un nouveau tirage doivent être créés.

Le tableau de bord suit le nombre de réponses, les trois moyennes, les clients avec au moins une note ≤ 2, les commentaires, les lots gagnés et les sources de découverte. Filtrer les réponses pour lire les commentaires associés aux mauvaises notes.

## Jeu et suivi des cadeaux

L’avis est sauvegardé au clic sur **Envoyer mon avis et jouer**, avant l’accès à la carte. Une API Vercel appelle Apps Script et confirme l’enregistrement ; une erreur laisse le formulaire disponible pour réessayer. Un avis abandonné avant ce clic reste non enregistré.

Le script attribue un lot une seule fois sous verrou, avec les probabilités existantes (4 % par cadeau, 80 % sans lot), et génère le code. Le grattage révèle ce résultat sans refaire de tirage. Le navigateur conserve uniquement un identifiant de participation : un rechargement retrouve la carte ou le résultat. Les tentatives répétées après une coupure réseau restent sans doublon.

**Plusieurs participations par numéro sont autorisées** (`CAMPAIGN` dans le script). Le bouton **Rejouer** ouvre un nouveau questionnaire avec un nouvel identifiant. Chaque partie produit une ligne et un tirage distincts. Recharger ou répéter une requête pour la même partie conserve son résultat sans doublon. Les formats ivoiriens local, +225 et 00225 sont normalisés. Pour une autre opération, changer volontairement CAMPAIGN et la clé locale du frontend. Les anciens résultats de l’opération précédente ne sont alors plus accessibles par le parcours actuel.

Pour valider un cadeau, recharger le Google Sheets puis ouvrir **Beaufort → Vérifier / utiliser un code**. Saisir le code présenté, vérifier le cadeau et le numéro du client, puis confirmer son utilisation. Le script renseigne **Code utilisé le** et refuse toute seconde utilisation, même si deux personnes tentent de le valider simultanément. Il ne propose pas de validation de code par l’API publique.

Le script v2 est indispensable : l’API refuse une réponse d’un ancien script au lieu d’annoncer un enregistrement non confirmé. Mettre à jour Apps Script **avant** de déployer le frontend. Aucun service payant supplémentaire n’est ajouté ; les quotas gratuits habituels de Vercel et Google restent applicables.

## Erreur d’enregistrement

Le serveur vérifie d’abord l’URL `/exec?action=health` avec une requête GET sans écriture. Le script à jour doit retourner `{"version":2,"ok":true,"revision":"identity-after-result-v5"}`. Le proxy Vercel bloque tout ancien déploiement avant d’envoyer une participation. Une page HTML « Fonction de script introuvable : doGet » signifie que le déploiement n’inclut pas le script fourni ici. Copier le fichier complet, exécuter setupBeaufort, puis modifier le déploiement existant avec **Nouvelle version** ; enregistrer le code dans l’éditeur seul ne met pas l’application Web à jour.

Le diagnostic `SETUP_REQUIRED` indique que setupBeaufort n’a pas été exécuté ou que les colonnes attendues manquent. `SCRIPT_UPDATE_REQUIRED` indique un script incompatible ou une réponse Google non JSON. `GOOGLE_ACCESS` indique une réponse HTTP d’erreur : vérifier le déploiement et les autorisations. Ces codes figurent dans le terminal local / les logs Vercel, sans coordonnées client.

## Résultat et WhatsApp

Le résultat est conservé dans Google Sheets et réaffiché dans l’application après rechargement. Aucune coordonnée n’est demandée avant le jeu. Un gagnant doit saisir son nom complet (au moins deux éléments, nom et prénom) et son numéro WhatsApp pour réclamer son cadeau ; l’application les ajoute à sa ligne de participation (colonnes B, C et Q), et le menu de validation refuse un code gagnant sans ces coordonnées. Le consentement aux actualités/offres WhatsApp est une case séparée, facultative et décochée par défaut : il est stocké en colonnes V (Oui/Non) et W (date d’accord), sans conditionner le cadeau. Les anciens joueurs sans choix enregistré ne doivent pas être considérés comme consentants. Pour un non-gagnant, les coordonnées restent facultatives et Rejouer est disponible sans inscription. Un gagnant inscrit peut ouvrir lui-même WhatsApp pour envoyer au salon un message prérempli avec son code, ou inviter un proche à jouer. Aucun message automatique n’est envoyé via Green API. Les anciennes coordonnées déjà dans la feuille restent conservées.

Pour activer le consentement, remplacer le code complet par `Code.gs`, enregistrer et exécuter `setupBeaufort` afin d’ajouter les colonnes V et W sans supprimer les réponses existantes. Puis **Déployer → Gérer les déploiements → crayon → Nouvelle version → Déployer**, sur le déploiement existant. L’URL `/exec` et la configuration Vercel restent les mêmes. Mettre Apps Script à jour avant de redéployer le frontend Vercel.

