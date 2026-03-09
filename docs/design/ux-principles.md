# Principes UX — BatiGest

## L'utilisateur type
- Artisan du batiment, 35-55 ans
- Pas a l'aise avec la technologie
- Utilise son telephone sur chantier (gants, soleil, poussiere)
- Reseau mobile souvent mauvais (sous-sol, zone rurale)
- Peu de temps : entre deux chantiers, dans le camion
- Vocabulaire : parle "devis", "facture", "TVA" mais pas "credit", "debit", "echeancier"

## Les 7 commandements

### 1. Mobile-first absolu
Tout est concu pour le telephone d'abord. Le desktop est un bonus.
Les composants s'adaptent vers le haut, jamais vers le bas.

### 2. Maximum 3 taps
Toute action courante doit etre realisable en 3 taps maximum :
- Creer un devis : Tap "+" → Tap "Devis" → Formulaire
- Appeler un client : Tap contact → Tap "Appeler"
- Scanner un ticket : Tap "+" → Tap "Frais" → Camera

### 3. Zero jargon
| Interdit | Utiliser |
|----------|----------|
| Credit | Entree d'argent |
| Debit | Sortie d'argent |
| Echeancier | Paiement en plusieurs fois |
| Compte de resultat | Bilan du mois |
| Rapprochement | Verification |
| Imputer | Rattacher a |
| Solde | Reste a payer |

### 4. Gros doigts
- Boutons : 48x48px minimum
- Espacement entre elements cliquables : 8px minimum
- Zone de tap plus grande que l'element visible
- Pas de petits liens texte comme action principale

### 5. Lisible partout
- Texte 16px minimum
- Contraste AAA pour les infos importantes
- Pas de texte gris clair sur fond blanc
- Icones + texte (jamais icone seule pour une action importante)

### 6. Reseau hostile
- Loading states sur TOUT (skeleton, spinner)
- Mode hors-ligne pour la saisie
- Sync automatique au retour reseau
- Pas de timeout agressif
- Donnees en cache : la liste des contacts, le dernier devis

### 7. Feedback immediat
- Chaque tap = retour visuel instantane
- Toast de confirmation sur chaque action importante
- Vibration sur les actions critiques (suppression, envoi)
- Animation de progression sur les envois/sauvegardes

## Parcours critiques

### Creer un devis (parcours principal)
1. Tab "+" → "Nouveau devis"
2. Selectionner client (ou en creer un)
3. Ajouter lignes (saisie ou bibliotheque)
4. Apercu → Ajuster si besoin
5. Envoyer (email/SMS/WhatsApp)
→ Maximum 5 ecrans, 2 minutes

### Scanner un justificatif
1. Tab "+" → "Note de frais"
2. Camera s'ouvre → Photo
3. OCR pre-remplit → Valider
→ Maximum 3 ecrans, 30 secondes

### Relancer un impaye
1. Dashboard → Notification "X factures impayees"
2. Tap sur la facture
3. Tap "Relancer" → Message pre-rempli → Envoyer
→ Maximum 3 ecrans, 20 secondes
