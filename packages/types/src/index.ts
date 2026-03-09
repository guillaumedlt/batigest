// Types partages entre frontend et backend

export type ContactType = 'CLIENT' | 'PROSPECT' | 'FOURNISSEUR' | 'SOUS_TRAITANT';

export type DevisStatut = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE';

export type FactureType = 'CLASSIQUE' | 'ACOMPTE' | 'SITUATION' | 'AVOIR';
export type FactureStatut = 'BROUILLON' | 'EMISE' | 'PAYEE_PARTIELLEMENT' | 'PAYEE' | 'ANNULEE';

export type CategorieAchat = 'MATERIAUX' | 'OUTILLAGE' | 'LOCATION' | 'SOUS_TRAITANCE' | 'AUTRE';

export type CategorieNote = 'CARBURANT' | 'PEAGE' | 'RESTAURANT' | 'FOURNITURES' | 'PARKING' | 'KILOMETRIQUE' | 'AUTRE';

export type EvenementType = 'CHANTIER' | 'RDV_CLIENT' | 'RDV_FOURNISSEUR' | 'RELANCE' | 'PERSO';

export type MiniSiteTheme = 'BLEU' | 'VERT' | 'ORANGE' | 'GRIS';

// Taux de TVA batiment
export const TAUX_TVA = {
  STANDARD: 20,
  RENOVATION: 10,
  ENERGIE: 5.5,
} as const;

export type TauxTVA = (typeof TAUX_TVA)[keyof typeof TAUX_TVA];

// Unites de mesure
export const UNITES = ['h', 'm', 'm2', 'm3', 'ml', 'kg', 'u', 'forfait', 'lot', 'ens'] as const;
export type Unite = (typeof UNITES)[number];
