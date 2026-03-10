/**
 * Generateur de documents HTML print-optimized (A4).
 * Utilisable cote serveur dans les API routes.
 * Le navigateur affiche la page et l'utilisateur imprime / enregistre en PDF.
 */

type Entreprise = {
  nomEntreprise: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  siret: string | null;
  tvaIntracom: string | null;
  assuranceDecennale: string | null;
  assuranceNumero: string | null;
  rib: string | null;
  logoUrl: string | null;
  docCouleur: string;
  docPolice: string;
  franchiseTVA: boolean;
  mentionsDevis: string | null;
  mentionsFacture: string | null;
  conditionsReglement: string | null;
};

type Ligne = {
  designation: string;
  description: string | null;
  quantite: string | number;
  unite: string;
  prixUnitaireHT: string | number;
  tauxTVA: string | number;
  totalHT: string | number;
};

type Contact = {
  nom: string;
  prenom: string | null;
  entreprise: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  telephone: string;
  email: string | null;
};

// --- Helpers ---

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmt(val: string | number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(val));
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function tvaByRate(lignes: Ligne[]): Record<string, { base: number; tva: number }> {
  const map: Record<string, { base: number; tva: number }> = {};
  for (const l of lignes) {
    const t = String(l.tauxTVA);
    if (!map[t]) map[t] = { base: 0, tva: 0 };
    map[t].base += Number(l.totalHT);
    map[t].tva += Number(l.totalHT) * Number(l.tauxTVA) / 100;
  }
  return map;
}

function contactBlock(contact: Contact): string {
  const name = esc(contact.entreprise || `${contact.nom} ${contact.prenom || ''}`.trim());
  const parts = [contact.adresse, contact.codePostal, contact.ville].filter(Boolean);
  const addr = esc(parts.join(', '));
  return `
    <div class="client-box">
      <div class="label">Destinataire</div>
      <div class="client-name">${name}</div>
      ${addr ? `<div class="client-addr">${addr}</div>` : ''}
      ${contact.telephone ? `<div class="client-detail">Tel : ${esc(contact.telephone)}</div>` : ''}
      ${contact.email ? `<div class="client-detail">${esc(contact.email)}</div>` : ''}
    </div>
  `;
}

function entrepriseBlock(e: Entreprise): string {
  return `
    <div class="company">
      ${e.logoUrl ? `<img src="${esc(e.logoUrl)}" alt="" class="logo" />` : ''}
      <div class="company-name">${esc(e.nomEntreprise)}</div>
      <div class="company-detail">${esc(e.adresse)}</div>
      <div class="company-detail">${esc(e.codePostal)} ${esc(e.ville)}</div>
      <div class="company-detail">Tel : ${esc(e.telephone)}</div>
      <div class="company-detail">${esc(e.email)}</div>
      ${e.siret ? `<div class="company-legal">SIRET : ${esc(e.siret)}</div>` : ''}
      ${e.tvaIntracom ? `<div class="company-legal">TVA : ${esc(e.tvaIntracom)}</div>` : ''}
    </div>
  `;
}

