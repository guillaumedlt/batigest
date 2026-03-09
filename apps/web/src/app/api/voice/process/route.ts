import { NextRequest, NextResponse } from 'next/server';

// POST /api/voice/process
// Takes a text transcript and returns a structured action or answer
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 3) {
      return NextResponse.json({ error: 'Texte trop court.' }, { status: 400 });
    }

    const action = parseVoiceCommand(text.toLowerCase());
    return NextResponse.json(action);
  } catch (error) {
    console.error('POST /api/voice/process error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function parseVoiceCommand(text: string) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // === ACHAT ===
  // "achat 150 euros chez Point P ciment pour chantier Dupont"
  // "ajoute un achat de 200 euros matériaux"
  const achatMatch = text.match(/achat.*?(\d+(?:[.,]\d+)?)\s*(?:euros?|€)/i);
  if (achatMatch || text.includes('achat')) {
    const montant = achatMatch ? parseFloat(achatMatch[1].replace(',', '.')) : 0;
    let designation = 'Achat';
    let categorie = 'MATERIAUX';

    // Detect category
    if (/mat[ée]riau|ciment|sable|parpaing|brique|bois|plaque|isol/i.test(text)) categorie = 'MATERIAUX';
    else if (/outil|visseuse|perceuse|scie|marteau|cl[ée]/i.test(text)) categorie = 'OUTILLAGE';
    else if (/locat|nacelle|benne|echafaud/i.test(text)) categorie = 'LOCATION';
    else if (/sous.?trait/i.test(text)) categorie = 'SOUS_TRAITANCE';

    // Try to extract designation
    const chezMatch = text.match(/chez\s+([^,]+)/i);
    const designMatch = text.match(/(?:achat\s+(?:de\s+)?(?:\d+\s*(?:euros?|€)\s+)?(?:de\s+)?|pour\s+)([a-zéèêëàâùûîïôöüç\s]+?)(?:\s+(?:chez|pour|sur|du|de)\s|$)/i);

    if (designMatch) designation = designMatch[1].trim();
    if (chezMatch) designation += ` (${chezMatch[1].trim()})`;
    if (designation === 'Achat' && montant > 0) designation = `Achat ${montant}€`;

    const tva = 20;
    const montantHT = montant / (1 + tva / 100);
    const montantTTC = montant;

    return {
      type: 'achat',
      confirmation: `Nouvel achat : ${designation} — ${montant.toFixed(2)} € TTC (catégorie: ${categorie})`,
      data: {
        designation,
        date: today,
        categorie,
        montantHT: montantHT.toFixed(2),
        tauxTVA: String(tva),
        montantTTC: montantTTC.toFixed(2),
      },
    };
  }

  // === FRAIS ===
  // "note un frais péage 12 euros"
  // "frais restaurant 35 euros"
  const fraisMatch = text.match(/frais.*?(\d+(?:[.,]\d+)?)\s*(?:euros?|€)/i) ||
                     text.match(/(\d+(?:[.,]\d+)?)\s*(?:euros?|€).*frais/i);
  if (fraisMatch || text.includes('frais') || text.includes('note de frais')) {
    const montant = fraisMatch ? parseFloat(fraisMatch[1].replace(',', '.')) : 0;
    let categorie = 'AUTRE';
    let description = 'Frais';

    if (/carburant|essence|gasoil|diesel|plein/i.test(text)) { categorie = 'CARBURANT'; description = 'Carburant'; }
    else if (/p[ée]age|autoroute/i.test(text)) { categorie = 'PEAGE'; description = 'Péage'; }
    else if (/restaurant|repas|déjeuner|d[iî]ner/i.test(text)) { categorie = 'RESTAURANT'; description = 'Repas'; }
    else if (/parking|stationnement/i.test(text)) { categorie = 'PARKING'; description = 'Parking'; }
    else if (/fourniture|bureau|papier/i.test(text)) { categorie = 'FOURNITURES'; description = 'Fournitures'; }
    else if (/kilom[eè]tr|km|indemnit/i.test(text)) { categorie = 'KILOMETRIQUE'; description = 'Indemnités kilométriques'; }

    return {
      type: 'frais',
      confirmation: `Note de frais : ${description} — ${montant.toFixed(2)} € (${categorie})`,
      data: {
        date: today,
        categorie,
        montant: montant.toFixed(2),
        description,
      },
    };
  }

  // === EVENEMENT / RDV ===
  // "crée un rdv demain 9h avec monsieur Martin"
  // "ajoute un chantier lundi chez dupont"
  if (/rdv|rendez.?vous|r[ée]union|chantier.*(?:demain|lundi|mardi|mercredi|jeudi|vendredi)/i.test(text) ||
      /(?:demain|lundi|mardi|mercredi|jeudi|vendredi|samedi).*(?:rdv|rendez|chantier|r[ée]union)/i.test(text)) {
    let titre = 'RDV';
    let type = 'RDV_CLIENT';

    if (/chantier/i.test(text)) type = 'CHANTIER';
    else if (/fournisseur/i.test(text)) type = 'RDV_FOURNISSEUR';
    else if (/relance/i.test(text)) type = 'RELANCE';
    else if (/perso/i.test(text)) type = 'PERSO';

    // Extract person name
    const avecMatch = text.match(/avec\s+(?:monsieur|madame|mr|mme)?\s*([a-zéèêëàâùûîïôöüç]+)/i);
    if (avecMatch) titre = `RDV ${avecMatch[1]}`;

    // Extract date
    let dateDebut = new Date();
    if (/demain/i.test(text)) {
      dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (/apr[eè]s.?demain/i.test(text)) {
      dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    } else {
      const jours: Record<string, number> = {
        lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 0,
      };
      for (const [jour, num] of Object.entries(jours)) {
        if (text.includes(jour)) {
          const diff = (num - now.getDay() + 7) % 7 || 7;
          dateDebut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
          break;
        }
      }
    }

    // Extract time
    const heureMatch = text.match(/(\d{1,2})\s*[hH:]\s*(\d{0,2})/);
    if (heureMatch) {
      dateDebut.setHours(parseInt(heureMatch[1]), parseInt(heureMatch[2] || '0'));
    } else {
      dateDebut.setHours(9, 0);
    }

    const dateFin = new Date(dateDebut);
    dateFin.setHours(dateFin.getHours() + 1);

    return {
      type: 'evenement',
      confirmation: `Événement : ${titre} le ${dateDebut.toLocaleDateString('fr-FR')} à ${dateDebut.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (${type})`,
      data: {
        titre,
        type,
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString(),
        journeeEntiere: false,
      },
    };
  }

  // === Not recognized ===
  return {
    type: 'question',
    answer: `Je n'ai pas compris votre demande. Essayez par exemple :\n• "Achat 150 euros chez Point P ciment"\n• "Frais péage 12 euros"\n• "RDV demain 9h avec monsieur Martin"`,
    confirmation: '',
  };
}
