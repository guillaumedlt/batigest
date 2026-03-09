# Module 05 — TVA

## Objectif
Calculer automatiquement la TVA collectee et deductible. Preparer la declaration.

## Fonctionnalites
- Calcul auto TVA collectee (depuis factures emises)
- Calcul auto TVA deductible (depuis fiches achat)
- TVA a payer = collectee - deductible
- Support multi-taux : 5.5% (renovation energetique), 10% (renovation), 20% (neuf)
- Regime : mensuel ou trimestriel
- Dashboard TVA avec graphique
- Export CSV pour comptable
- Alerte avant date limite declaration

## Regles metier batiment
- TVA 5.5% : travaux d'amelioration energetique (logement > 2 ans)
- TVA 10% : travaux de renovation (logement > 2 ans)
- TVA 20% : construction neuve, travaux non eligibles
- Attestation simplifiee obligatoire pour TVA reduite (formulaire 1301-SD)
- L'artisan doit conserver l'attestation signee par le client

## UX
- Dashboard simple : 3 chiffres (collectee, deductible, a payer)
- Graphique barres par mois
- Bouton "Exporter pour mon comptable"
