/**
 * Generation du XML Factur-X (profil MINIMUM) conforme a la norme EN 16931.
 * Ce format est obligatoire pour la facturation electronique en France a partir de 2026.
 */

type FacturXFacture = {
  numero: string;
  dateEmission: Date | string;
  type: string; // CLASSIQUE, ACOMPTE, SITUATION, AVOIR
  totalHT: string | number;
  totalTVA: string | number;
  totalTTC: string | number;
};

type FacturXEntreprise = {
  nomEntreprise: string;
  siret: string | null;
  tvaIntracom: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
};

type FacturXContact = {
  nom: string;
  prenom: string | null;
  entreprise: string | null;
};

/**
 * Genere le XML Factur-X au profil MINIMUM.
 * @param facture - Donnees de la facture
 * @param entreprise - Donnees de l'entreprise emettrice
 * @param contact - Donnees du client destinataire
 * @returns Le XML complet sous forme de string
 */
export function generateFacturXML(
  facture: FacturXFacture,
  entreprise: FacturXEntreprise,
  contact: FacturXContact,
): string {
  const dateEmission = formatDate102(facture.dateEmission);
  const sellerName = escapeXml(entreprise.nomEntreprise);
  const siret = entreprise.siret || '';
  const buyerName = escapeXml(
    contact.entreprise || `${contact.nom}${contact.prenom ? ` ${contact.prenom}` : ''}`,
  );

  // TypeCode: 380 = facture commerciale, 381 = avoir
  const typeCode = facture.type === 'AVOIR' ? '381' : '380';

  const totalHT = Number(facture.totalHT).toFixed(2);
  const totalTVA = Number(facture.totalTVA).toFixed(2);
  const totalTTC = Number(facture.totalTTC).toFixed(2);

  // Bloc vendeur avec adresse et TVA intracommunautaire
  let sellerTaxRegistration = '';
  if (entreprise.tvaIntracom) {
    sellerTaxRegistration = `
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${escapeXml(entreprise.tvaIntracom)}</ram:ID>
        </ram:SpecifiedTaxRegistration>`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(facture.numero)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${dateEmission}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${sellerName}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${escapeXml(siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:LineOne>${escapeXml(entreprise.adresse)}</ram:LineOne>
          <ram:PostcodeCode>${escapeXml(entreprise.codePostal)}</ram:PostcodeCode>
          <ram:CityName>${escapeXml(entreprise.ville)}</ram:CityName>
          <ram:CountryID>FR</ram:CountryID>
        </ram:PostalTradeAddress>${sellerTaxRegistration}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${buyerName}</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>${totalHT}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${totalTVA}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${totalTTC}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${totalTTC}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;

  return xml;
}

/** Formate une date au format 102 (YYYYMMDD) pour Factur-X */
function formatDate102(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** Echappe les caracteres speciaux XML */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
