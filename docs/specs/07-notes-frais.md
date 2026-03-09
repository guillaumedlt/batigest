# Module 07 — Notes de frais

## Objectif
Permettre a l'artisan de suivre ses frais professionnels simplement.

## Fonctionnalites
- Photo du justificatif → OCR → pre-remplissage
- Categories : carburant, peage, restaurant, fournitures, parking
- Indemnites kilometriques (bareme fiscal)
- Calcul automatique depuis adresse depart → chantier
- Export mensuel PDF ou CSV
- Integration comptable

## Modele de donnees
```
NoteFrais {
  id          UUID
  userId      UUID
  date        DateTime
  categorie   ENUM (CARBURANT, PEAGE, RESTAURANT, FOURNITURES, PARKING, KILOMETRIQUE, AUTRE)
  montant     Decimal
  tva         Decimal?
  description String
  photoUrl    String?
  chantierId  UUID?
  km          Decimal? (pour indemnites km)
  remboursee  Boolean
}
```

## UX
- Ecran principal : liste du mois en cours + total
- Bouton "Scanner" → camera → OCR
- Bouton "Trajet" → calcul km automatique
- Swipe pour supprimer
