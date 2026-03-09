# Mentions legales obligatoires — Normes francaises

## Sur les devis (obligatoire)
1. **Identite de l'entreprise**
   - Denomination sociale ou nom de l'artisan
   - Forme juridique (SARL, SAS, EI, micro-entreprise)
   - Adresse du siege social
   - Numero SIRET
   - Numero RCS ou RM (Repertoire des Metiers)
   - Numero de TVA intracommunautaire (si assujetti)

2. **Assurance professionnelle**
   - Nom de l'assureur decennale
   - Numero de police
   - Zone de couverture geographique
   - (Obligatoire pour tous travaux de batiment)

3. **Informations du devis**
   - Numero du devis (chronologique)
   - Date d'emission
   - Duree de validite de l'offre
   - Nom et adresse du client

4. **Detail des prestations**
   - Designation detaillee de chaque prestation
   - Quantite et unite (heures, m2, forfait, unite)
   - Prix unitaire HT
   - Taux de TVA applicable par ligne
   - Total HT par ligne

5. **Totaux**
   - Total HT
   - Montant TVA (ventile par taux)
   - Total TTC
   - Remise eventuelle (montant et pourcentage)

6. **Conditions**
   - Conditions de reglement (mode et delai)
   - Penalites de retard
   - Droit de retractation 14 jours (si demarchage a domicile)
   - Conditions de revision du prix
   - Mention : "Devis recu avant l'execution des travaux"

## Sur les factures (Code de commerce art. L441-9)
Tout ce qui est sur le devis PLUS :

1. **Numero de facture** — chronologique, sans rupture, non modifiable
2. **Date d'emission**
3. **Date de livraison/execution** (si differente de la date de facture)
4. **Date d'echeance de paiement**
5. **Conditions d'escompte** (ou mention "Pas d'escompte pour reglement anticipe")
6. **Penalites de retard** — taux minimum : taux directeur BCE x 3 (ou BCE + 10 points)
7. **Indemnite forfaitaire de recouvrement** — 40 EUR (mention obligatoire)
8. **Si auto-entrepreneur** — "TVA non applicable, art. 293 B du CGI"

## Mentions specifiques par type

### Facture d'acompte
- Mention "Facture d'acompte"
- Reference au devis d'origine
- Pourcentage ou montant de l'acompte
- Montant deja facture et reste a facturer

### Facture de situation
- Mention "Facture de situation n°X"
- Tableau d'avancement par lot
- Cumul des situations precedentes
- Montant de la situation actuelle

### Avoir
- Mention "Avoir"
- Reference a la facture d'origine
- Motif de l'avoir
- Montant negatif

## Numerotation
- **Devis** : D-AAAA-NNN (ex: D-2026-001, D-2026-002...)
- **Factures** : F-AAAA-NNN (ex: F-2026-001...)
- **Avoirs** : A-AAAA-NNN (ex: A-2026-001...)
- Chronologique, sans rupture, sur l'annee civile
- Geree par sequence PostgreSQL (pas d'increment applicatif)

## Conservation
- **Factures** : 10 ans (Code de commerce art. L123-22)
- **Devis acceptes** : 10 ans
- **Documents TVA** : 6 ans (Livre des procedures fiscales art. L102 B)

## RGPD
- Consentement explicite pour les donnees personnelles
- Droit d'acces, de rectification, de suppression
- Portabilite des donnees (export CSV/JSON)
- DPO ou contact pour les demandes
- Politique de confidentialite accessible
