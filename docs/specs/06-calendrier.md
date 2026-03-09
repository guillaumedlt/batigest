# Module 06 — Calendrier

## Objectif
Planning simple des chantiers et RDV. Pas un Gantt complexe, juste ce qu'il faut.

## Fonctionnalites
- Vue semaine (par defaut) et vue mois
- Types d'evenements : Chantier, RDV client, RDV fournisseur, Relance, Perso
- Code couleur par type
- Creation rapide : 1 tap sur un creneau
- Lien avec contacts (RDV → contact → itineraire GPS)
- Rappels (notification push)
- Partage calendrier avec conjoint/associe (lecture seule)
- Sync avec Google Calendar (optionnel)

## Modele de donnees
```
Evenement {
  id          UUID
  userId      UUID
  titre       String
  type        ENUM (CHANTIER, RDV_CLIENT, RDV_FOURNISSEUR, RELANCE, PERSO)
  dateDebut   DateTime
  dateFin     DateTime
  journeeEntiere Boolean
  contactId   UUID?
  adresse     String?
  notes       Text?
  rappel      Int? (minutes avant)
  couleur     String?
}
```

## UX
- Vue semaine par defaut (l'artisan planifie a la semaine)
- Gros blocs colores, faciles a identifier
- Tap sur un chantier → adresse → bouton GPS
- Glisser-deposer pour deplacer (desktop)