function lignesTable(lignes: Ligne[], accentColor: string): string {
  const rows = lignes.map((l) => `
    <tr>
      <td class="designation">
        ${esc(l.designation)}
        ${l.description ? `<div class="desc">${esc(l.description)}</div>` : ''}
      </td>
      <td class="num">${Number(l.quantite)}</td>
      <td class="unite">${esc(l.unite)}</td>
      <td class="num">${fmt(l.prixUnitaireHT)}</td>
      <td class="num">${Number(l.tauxTVA)}%</td>
      <td class="num bold">${fmt(l.totalHT)}</td>
    </tr>
  `).join('');

  return `
    <table class="lines-table">
      <thead>
        <tr style="border-bottom: 2px solid ${accentColor}">
          <th class="left">Designation</th>
          <th class="right" style="width:50px">Qte</th>
          <th class="left" style="width:50px">Unite</th>
          <th class="right" style="width:90px">PU HT</th>
          <th class="right" style="width:50px">TVA</th>
          <th class="right" style="width:100px">Total HT</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// --- Base CSS ---

function baseCss(accentColor: string, fontFamily: string): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }

    body {
      font-family: '${fontFamily}', 'Inter', -apple-system, sans-serif;
      font-size: 10pt;
      color: #1a1a1a;
      line-height: 1.5;
      background: white;
    }

    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .company {}
    .logo { height: 48px; max-width: 120px; object-fit: contain; margin-bottom: 4px; }
    .company-name { font-size: 16pt; font-weight: 700; color: #111; }
    .company-detail { font-size: 9pt; color: #666; }
    .company-legal { font-size: 8pt; color: #999; margin-top: 6px; }
    .doc-info { text-align: right; }
    .doc-type { font-size: 16pt; font-weight: 700; color: ${accentColor}; }
    .doc-numero { font-size: 13pt; font-weight: 600; color: #111; margin-top: 4px; }
    .doc-date { font-size: 9pt; color: #666; margin-top: 6px; }

    /* Client box */
    .client-box {
      border: 1px solid #e5e5e5;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 4px; }
    .client-name { font-weight: 600; font-size: 11pt; }
    .client-addr { font-size: 9pt; color: #444; }
    .client-detail { font-size: 9pt; color: #666; }

    /* Objet / Reference */
    .objet { margin-bottom: 16px; }
    .objet .label { margin-bottom: 2px; }
    .objet p { font-weight: 500; }
    .reference { font-size: 9pt; color: #666; margin-bottom: 16px; }

    /* Table */
    .lines-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 9pt;
    }
    .lines-table th {
      padding: 6px 8px;
      font-weight: 600;
      color: #444;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .lines-table th.left { text-align: left; }
    .lines-table th.right { text-align: right; }
    .lines-table td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
    .lines-table td.designation { }
    .lines-table td .desc { font-size: 8pt; color: #999; margin-top: 2px; }
    .lines-table td.num { text-align: right; color: #444; }
    .lines-table td.unite { color: #999; }
    .lines-table td.bold { font-weight: 600; color: #111; }

    /* Totaux */
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-box { width: 220px; }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 9pt;
    }
    .total-row .lbl { color: #666; }
    .total-row .val { font-weight: 500; }
    .total-row.tva .lbl { color: #999; }
    .total-row.tva .val { color: #444; }
    .total-row.remise .val { color: #dc2626; }
    .total-row.ttc {
      border-top: 2px solid #e5e5e5;
      padding-top: 8px;
      margin-top: 4px;
    }
    .total-row.ttc .lbl { font-weight: 700; font-size: 10pt; }
    .total-row.ttc .val { font-weight: 700; font-size: 13pt; color: ${accentColor}; }
    .total-row.paid .val { color: #16a34a; }
    .total-row.reste .lbl,
    .total-row.reste .val { font-weight: 700; }
    .total-row.reste .val { color: #dc2626; }

    /* Conditions & Mentions */
    .conditions {
      margin-bottom: 16px;
      font-size: 9pt;
      color: #444;
    }
    .conditions h3 { font-size: 9pt; font-weight: 600; color: #333; margin-bottom: 4px; }
    .conditions p { white-space: pre-wrap; }

    .rib-box {
      border: 1px solid #e5e5e5;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }
    .rib-box .label { margin-bottom: 2px; }
    .rib-box p { font-family: 'Courier New', monospace; font-size: 9pt; color: #333; }

    .mentions {
      border-top: 1px solid #e5e5e5;
      padding-top: 12px;
      font-size: 7.5pt;
      color: #999;
      line-height: 1.6;
    }
    .mentions p { margin-bottom: 2px; }
    .mentions .autoliq { font-weight: 500; color: #666; }

    /* Signature zone */
    .signature {
      margin-top: 28px;
      display: flex;
      justify-content: flex-end;
    }
    .signature-box {
      border: 1px dashed #ccc;
      border-radius: 6px;
      padding: 20px 32px;
      text-align: center;
      width: 220px;
    }
    .signature-box .sig-top { font-size: 8pt; color: #999; margin-bottom: 50px; }
    .signature-box .sig-bottom { font-size: 8pt; color: #999; }

    /* Print button */
    .no-print { text-align: center; padding: 16px; }
    .no-print button {
      background: ${accentColor};
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .no-print button:hover { opacity: 0.9; }

    @media print {
      .no-print { display: none !important; }
      body { background: white; }
      .page { max-width: none; }
    }
  `;
}

// --- Wrapper ---

