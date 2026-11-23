import PDFDocument from 'pdfkit';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// Format currency according to German locale (de-DE)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
};

// Format date in German (de-DE)
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
};

const formatPaymentMethod = (method: string) => {
  switch (method?.toUpperCase()) {
    case 'BANK_TRANSFER':
      return 'Banküberweisung (Vorkasse)';
    case 'STRIPE':
      return 'Kreditkarte / Debitkarte';
    case 'PAYPAL':
      return 'PayPal';
    default:
      return method || 'N/A';
  }
};

export async function generateInvoicePDF(order: any): Promise<Buffer> {
  let logoBuffer: Buffer | null = null;
  let storeName = 'FRANK HAUSGERÄTE';
  let companyName = 'Frank Hausgeräte e. K.';
  let companyAddress = 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland';
  let companyEmail = 'kontakt@frankhausgeraete.de';

  try {
    const settingsDb = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'HEADER_LOGO_IMAGE',
            'STYLE2_LOGO',
            'STORE_NAME',
            'NEXT_PUBLIC_STORE_NAME',
            'CONTACT_ADDRESS',
            'FOOTER_ADDRESS_1',
            'CONTACT_EMAIL_DISPLAY',
            'FOOTER_SUPPORT_EMAIL'
          ]
        }
      }
    });
    const sMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

    if (sMap.STORE_NAME) storeName = sMap.STORE_NAME;
    else if (sMap.NEXT_PUBLIC_STORE_NAME) storeName = sMap.NEXT_PUBLIC_STORE_NAME;

    if (sMap.CONTACT_ADDRESS) companyAddress = sMap.CONTACT_ADDRESS;
    else if (sMap.FOOTER_ADDRESS_1) companyAddress = sMap.FOOTER_ADDRESS_1;

    if (sMap.CONTACT_EMAIL_DISPLAY) companyEmail = sMap.CONTACT_EMAIL_DISPLAY;
    else if (sMap.FOOTER_SUPPORT_EMAIL) companyEmail = sMap.FOOTER_SUPPORT_EMAIL;

    // Remote logo attempt
    const logoSetting = sMap['HEADER_LOGO_IMAGE'] || sMap['STYLE2_LOGO'];
    if (logoSetting && /^https?:\/\//i.test(logoSetting)) {
      try {
        const res = await fetch(logoSetting);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          logoBuffer = Buffer.from(ab);
        }
      } catch (err) {
        console.warn('Failed to fetch remote logo for PDF invoice:', err);
      }
    }
  } catch (e) {
    // ignore
  }

  // Robust local logo fallback (public/logo.png is the primary high-res logo)
  if (!logoBuffer) {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'logo.png'),
      path.join(process.cwd(), 'public', 'logo-flame.png'),
      path.join(process.cwd(), 'public', 'logo.jpg')
    ];
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
          logoBuffer = fs.readFileSync(/*turbopackIgnore: true*/ p);
          break;
        }
      } catch { }
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Customer details extraction
      let customerName = 'Kunde';
      let customerEmail = order.user?.email || '';
      let customerPhone = '';
      let customerNif = '';
      let customerAddress = '';
      let shippingCost = 0;
      let shippingMethodName = '';

      if (order.destinationAddress) {
        try {
          const metadata = typeof order.destinationAddress === 'string'
            ? JSON.parse(order.destinationAddress)
            : order.destinationAddress;

          const billing = metadata?.billing || metadata?.shipping;
          if (billing) {
            customerName = `${billing.firstName || ''} ${billing.lastName || ''}`.trim() || customerName;
            customerEmail = billing.email || customerEmail;
            customerPhone = billing.phone || '';
            customerNif = billing.nif || billing.taxId || metadata?.nif || '';
            const street = [billing.address1, billing.address2, billing.address].filter(Boolean).join(', ');
            const cityPostal = [billing.postalCode, billing.zipCode, billing.city].filter(Boolean).join(' ');
            customerAddress = [street, cityPostal, billing.country].filter(Boolean).join('\n').trim();
          }

          if (typeof metadata?.shippingCost === 'number') {
            shippingCost = metadata.shippingCost;
          }
          if (metadata?.shippingMethodName) {
            shippingMethodName = metadata.shippingMethodName;
          }
        } catch (e) {
          // ignore
        }
      }

      // Render document parts
      generateHeader(doc, logoBuffer, storeName, companyName, companyAddress, companyEmail);
      generateCustomerInformation(
        doc,
        order,
        customerName,
        customerEmail,
        customerPhone,
        customerNif,
        customerAddress
      );
      generateInvoiceTable(doc, order, shippingCost, shippingMethodName);
      generateFooter(doc, companyEmail);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function generateHeader(
  doc: typeof PDFDocument,
  logoBuffer: Buffer | null,
  storeName: string,
  companyName: string,
  companyAddress: string,
  companyEmail: string
) {
  const headerTop = 45;

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 50, headerTop, { width: 140, height: 45, fit: [140, 45] });
    } catch (e) {
      doc
        .fillColor('#ea580c')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(storeName, 50, headerTop + 10);
    }
  } else {
    doc
      .fillColor('#ea580c')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(storeName, 50, headerTop + 10);
  }

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('RECHNUNG', 200, headerTop, { align: 'right' })
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor('#334155')
    .text(companyName, 200, headerTop + 26, { align: 'right' })
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#64748b')
    .text(companyAddress, 200, headerTop + 38, { align: 'right' })
    .text(`E-Mail: ${companyEmail} | www.frankhausgeraete.de`, 200, headerTop + 50, { align: 'right' })
    .moveDown();
}

