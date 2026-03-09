# Parcours utilisateurs — BatiGest

## Navigation principale (Bottom Nav)
```
[Accueil] [Contacts] [Devis] [Factures] [Plus...]
```
Le "Plus..." ouvre un menu : Achats, TVA, Calendrier, Frais, Mini-site, Parametres

## Flow 1 : Premier lancement
1. Ecran bienvenue (illustration artisan)
2. Inscription (email + mot de passe, ou Google/Apple)
3. Profil entreprise : nom, metier, SIRET, adresse
4. Upload logo (optionnel, skip possible)
5. Dashboard vide avec guide interactif "Commencez par ajouter un client"

## Flow 2 : Cycle complet devis → facture → paiement
```
[Creer devis] → [Envoyer au client] → [Client accepte]
    ↓                                       ↓
[Modifier]                          [Transformer en facture]
                                           ↓
                                    [Envoyer facture]
                                           ↓
                                  [Marquer comme payee]
                                    ou [Relancer]
```

## Flow 3 : Journee type d'un artisan
```
7h  — Ouvre l'app, voit le planning du jour
7h30 — Part sur chantier, GPS depuis l'app
12h  — Pause : scanne ticket restaurant → Note de frais
14h  — Chantier termine : cree la facture depuis le devis
15h  — Nouveau prospect appelle : cree le contact + devis rapide
17h  — Dans le camion : verifie les impayes, relance en 1 tap
```

## Flow 4 : Facturation de situation (batiment)
```
[Devis accepte avec lots]
    ↓
[Facture situation 1] → Avancement lot A: 30%, lot B: 0%
    ↓
[Facture situation 2] → Avancement lot A: 80%, lot B: 50%
    ↓
[Facture finale] → Solde restant
```

## Flow 5 : Mini-site
```
[Parametres] → [Mon mini-site]
    ↓
[Remplir infos] → [Choisir theme] → [Ajouter photos]
    ↓
[Publier] → URL batigeste.fr/mon-entreprise
    ↓
[Partager QR code] (carte visite, camion)
```

## Etats des ecrans
Chaque ecran doit gerer 4 etats :
1. **Loading** — Skeleton/spinner
2. **Empty** — Illustration + message + CTA ("Aucun devis, creez le premier !")
3. **Success** — Contenu normal
4. **Error** — Message en francais + bouton "Reessayer"
