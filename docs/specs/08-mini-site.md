# Module 08 — Mini-site vitrine

## Objectif
Chaque artisan a une page web professionnelle accessible via batigeste.fr/nom-entreprise.

## Fonctionnalites
- Page unique, type Linktree mais pour artisans
- Chargement < 1 seconde (SSG)
- Contenu : logo, nom, metier, zone, telephone, email
- Galerie photos de realisations (avant/apres)
- Avis clients (moderes)
- Certifications / labels (RGE, Qualibat, etc.)
- Bouton "Demander un devis" → formulaire → cree un prospect dans le CRM
- Bouton "Prendre RDV" → calendrier de disponibilites
- Personnalisable : 3-4 themes couleur
- Mentions legales auto-generees
- SEO local optimise
- QR code generee (a mettre sur le camion, carte de visite)

## Stack
- Next.js SSG ou Astro pour la performance
- Page statique regeneree a chaque modification
- Images optimisees (WebP, lazy loading)

## Modele de donnees
```
MiniSite {
  id              UUID
  userId          UUID
  slug            String (unique, URL-friendly)
  nomEntreprise   String
  metier          String
  description     Text
  telephone       String
  email           String
  adresse         String
  zoneIntervention String
  logoUrl         String?
  theme           ENUM (BLEU, VERT, ORANGE, GRIS)
  certifications  String[]
  photos          MiniSitePhoto[]
  avis            MiniSiteAvis[]
  actif           Boolean
}
```