function generateCustomerInformation(
  doc: typeof PDFDocument,
  order: any,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  customerNif: string,
  customerAddress: string
) {
  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(14)
    .text('Bestell- & Rechnungsdaten', 50, 130);

  generateHr(doc, 148);

  const customerInformationTop = 160;

  // Left Column: Order details
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#64748b')
    .text('Rechnung Nr.:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(`RE-${order.id.slice(-6).toUpperCase()}`, 150, customerInformationTop)

    .font('Helvetica')
    .fillColor('#64748b')
    .text('Rechnungsdatum:', 50, customerInformationTop + 15)
    .font('Helvetica')
    .fillColor('#1e293b')
    .text(formatDate(new Date(order.createdAt)), 150, customerInformationTop + 15)

    .font('Helvetica')
    .fillColor('#64748b')
    .text('Zahlungsart:', 50, customerInformationTop + 30)
    .font('Helvetica-Bold')
    .fillColor('#ea580c')
    .text(formatPaymentMethod(order.paymentMethod), 150, customerInformationTop + 30)

    .font('Helvetica')
    .fillColor('#64748b')
    .text('Bestellstatus:', 50, customerInformationTop + 45)
    .font('Helvetica')
    .fillColor('#1e293b')
    .text(order.status === 'PAID' ? 'Bezahlt' : order.status === 'SHIPPED' ? 'Versendet' : order.status === 'PROCESSING' ? 'In Bearbeitung' : 'Ausstehend', 150, customerInformationTop + 45);

  // Right Column: Client details
  doc
    .font('Helvetica-Bold')
    .fillColor('#64748b')
    .fontSize(9)
    .text('Rechnungsempfänger:', 320, customerInformationTop)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .fontSize(10)
    .text(customerName, 320, customerInformationTop + 13)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#334155');

  let currentY = customerInformationTop + 27;

  if (customerNif) {
    doc.text(`USt-IdNr. / Steuer-Nr.: ${customerNif}`, 320, currentY);
    currentY += 13;
  } else {
    doc.text('Steuer-Nr.: Nicht angegeben', 320, currentY);
    currentY += 13;
  }

  if (customerEmail) {
    doc.text(`E-Mail: ${customerEmail}`, 320, currentY);
    currentY += 13;
  }

  if (customerPhone) {
    doc.text(`Telefon: ${customerPhone}`, 320, currentY);
    currentY += 13;
  }

  if (customerAddress) {
    doc.text(customerAddress.replace(/\n/g, ', '), 320, currentY, { width: 230 });
  }

  generateHr(doc, 240);
}

function generateInvoiceTable(
  doc: typeof PDFDocument,
  order: any,
  shippingCost: number,
  shippingMethodName: string
) {
  const invoiceTableTop = 265;

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e293b');
  generateTableRow(
    doc,
    invoiceTableTop,
    'Artikel / Beschreibung',
    'Menge',
    'Einzelpreis',
    'Gesamt'
  );
  generateHr(doc, invoiceTableTop + 18);
  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  let position = invoiceTableTop + 26;

  if (order.orderItems && order.orderItems.length > 0) {
    for (let i = 0; i < order.orderItems.length; i++) {
      const item = order.orderItems[i];
      const title = item.product?.title || 'Artikel';
      const quantity = item.quantity;
      const price = item.price;
      const lineTotal = quantity * price;

      generateTableRow(
        doc,
        position,
        title.length > 48 ? title.substring(0, 48) + '...' : title,
        quantity.toString(),
        formatPrice(price),
        formatPrice(lineTotal)
      );

      generateHr(doc, position + 18);
      position += 26;
    }
  }

  // Calculate totals & tax
  const subTotal = order.orderItems?.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0) || order.total;
  const shippingLabel = shippingCost === 0
    ? `Kostenlos${shippingMethodName ? ` (${shippingMethodName})` : ''}`
    : formatPrice(shippingCost);

  // Approximate MwSt portion for informational breakdown (19% German standard)
  const mwstRate = 0.19;
  const baseNetto = order.total / (1 + mwstRate);
  const mwstBetrag = order.total - baseNetto;

  let totalsY = position + 15;

  doc.font('Helvetica').fontSize(9).fillColor('#64748b');
  doc.text('Zwischensumme:', 340, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica').fillColor('#1e293b').text(formatPrice(subTotal), 450, totalsY, { width: 100, align: 'right' });

  totalsY += 16;
  doc.font('Helvetica').fillColor('#64748b').text('Versandkosten:', 340, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica').fillColor('#1e293b').text(shippingLabel, 450, totalsY, { width: 100, align: 'right' });

  totalsY += 16;
  doc.font('Helvetica').fillColor('#64748b').text('Inkl. 19% MwSt.:', 340, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica').fillColor('#1e293b').text(formatPrice(mwstBetrag), 450, totalsY, { width: 100, align: 'right' });

  totalsY += 20;
  generateHr(doc, totalsY - 4);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#ea580c');
  doc.text('Rechnungsbetrag:', 320, totalsY, { width: 120, align: 'right' });
  doc.text(formatPrice(order.total), 450, totalsY, { width: 100, align: 'right' });
  doc.font('Helvetica');
}

function generateFooter(doc: typeof PDFDocument, companyEmail: string) {
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#1e293b')
    .text(
      'Vielen Dank für Ihren Einkauf und Ihr Vertrauen!',
      50,
      695,
      { align: 'center', width: 500 }
    )
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#64748b')
    .text(
      `Für Fragen, Kundenservice oder Anliegen erreichen Sie uns per E-Mail unter ${companyEmail}.`,
      50,
      710,
      { align: 'center', width: 500 }
    )
    .text(
      'Dieses Dokument wurde maschinell erstellt und ist ohne Unterschrift gültig.',
      50,
      722,
      { align: 'center', width: 500 }
    );
}

function generateTableRow(
  doc: typeof PDFDocument,
  y: number,
  item: string,
  quantity: string,
  unitCost: string,
  lineTotal: string
) {
  doc
    .text(item, 50, y, { width: 280 })
    .text(quantity, 335, y, { width: 45, align: 'right' })
    .text(unitCost, 385, y, { width: 75, align: 'right' })
    .text(lineTotal, 465, y, { width: 85, align: 'right' });
}

function generateHr(doc: typeof PDFDocument, y: number) {
  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}
