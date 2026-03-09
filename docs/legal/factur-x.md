# Factur-X — Facture electronique

## Contexte
A partir de 2026, toutes les entreprises francaises doivent emettre des factures electroniques structurees. Le format Factur-X est le standard franco-allemand base sur PDF/A-3 + XML.

## Principe
Un fichier Factur-X = un PDF lisible par l'humain + un fichier XML integre lisible par la machine. Le XML contient les donnees structurees de la facture.

## Profils Factur-X (du plus simple au plus complet)
1. **MINIMUM** — Donnees minimales (suffisant pour les TPE)
2. **BASIC WL** — Donnees de base sans lignes detaillees
3. **BASIC** — Donnees de base avec lignes ← **Notre cible**
4. **EN16931** — Conforme norme europeenne complete
5. **EXTENDED** — Donnees etendues

## Donnees XML obligatoires (profil BASIC)
- Numero de facture
- Date d'emission
- Type de document (facture, avoir, acompte)
- Devise (EUR)
- Vendeur : nom, adresse, SIRET, TVA intra
- Acheteur : nom, adresse, SIRET (si professionnel)
- Lignes de detail : designation, quantite, prix unitaire, TVA
- Totaux : HT, TVA par taux, TTC
- Conditions de paiement
- References (numero de commande, devis, etc.)

## Implementation technique
1. Generer le PDF de la facture normalement (Puppeteer)
2. Generer le XML Factur-X correspondant
3. Convertir le PDF en PDF/A-3
4. Integrer le XML comme piece jointe du PDF/A-3
5. Ajouter les metadonnees XMP requises

### Librairies
- `factur-x` (npm) — generation XML Factur-X
- `pdf-lib` ou `muhammara` — manipulation PDF/A-3
- Alternativement : generer avec Puppeteer + post-traiter avec Ghostscript

## Calendrier obligation
- **Juillet 2024** : grandes entreprises (reception obligatoire)
- **Janvier 2025** : ETI
- **Janvier 2026** : PME et TPE ← **Notre cible**

## Plateforme de dematerialisation
- Les factures electroniques passent par une PDP (Plateforme de Dematerialisation Partenaire) ou le PPF (Portail Public de Facturation)
- BatiGest devra s'interfacer avec une PDP pour deposer les factures
- A prevoir : API d'envoi vers PDP (Chorus Pro en attendant le PPF)
