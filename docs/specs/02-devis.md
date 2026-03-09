# Module 02 — Devis

## Objectif
Creer, envoyer et suivre les devis. Transformation en facture en 1 tap.

## Fonctionnalites
- Creation de devis avec lignes de prestation
- Bibliotheque de prestations (reutilisables)
- Calcul TVA automatique (multi-taux : 5.5%, 10%, 20%)
- Apercu PDF instantane
- Envoi par email / SMS / WhatsApp
- Signature electronique (doigt sur ecran)
- Statuts : Brouillon → Envoye → Accepte → Refuse → Expire
- Transformation devis → facture en 1 tap
- Duplication de devis
- Relance automatique (rappel si pas de reponse sous X jours)
- Numerotation automatique chronologique (ex: D-2026-001)

## Modele de donnees
```
Devis {
  id              UUID
  userId          UUID
  contactId       UUID
  numero          String (unique, chronologique)
  objet           String
  dateCreation    DateTime
  dateValidite    DateTime
  statut          ENUM (BROUILLON, ENVOYE, ACCEPTE, REFUSE, EXPIRE)
  lignes          DevisLigne[]
  totalHT         Decimal
  totalTVA        Decimal
  totalTTC        Decimal
  conditions      Text
  notes           Text?
  signatureUrl    String?
  signedAt        DateTime?
}

DevisLigne {
  id              UUID
  devisId         UUID
  designation     String
  description     Text?
  quantite        Decimal
  unite           String (h, m2, forfait, u...)
  prixUnitaireHT  Decimal
  tauxTVA         Decimal (5.5, 10, 20)
  totalHT         Decimal
  ordre           Int
}
```

## Mentions legales obligatoires sur un devis
- Numero du devis et date
- Nom et adresse de l'entreprise
- SIRET, RCS
- Nom et adresse du client
- Designation detaillee des travaux
- Prix unitaires et quantites
- Taux de TVA applicables
- Total HT, TVA, TTC
- Duree de validite
- Conditions de reglement
- Mention "Devis recu avant execution des travaux"
- Assurance decennale (numero + assureur)

## UX
- Formulaire en etapes : 1) Client 2) Lignes 3) Conditions 4) Apercu
- Ajout ligne : saisie libre OU selection depuis bibliotheque
- Calculs en temps reel
- Bouton "Apercu PDF" toujours visible
- Envoi : choix du canal (email, SMS, WhatsApp)