function htmlWrap(title: string, accentColor: string, fontFamily: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <style>${baseCss(accentColor, fontFamily)}</style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Imprimer / Enregistrer en PDF</button>
  </div>
  <div class="page">
    ${body}
  </div>
  <script>
    // Auto-print apres chargement complet (images etc.)
    window.addEventListener('load', function() {
      // Petit delai pour que les polices se chargent
      setTimeout(function() { window.print(); }, 600);
    });
  </script>
</body>
</html>`;
}

// =====================
// DEVIS PDF
// =====================

export type DevisPdfData = {
  numero: string;
  objet: string;
  dateCreation: string | Date;
  dateValidite: string | Date;
  totalHT: string | number;
  totalTVA: string | number;
  totalTTC: string | number;
  remise: string | number | null;
  conditions: string | null;
  contact: Contact;
  lignes: Ligne[];
};

export function generateDevisPdfHtml(devis: DevisPdfData, entreprise: Entreprise): string {
  const accentColor = entreprise.docCouleur || '#2563EB';
  const fontFamily = entreprise.docPolice || 'Inter';
  const tvaMap = tvaByRate(devis.lignes);

  let totalsHtml = `
    <div class="total-row">
      <span class="lbl">Total HT</span>
      <span class="val">${fmt(devis.totalHT)}</span>
    </div>
  `;

  for (const [taux, v] of Object.entries(tvaMap)) {
    totalsHtml += `
      <div class="total-row tva">
        <span class="lbl">TVA ${Number(taux)}%</span>
        <span class="val">${fmt(v.tva)}</span>
      </div>
    `;
  }

  if (devis.remise && Number(devis.remise) > 0) {
    totalsHtml += `
      <div class="total-row remise">
        <span class="lbl">Remise</span>
        <span class="val">-${fmt(devis.remise)}</span>
      </div>
    `;
  }

  totalsHtml += `
    <div class="total-row ttc">
      <span class="lbl">Total TTC</span>
      <span class="val">${fmt(devis.totalTTC)}</span>
    </div>
  `;

  let mentionsHtml = '';
  if (entreprise.franchiseTVA) {
    mentionsHtml += '<p>TVA non applicable, art. 293 B du CGI</p>';
  }
  if (entreprise.assuranceDecennale) {
    mentionsHtml += `<p>Assurance decennale : ${esc(entreprise.assuranceDecennale)} — N° ${esc(entreprise.assuranceNumero)}</p>`;
  }
  if (entreprise.mentionsDevis) {
    mentionsHtml += `<p>${esc(entreprise.mentionsDevis)}</p>`;
  }
  mentionsHtml += `<p>Devis valable jusqu'au ${fmtDate(devis.dateValidite)}. Signature precedee de la mention &laquo; Bon pour accord &raquo;.</p>`;

  const body = `
    <div class="header">
      ${entrepriseBlock(entreprise)}
      <div class="doc-info">
        <div class="doc-type">DEVIS</div>
        <div class="doc-numero">${esc(devis.numero)}</div>
        <div class="doc-date">Date : ${fmtDate(devis.dateCreation)}</div>
        <div class="doc-date">Validite : ${fmtDate(devis.dateValidite)}</div>
      </div>
    </div>

    ${contactBlock(devis.contact)}

    <div class="objet">
      <div class="label">Objet</div>
      <p>${esc(devis.objet)}</p>
    </div>

    ${lignesTable(devis.lignes, accentColor)}

    <div class="totals">
      <div class="totals-box">${totalsHtml}</div>
    </div>

    ${(devis.conditions || entreprise.conditionsReglement) ? `
      <div class="conditions">
        <h3>Conditions</h3>
        <p>${esc(devis.conditions || entreprise.conditionsReglement)}</p>
      </div>
    ` : ''}

    <div class="mentions">${mentionsHtml}</div>

    <div class="signature">
      <div class="signature-box">
        <div class="sig-top">Bon pour accord</div>
        <div class="sig-bottom">Date et signature</div>
      </div>
    </div>
  `;

  return htmlWrap(`Devis ${devis.numero}`, accentColor, fontFamily, body);
}

// =====================
// FACTURE PDF
// =====================

const TYPE_LABELS: Record<string, string> = {
  CLASSIQUE: 'FACTURE',
  ACOMPTE: "FACTURE D'ACOMPTE",
  SITUATION: 'FACTURE DE SITUATION',
  AVOIR: 'AVOIR',
};

