# Module 01 — Repertoire / CRM

## Objectif
Gerer tous les contacts de l'artisan : clients, prospects, fournisseurs, sous-traitants.

## Fonctionnalites
- Liste de contacts avec recherche instantanee
- Fiche contact detaillee (nom, telephone, email, adresse, notes)
- Categories : Client / Prospect / Fournisseur / Sous-traitant
- Historique des interactions (devis envoyes, factures, appels)
- Import contacts depuis le telephone
- Ajout rapide en 1 tap (nom + telephone minimum)
- Lien direct vers appel / SMS / email / GPS

## Modele de donnees
```
Contact {
  id            UUID
  userId        UUID (proprietaire)
  type          ENUM (CLIENT, PROSPECT, FOURNISSEUR, SOUS_TRAITANT)
  nom           String
  prenom        String?
  entreprise    String?
  telephone     String
  email         String?
  adresse       String?
  codePostal    String?
  ville         String?
  siret         String?
  notes         Text?
  tags          String[]
  createdAt     DateTime
  updatedAt     DateTime
}
```

## UX
- Ecran principal : liste avec barre de recherche sticky en haut
- Bouton FAB "+" pour ajout rapide
- Swipe gauche sur un contact = appeler
- Swipe droite = creer un devis
- Fiche contact : gros boutons Appeler / SMS / Email / Itineraire
