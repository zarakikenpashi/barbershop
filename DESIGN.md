# Interface Beaufort

Direction demandée : une application web inspirée des interfaces Apple/iOS, avec l’accent or de Beaufort. Ce n’est pas une application iOS native.

## Système visuel

- Police système : -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, sans-serif. Aucun téléchargement de police.
- Fond groupé #f5f5f7 ; surfaces #ffffff ; texte principal #1d1d1f ; secondaire #68686d ; séparateurs #e5e5ea.
- Accent Beaufort #efc44a, texte sombre pour les boutons ; sélection discrète #fff7df. Bleu #0066cc pour le retour et les actions secondaires.
- Grands titres 34px, 700, tracking -0.035em ; corps 17px ; légendes 13px. Contrôles au moins 44px.
- Listes groupées avec séparateurs, coins 16px. Boutons principaux 56px, coins 16px. Photo d’accueil 24px. Surfaces sans ombres intérieures.
- En-tête translucide uniquement pour préserver la lisibilité du contenu au défilement. Une seule transition brève entre étapes, désactivée avec prefers-reduced-motion.

## Composition et états

Application mobile sans fausse barre de statut ni faux cadre iPhone. Sur grand écran, une seule fenêtre de 460px au centre d’un fond neutre ; sur petit écran, pleine largeur et safe areas. Accueil avec nom, photographie existante, grand titre, invitation à donner son avis et action principale. Écrans suivants : retour, progression, titre, contenu groupé et action en bas du formulaire. Résultat sobre sans carte multicolore.

Conserver toute la logique de participation, les erreurs, la reprise, les codes et les probabilités. Le grattage est aussi accessible par un bouton. Champs correctement associés à leur libellé, focus clavier visible, états sélectionnés annoncés et erreurs accessibles.
