# Module 04 — Fiches d'achat

## Objectif
Suivre les achats de materiaux et les rattacher aux chantiers pour calculer la marge reelle.

## Fonctionnalites
- Saisie rapide d'un achat (photo du ticket + montant)
- OCR sur ticket de caisse (extraction montant, date, fournisseur)
- Rattachement a un chantier / devis
- Categories : materiaux, outillage, location, sous-traitance
- Suivi budget par chantier (prevu vs reel)
- Rapprochement avec factures fournisseurs
- Export pour comptable

## Modele de donnees
```
FicheAchat {
  id              UUID
  userId          UUID
  fournisseurId   UUID?
  chantierId      UUID?
  date            DateTime
  designation     String
  categorie       ENUM (MATERIAUX, OUTILLAGE, LOCATION, SOUS_TRAITANCE, AUTRE)
  montantHT       Decimal
  tauxTVA         Decimal
  montantTTC      Decimal
  photoUrl        String?
  notes           Text?
}
```

## UX
- Bouton "Scanner un ticket" → camera → OCR → pre-remplissage
- Ajout manuel en 3 champs : quoi, combien, pour quel chantier
- Vue par chantier : total achats vs montant devis = marge
