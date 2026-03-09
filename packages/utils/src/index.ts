import Decimal from 'decimal.js';

// Configuration Decimal.js pour les calculs monetaires
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calcule le montant TTC a partir du HT et du taux de TVA
 * Utilise Decimal.js pour eviter les erreurs d'arrondi
 */
export function calculerTTC(montantHT: string | number, tauxTVA: number): string {
  const ht = new Decimal(montantHT);
  const tva = ht.mul(tauxTVA).div(100);
  return ht.plus(tva).toFixed(2);
}

/**
 * Calcule le montant de TVA
 */
export function calculerTVA(montantHT: string | number, tauxTVA: number): string {
  const ht = new Decimal(montantHT);
  return ht.mul(tauxTVA).div(100).toFixed(2);
}

/**
 * Calcule le total HT d'une ligne (quantite x prix unitaire)
 */
export function calculerLigneHT(quantite: string | number, prixUnitaire: string | number): string {
  const q = new Decimal(quantite);
  const pu = new Decimal(prixUnitaire);
  return q.mul(pu).toFixed(2);
}

/**
 * Formate un montant en euros (ex: "1 234,56 EUR")
 */
export function formaterEuros(montant: string | number): string {
  const num = typeof montant === 'string' ? parseFloat(montant) : montant;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
}

/**
 * Genere un numero de document (D-2026-001, F-2026-001, A-2026-001)
 */
export function genererNumeroDocument(
  prefixe: 'D' | 'F' | 'A',
  annee: number,
  sequence: number,
): string {
  return `${prefixe}-${annee}-${String(sequence).padStart(3, '0')}`;
}