export type FacturePdfData = {
  numero: string;
  type: string;
  dateEmission: string | Date;
  dateEcheance: string | Date;
  totalHT: string | number;
  totalTVA: string | number;
  totalTTC: string | number;
  montantPaye: string | number;
  resteARegler: string | number;
  conditions: string | null;
  contact: Contact;
  devis: { numero: string; objet: string } | null;
  lignes: Ligne[];
};

export function generateFacturePdfHtml(facture: FacturePdfData, entreprise: Entreprise): string {
  const accentColor = entreprise.docCouleur || '#2563EB';
  const fontFamily = entreprise.docPolice || 'Inter';
  const tvaMap = tvaByRate(facture.lignes);
  const typeLabel = TYPE_LABELS[facture.type] || 'FACTURE';

  let totalsHtml = `
    <div class="total-row">
      <span class="lbl">Total HT</span>
      <span class="val">${fmt(facture.totalHT)}</span>
    </div>
  `;

  for (const [taux, v] of Object.entries(tvaMap)) {
    totalsHtml += `
      <div class="total-row tva">
        <span class="lbl">TVA ${Number(taux)}%</span>
        <span class="val">${fmt(v.tva)}</span>
      </div>
    `;
  }

  totalsHtml += `
    <div class="total-row ttc">
      <span class="lbl">Total TTC</span>
      <span class="val">${fmt(facture.totalTTC)}</span>
    </div>
  `;

  if (Number(facture.montantPaye) > 0) {
    totalsHtml += `
      <div class="total-row paid">
        <span class="lbl">Deja regle</span>
        <span class="val">-${fmt(facture.montantPaye)}</span>
      </div>
      <div class="total-row reste">
        <span class="lbl">Reste a regler</span>
        <span class="val">${fmt(facture.resteARegler)}</span>
      </div>
    `;
  }

  let mentionsHtml = '';
  if (entreprise.franchiseTVA) {
    mentionsHtml += '<p>TVA non applicable, art. 293 B du CGI</p>';
  }
  if (Object.keys(tvaMap).includes('0') && !entreprise.franchiseTVA) {
    mentionsHtml += '<p class="autoliq">Autoliquidation de la TVA par le preneur — art. 283-2 nonies du CGI (sous-traitance BTP)</p>';
  }
  if (entreprise.assuranceDecennale) {
    mentionsHtml += `<p>Assurance decennale : ${esc(entreprise.assuranceDecennale)} — N° ${esc(entreprise.assuranceNumero)}</p>`;
  }
  if (entreprise.mentionsFacture) {
    mentionsHtml += `<p>${esc(entreprise.mentionsFacture)}</p>`;
  }
  mentionsHtml += `<p>En cas de retard de paiement, une penalite de 3 fois le taux d'interet legal sera appliquee, ainsi qu'une indemnite forfaitaire de 40 &euro; pour frais de recouvrement.</p>`;
  mentionsHtml += `<p>Clause de reserve de propriete : le vendeur conserve la propriete des biens et materiaux fournis jusqu'au paiement integral du prix, conformement a la loi n° 80-335 du 12 mai 1980.</p>`;

  const body = `
    <div class="header">
      ${entrepriseBlock(entreprise)}
      <div class="doc-info">
        <div class="doc-type">${esc(typeLabel)}</div>
        <div class="doc-numero">${esc(facture.numero)}</div>
        <div class="doc-date">Date : ${fmtDate(facture.dateEmission)}</div>
        <div class="doc-date">Echeance : ${fmtDate(facture.dateEcheance)}</div>
      </div>
    </div>

    ${contactBlock(facture.contact)}

    ${facture.devis ? `
      <div class="reference">
        Reference devis : ${esc(facture.devis.numero)} — ${esc(facture.devis.objet)}
      </div>
    ` : ''}

    ${lignesTable(facture.lignes, accentColor)}

    <div class="totals">
      <div class="totals-box">${totalsHtml}</div>
    </div>

    ${(facture.conditions || entreprise.conditionsReglement) ? `
      <div class="conditions">
        <h3>Conditions de reglement</h3>
        <p>${esc(facture.conditions || entreprise.conditionsReglement)}</p>
      </div>
    ` : ''}

    ${entreprise.rib ? `
      <div class="rib-box">
        <div class="label">Coordonnees bancaires</div>
        <p>${esc(entreprise.rib)}</p>
      </div>
    ` : ''}

    <div class="mentions">${mentionsHtml}</div>
  `;

  return htmlWrap(`${typeLabel} ${facture.numero}`, accentColor, fontFamily, body);
}
