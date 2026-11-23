import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

// HTML escape utility to prevent XSS in email templates
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fetch SMTP settings and store branding from DB
async function getTransporter() {
  const settingsDb = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'SMTP_HOST',
          'SMTP_PORT',
          'SMTP_USER',
          'SMTP_PASS',
          'SMTP_FROM',
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

  const settings = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

  if (!settings.SMTP_HOST || !settings.SMTP_USER || !settings.SMTP_PASS) {
    throw new Error('Configuração SMTP não encontrada na base de dados.');
  }

  const rawPort = (settings.SMTP_PORT || '465').toString().trim();
  const port = parseInt(rawPort, 10);
  const isSecure = port === 465;

  const transporter = nodemailer.createTransport({
    host: settings.SMTP_HOST.trim(),
    port: port,
    secure: isSecure,
    auth: {
      user: settings.SMTP_USER.trim(),
      pass: settings.SMTP_PASS.trim(),
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  });

  const storeName = settings.STORE_NAME || settings.NEXT_PUBLIC_STORE_NAME || process.env.NEXT_PUBLIC_STORE_NAME || "FRANK HAUSGERÄTE";
  const storeEmail = settings.CONTACT_EMAIL_DISPLAY || settings.FOOTER_SUPPORT_EMAIL || 'kontakt@frankhausgeraete.de';
  const storeAddress = settings.CONTACT_ADDRESS || settings.FOOTER_ADDRESS_1 || 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland';
  const logo = settings.HEADER_LOGO_IMAGE || settings.STYLE2_LOGO || '';

  // Ensure 'from' is always a valid email address with domain, never bare username like 'resend'
  let from = (settings.SMTP_FROM || '').trim();
  if (!from || !from.includes('@')) {
    from = `"${storeName}" <${storeEmail}>`;
  }

  return {
    transporter,
    apiKey: settings.SMTP_PASS.trim(),
    host: settings.SMTP_HOST.trim(),
    from,
    logo,
    storeName,
    storeEmail,
    storeAddress
  };
}

// Helper to send via Resend HTTPS REST API directly (100% reliable on Vercel Serverless)
async function sendViaResendApi({
  apiKey,
  from,
  to,
  subject,
  html,
  attachments,
  replyTo,
}: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  replyTo?: string;
}) {
  const payload: any = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  if (replyTo) {
    payload.reply_to = replyTo;
  }

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
    }));
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Erro da API Resend (${response.status})`);
  }

  return { success: true as const, messageId: data.id };
}

// General email sender (Tenta Resend API se chave re_ configurada, com fallback seguro para SMTP)
export async function sendEmail({
  to,
  subject,
  html,
  attachments,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
  replyTo?: string;
}): Promise<{ success: true; messageId?: string } | { success: false; error: any }> {
  try {
    const { transporter, apiKey, host, from } = await getTransporter();

    // Se o fornecedor for Resend (chave re_ ou host smtp.resend.com), utilizar a API REST HTTPS direta
    // para garantir latência ultra-baixa e contornar restrições de portas TCP em ambientes Serverless
    if (apiKey.startsWith('re_') || host.includes('resend.com')) {
      try {
        const resendResult = await sendViaResendApi({
          apiKey,
          from,
          to,
          subject,
          html,
          attachments,
          replyTo,
        });
        return resendResult;
      } catch (apiErr: any) {
        console.warn('[MAILER] Tentativa via API Resend falhou, tentando fallback SMTP:', apiErr?.message);
        // Fallback para SMTP normal abaixo se a API der erro
      }
    }

    const info = await transporter.sendMail({
      from,
      to,
      replyTo,
      subject,
      html,
      attachments,
    });

    return { success: true as const, messageId: info.messageId };
  } catch (error) {
    console.error("Erro ao enviar e-mail: ", error);
    return { success: false as const, error };
  }
}

// FORMATTER HELPERS — German (de-DE)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
};

const formatPaymentMethodDE = (method: string) => {
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

// --- EMAIL TEMPLATES (100% DEUTSCH) ---

// 1. Client Order Confirmation (mit Rechnungs-PDF im Anhang)
export async function sendClientOrderConfirmation(order: any, userEmail: string, userName: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeEmail: 'kontakt@frankhausgeraete.de',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px; object-contain: contain;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) { }
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0
      ? "Kostenlos!"
      : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName ? `(${metadata.shippingMethodName})` : "";

    // Addresses
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || userName || 'Sehr geehrte(r) Kunde/Kundin');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;

    const paymentMethodStr = formatPaymentMethodDE(order.paymentMethod);
    const orderId = order.id.slice(-6).toUpperCase();

    const itemsHtml = order.orderItems?.map((item: any) => {
      let imageUrl = '';
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
      } else if (typeof item.product?.images === 'string') {
        try {
          const imgs = JSON.parse(item.product.images);
          if (imgs.length > 0) imageUrl = imgs[0];
        } catch (e) { }
      }

      const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
      const imgTag = safeImageUrl
        ? `<img src="${safeImageUrl}" alt="${escapeHtml(item.product?.title || 'Artikel')}" style="width: 52px; height: 52px; object-fit: contain; border-radius: 6px; border: 1px solid #eee; margin-right: 15px;" />`
        : '';

      const sku = item.product?.gtin || item.product?.sku ? `<span style="font-size: 11px; color: #888;">Art.-Nr.: #${escapeHtml(item.product.gtin || item.product.sku)}</span>` : '';

      return `
        <tr style="border-bottom: 1px dashed #e5e7eb;">
          <td style="padding: 14px 0;">
            <table style="width: 100%; border: none;">
              <tr>
                ${imgTag ? `<td style="width: 65px; vertical-align: middle;">${imgTag}</td>` : ''}
                <td style="vertical-align: middle;">
                  <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(item.product?.title || 'Artikel')}</strong><br/>
                  ${sku}
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 14px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${item.quantity}</td>
          <td style="padding: 14px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(item.price)}</td>
        </tr>
      `;
    }).join('') || '';

    // Bank Details logic for German customers
    let bankDetailsHtml = '';
    if (order.paymentMethod === 'BANK_TRANSFER') {
      const dbSettings = await prisma.setting.findMany({
        where: { key: { in: ['BANK_TRANSFER_ACCOUNT_HOLDER', 'BANK_TRANSFER_IBAN', 'BANK_TRANSFER_BIC', 'BANK_TRANSFER_BANK_NAME', 'BANK_TRANSFER_INSTRUCTIONS'] } }
      });
      const settings = dbSettings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);

      bankDetailsHtml = `
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin-top: 25px; margin-bottom: 25px;">
          <h4 style="margin-top: 0; margin-bottom: 12px; color: #c2410c; font-size: 15px; font-weight: bold;">
            💳 Angaben zur Banküberweisung (Vorkasse)
          </h4>
          <p style="font-size: 13px; color: #431407; margin-bottom: 15px; line-height: 1.5;">
            Bitte überweisen Sie den Gesamtbetrag auf das unten angegebene Bankkonto. Bitte geben Sie unbedingt Ihre Bestellnummer <strong>#${orderId}</strong> als Verwendungszweck an.
          </p>
          <table style="width: 100%; font-size: 13px; color: #1e293b; line-height: 1.8;">
            ${settings.BANK_TRANSFER_ACCOUNT_HOLDER ? `<tr><td style="width: 140px; color: #7c2d12;">Kontoinhaber:</td><td><strong>${escapeHtml(settings.BANK_TRANSFER_ACCOUNT_HOLDER)}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_IBAN ? `<tr><td style="color: #7c2d12;">IBAN:</td><td><strong style="letter-spacing: 1px; font-family: monospace;">${escapeHtml(settings.BANK_TRANSFER_IBAN)}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_BIC ? `<tr><td style="color: #7c2d12;">BIC / SWIFT:</td><td><strong>${escapeHtml(settings.BANK_TRANSFER_BIC)}</strong></td></tr>` : ''}
            ${settings.BANK_TRANSFER_BANK_NAME ? `<tr><td style="color: #7c2d12;">Bank:</td><td><strong>${escapeHtml(settings.BANK_TRANSFER_BANK_NAME)}</strong></td></tr>` : ''}
            <tr><td style="color: #7c2d12;">Verwendungszweck:</td><td><strong style="color: #c2410c;">Bestellnummer #${orderId}</strong></td></tr>
          </table>
          <p style="font-size: 12px; color: #9a3412; margin-top: 15px; margin-bottom: 0;">
            Nach Eingang Ihrer Überweisung wird Ihre Bestellung umgehend vorbereitet und an Sie versendet.
          </p>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 10px;">
          Vielen Dank für Ihre Bestellung, ${escapeHtml(userName) || 'Sehr geehrte(r) Kunde/Kundin'}!
        </h1>
        <p style="font-size: 14px; color: #475569; margin-top: 0;">
          Wir bestätigen hiermit gerne den Eingang Ihrer Bestellung <strong>#${orderId}</strong> vom ${formatDate(new Date(order.createdAt))}. Ihre offizielle Rechnung finden Sie als PDF im Anhang.
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 6px;">
          Bestellübersicht #${orderId}
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; background-color: #f8fafc; border-radius: 6px; padding: 15px;">
          <table style="width: 100%; font-size: 13px; color: #475569; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right; color: #0f172a;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versandkosten: ${shippingMethod}</td>
              <td style="text-align: right; color: #0f172a;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #ea580c; font-size: 16px; border-top: 1px solid #e2e8f0;">
              <td><strong>Gesamtbetrag:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #64748b;">Zahlungsart:</td>
              <td style="text-align: right; font-size: 12px; color: #0f172a;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        ${bankDetailsHtml}

        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; padding-bottom: 20px;">
          <table style="width: 100%; font-size: 12px; color: #334155; line-height: 1.5;">
            <tr>
              <td style="vertical-align: top; width: 50%; padding-right: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #ea580c;">Tel: ${escapeHtml(b.phone)}</span><br/>` : ''}
                  ${b.email ? `<a href="mailto:${b.email}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(b.email)}</a>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%; padding-left: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #ea580c;">Tel: ${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 30px; font-size: 13px; color: #475569;">
          <p style="margin-bottom: 8px;">Wir bedanken uns herzlich für Ihren Einkauf und Ihr Vertrauen!</p>
          <p style="margin-top: 0;">Wenn Sie Fragen zu Ihrer Bestellung oder Lieferung haben, kontaktieren Sie uns gerne unter <a href="mailto:${storeEmail}" style="color: #ea580c; font-weight: bold; text-decoration: none;">${storeEmail}</a>.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}<br/>
          E-Mail: ${storeEmail} | <a href="https://frankhausgeraete.de" style="color: #94a3b8; text-decoration: none;">frankhausgeraete.de</a>
        </div>
      </div>
    `;

    const { generateInvoicePDF } = await import('./pdfGenerator');
    let pdfAttachment: any = null;
    try {
      const pdfBuffer = await generateInvoicePDF(order);
      pdfAttachment = {
        filename: `Rechnung-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      };
    } catch (pdfErr) {
      console.error('Fehler beim Erstellen des Rechnungs-PDF:', pdfErr);
    }

    return sendEmail({
      to: userEmail,
      subject: `Bestellbestätigung #${orderId} - ${storeName}`,
      html,
      attachments: pdfAttachment ? [pdfAttachment] : []
    });
  } catch (e) {
    console.error(e);
  }
}

// 2. Admin New Order Notification
export async function sendAdminOrderNotification(order: any, adminEmail: string, customerDetails: any) {
  try {
    const { logo, storeName } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 40px;"></div>`
      : `<div style="font-size: 18px; font-weight: bold; color: #ea580c; margin-bottom: 20px;">${escapeHtml(storeName)}</div>`;

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) { }
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0
      ? "Kostenlos!"
      : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName ? `(${metadata.shippingMethodName})` : "";

    // Addresses
    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || customerDetails?.name || 'Kunde');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;

    const paymentMethodStr = formatPaymentMethodDE(order.paymentMethod);
    const orderId = order.id.slice(-6).toUpperCase();

    const itemsHtml = order.orderItems?.map((item: any) => {
      let imageUrl = '';
      if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
        imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
      } else if (typeof item.product?.images === 'string') {
        try {
          const imgs = JSON.parse(item.product.images);
          if (imgs.length > 0) imageUrl = imgs[0];
        } catch (e) { }
      }

      const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
      const imgTag = safeImageUrl
        ? `<img src="${safeImageUrl}" alt="${escapeHtml(item.product?.title || 'Artikel')}" style="width: 48px; height: 48px; object-fit: contain; border-radius: 4px; margin-right: 12px; border: 1px solid #eee;" />`
        : '';

      const sku = item.product?.gtin || item.product?.sku ? `(#${escapeHtml(item.product.gtin || item.product.sku)})` : '';

      return `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 12px 0;">
            <table style="width: 100%; border: none;">
              <tr>
                ${imgTag ? `<td style="width: 60px; vertical-align: middle;">${imgTag}</td>` : ''}
                <td style="vertical-align: middle;">
                  <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(item.product?.title || 'Artikel')}</strong><br/>
                  <span style="font-size: 11px; color: #64748b;">${sku}</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 12px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${item.quantity}</td>
          <td style="padding: 12px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(item.price)}</td>
        </tr>
      `;
    }).join('') || '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 10px;">
          🎉 Neue Bestellung eingegangen: Nr. ${orderId}
        </h1>
        <p style="font-size: 14px; color: #475569;">
          Sie haben eine neue Bestellung von <strong>${billingName}</strong> am ${formatDate(new Date(order.createdAt))} erhalten.
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 6px;">
          Bestellübersicht #${orderId}
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; background-color: #f8fafc; border-radius: 6px; padding: 15px;">
          <table style="width: 100%; font-size: 13px; color: #475569; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right; color: #0f172a;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versandkosten: ${shippingMethod}</td>
              <td style="text-align: right; color: #0f172a;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #ea580c; font-size: 16px; border-top: 1px solid #e2e8f0;">
              <td><strong>Gesamtwert:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #64748b;">Zahlungsart:</td>
              <td style="text-align: right; font-size: 12px; color: #0f172a; font-weight: bold;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; padding-bottom: 20px;">
          <table style="width: 100%; font-size: 12px; color: #334155; line-height: 1.5;">
            <tr>
              <td style="vertical-align: top; width: 50%; padding-right: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #ea580c;">Tel: ${escapeHtml(b.phone)}</span><br/>` : ''}
                  ${b.email ? `<a href="mailto:${b.email}" style="color: #2563eb; text-decoration: underline;">${escapeHtml(b.email)}</a>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%; padding-left: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #ea580c;">Tel: ${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 25px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://frankhausgeraete.de'}/admin/orders/${order.id}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Bestellung im Admin-Bereich ansehen
          </a>
        </div>
      </div>
    `;

    const customerEmail = customerDetails?.email || b.email || order.user?.email;
    const customerFullName = `${b.firstName || ''} ${b.lastName || ''}`.trim() || customerDetails?.name;
    const replyTo = customerEmail
      ? (customerFullName ? `"${customerFullName}" <${customerEmail}>` : customerEmail)
      : undefined;

    return sendEmail({
      to: adminEmail,
      replyTo,
      subject: `🚨 [Neue Bestellung] #${orderId} - ${formatPrice(order.total)} (${billingName})`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 3. Client Order Status Update (Versendet / Zugestellt / Storniert / In Bearbeitung)
export async function sendOrderStatusUpdate(order: any, userEmail: string, status: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeEmail: 'kontakt@frankhausgeraete.de',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const orderId = order.id.slice(-6).toUpperCase();
    let title = "Aktualisierung zu Ihrer Bestellung";
    let message = `Der Status Ihrer Bestellung <strong>#${orderId}</strong> wurde aktualisiert.`;
    let color = "#1e293b";
    let subject = `Aktualisierung Ihrer Bestellung #${orderId} - ${storeName}`;

    if (status === 'SHIPPED') {
      title = "Ihre Bestellung ist auf dem Weg! 🚚";
      message = `Wir freuen uns, Ihnen mitteilen zu können, dass Ihre Bestellung <strong>#${orderId}</strong> versendet wurde und sich auf dem Weg zu Ihrer Lieferadresse befindet.`;
      color = "#16a34a";
      subject = `Ihre Bestellung #${orderId} wurde versendet! 🚚 - ${storeName}`;
    } else if (status === 'CANCELLED') {
      title = "Information zu Ihrer Bestellung";
      message = `Wir informieren Sie hiermit, dass Ihre Bestellung <strong>#${orderId}</strong> storniert wurde. Falls eine Zahlung geleistet wurde, wird der Betrag umgehend erstattet.`;
      color = "#dc2626";
      subject = `Stornierung Ihrer Bestellung #${orderId} - ${storeName}`;
    } else if (status === 'DELIVERED') {
      title = "Ihre Bestellung wurde erfolgreich zugestellt! 📦";
      message = `Ihre Bestellung <strong>#${orderId}</strong> wurde zugestellt. Wir hoffen, dass Sie mit Ihren neuen Geräten rundum zufrieden sind!`;
      color = "#16a34a";
      subject = `Ihre Bestellung #${orderId} wurde zugestellt! 📦 - ${storeName}`;
    } else if (status === 'PROCESSING') {
      title = "Ihre Bestellung wird vorbereitet ⚙️";
      message = `Ihre Bestellung <strong>#${orderId}</strong> befindet sich in Bearbeitung und wird von unserem Team sorgfältig für den Versand vorbereitet.`;
      color = "#ea580c";
      subject = `Ihre Bestellung #${orderId} ist in Vorbereitung ⚙️ - ${storeName}`;
    }

    let metadata: any = {};
    if (order.destinationAddress) {
      try {
        metadata = typeof order.destinationAddress === 'string' ? JSON.parse(order.destinationAddress) : order.destinationAddress;
      } catch (e) { }
    }

    const subTotal = metadata?.subTotal || order.orderItems?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || order.total;
    const shippingCostStr = metadata?.shippingCost === 0
      ? "Kostenlos!"
      : (metadata?.shippingCost ? formatPrice(metadata.shippingCost) : "0,00 €");
    const shippingMethod = metadata?.shippingMethodName ? `(${metadata.shippingMethodName})` : "";

    const b = metadata?.billing || {};
    const s = metadata?.shipping || b;
    const billingName = escapeHtml(`${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Sehr geehrte(r) Kunde/Kundin');
    const shippingName = escapeHtml(`${s.firstName || ''} ${s.lastName || ''}`.trim()) || billingName;
    const billingAddressHtml = `${escapeHtml(b.address1 || '')}<br/>${escapeHtml(b.postalCode || '')} ${escapeHtml(b.city || '')}${b.country ? `, ${escapeHtml(b.country)}` : ''}`;
    const shippingAddressHtml = `${escapeHtml(s.address1 || '')}<br/>${escapeHtml(s.postalCode || '')} ${escapeHtml(s.city || '')}${s.country ? `, ${escapeHtml(s.country)}` : ''}`;
    const paymentMethodStr = formatPaymentMethodDE(order.paymentMethod);

    let itemsHtml = '';
    if (order.orderItems && order.orderItems.length > 0) {
      itemsHtml = order.orderItems.map((item: any) => {
        let imageUrl = '';
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
        } else if (typeof item.product?.images === 'string') {
          try {
            const imgs = JSON.parse(item.product.images);
            if (imgs.length > 0) imageUrl = imgs[0];
          } catch (e) { }
        }

        const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
        const imgTag = safeImageUrl
          ? `<img src="${safeImageUrl}" alt="Artikel" style="width: 48px; height: 48px; object-fit: contain; border-radius: 4px; margin-right: 12px; border: 1px solid #eee;" />`
          : '';

        return `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 12px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  ${imgTag ? `<td style="width: 60px; vertical-align: middle;">${imgTag}</td>` : ''}
                  <td style="vertical-align: middle;">
                    <span style="font-size: 13px; color: #1e293b; font-weight: 600;">${escapeHtml(item.product?.title || 'Artikel')}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 12px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(item.price)}</td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: ${color}; margin-top: 0; margin-bottom: 12px;">${title}</h1>
        <p style="font-size: 14px; color: #475569;">Hallo ${billingName},</p>
        <p style="font-size: 14px; color: #475569;">${message}</p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 6px;">
          Bestellübersicht #${orderId}
        </h3>
        
        ${itemsHtml ? `
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        ` : ''}
        
        <div style="margin-top: 20px; background-color: #f8fafc; border-radius: 6px; padding: 15px;">
          <table style="width: 100%; font-size: 13px; color: #475569; line-height: 2;">
            <tr>
              <td>Zwischensumme:</td>
              <td style="text-align: right; color: #0f172a;">${formatPrice(subTotal)}</td>
            </tr>
            <tr>
              <td>Versandkosten: ${shippingMethod}</td>
              <td style="text-align: right; color: #0f172a;">${shippingCostStr}</td>
            </tr>
            <tr style="color: #ea580c; font-size: 16px; border-top: 1px solid #e2e8f0;">
              <td><strong>Gesamtbetrag:</strong></td>
              <td style="text-align: right;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
            <tr>
              <td style="font-size: 12px; color: #64748b;">Zahlungsart:</td>
              <td style="text-align: right; font-size: 12px; color: #0f172a;">${paymentMethodStr}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px; padding-bottom: 20px;">
          <table style="width: 100%; font-size: 12px; color: #334155; line-height: 1.5;">
            <tr>
              <td style="vertical-align: top; width: 50%; padding-right: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Rechnungsadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${billingName}<br/>
                  ${billingAddressHtml}<br/>
                  ${b.phone ? `<span style="color: #ea580c;">Tel: ${escapeHtml(b.phone)}</span><br/>` : ''}
                </div>
              </td>
              <td style="vertical-align: top; width: 50%; padding-left: 10px;">
                <strong style="font-size: 13px; color: #0f172a;">Lieferadresse</strong><br/>
                <div style="margin-top: 8px; color: #475569;">
                  ${shippingName}<br/>
                  ${shippingAddressHtml}<br/>
                  ${s.phone ? `<span style="color: #ea580c;">Tel: ${escapeHtml(s.phone)}</span>` : ''}
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 25px; font-size: 13px; color: #475569;">
          <p>Für weitere Fragen kontaktieren Sie uns gerne jederzeit per E-Mail unter <a href="mailto:${storeEmail}" style="color: #ea580c; text-decoration: none; font-weight: bold;">${storeEmail}</a>.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}<br/>
          E-Mail: ${storeEmail}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 4. Abandoned Cart Recovery Email (Warenkorb-Erinnerung)
export async function sendAbandonedCartRecoveryEmail(cart: any, userEmail: string, userName: string, checkoutUrl: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeEmail: 'kontakt@frankhausgeraete.de',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const couponMessage = "Nutzen Sie den Gutscheincode BH874XP für 25 € Sofortrabatt auf Ihre Bestellung!";

    let itemsHtml = '';
    if (Array.isArray(cart.cartData) && cart.cartData.length > 0) {
      const productIds = cart.cartData
        .map((i: any) => i?.productId)
        .filter((id: any): id is string => typeof id === 'string');

      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, isDeleted: false },
        select: { id: true, title: true, price: true, images: true }
      });
      const dbMap = new Map(dbProducts.map(p => [p.id, p]));

      itemsHtml = cart.cartData.map((item: any) => {
        const dbProduct = item?.productId ? dbMap.get(item.productId) : null;
        const title = dbProduct?.title || item?.title || 'Artikel';
        const price = dbProduct?.price ?? (Number(item?.price) || 0);
        const rawImages = dbProduct?.images || item?.product?.images;

        let imageUrl = '';
        if (Array.isArray(rawImages) && rawImages.length > 0) {
          imageUrl = typeof rawImages[0] === 'string' ? rawImages[0] : (rawImages[0]?.url || '');
        } else if (typeof rawImages === 'string') {
          try {
            const parsed = JSON.parse(rawImages);
            if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
          } catch { }
        }

        const safeImageUrl = imageUrl && /^https?:\/\//i.test(imageUrl) ? escapeHtml(imageUrl) : '';
        const imgTag = safeImageUrl
          ? `<img src="${safeImageUrl}" alt="Artikel" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; margin-right: 15px; border: 1px solid #eee;" />`
          : '';
        const qty = Math.min(Math.max(1, Number(item?.quantity) || 1), 999);

        return `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 14px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  ${imgTag ? `<td style="width: 65px; vertical-align: middle;">${imgTag}</td>` : ''}
                  <td style="vertical-align: middle;">
                    <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(title)}</strong>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 14px 0; text-align: center; vertical-align: middle; color: #64748b; font-size: 13px;">×${qty}</td>
            <td style="padding: 14px 0; text-align: right; vertical-align: middle; color: #1e293b; font-weight: 600; font-size: 13px;">${formatPrice(price)}</td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          Ihre ausgewählten Artikel warten noch auf Sie! 🔥
        </h1>
        <p style="font-size: 14px; color: #475569;">Hallo ${escapeHtml(userName) || 'Sehr geehrte(r) Kunde/Kundin'},</p>
        <p style="font-size: 14px; color: #475569;">
          Sie haben Produkte in unserem Online-Shop ausgewählt, Ihre Bestellung jedoch noch nicht abgeschlossen. Wir haben Ihren Warenkorb für Sie gespeichert, damit Sie den Kauf jederzeit bequem abschließen können.
        </p>
        
        <div style="background-color: #fff7ed; border: 1px dashed #ea580c; border-radius: 8px; padding: 16px; margin: 25px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; font-weight: bold; color: #c2410c;">${couponMessage}</p>
        </div>

        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 6px;">
          Artikel in Ihrem Warenkorb
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead style="text-align: left; border-bottom: 1px solid #e2e8f0;">
            <tr>
              <th style="padding-bottom: 10px; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Artikel</th>
              <th style="padding-bottom: 10px; text-align: center; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Menge</th>
              <th style="padding-bottom: 10px; text-align: right; font-weight: bold; font-size: 12px; color: #64748b; text-transform: uppercase;">Preis</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 35px; text-align: center;">
          <a href="${checkoutUrl}" style="background-color: #ea580c; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Bestellung jetzt abschließen
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 40px; margin-bottom: 30px; font-size: 13px; color: #475569;">
          <p>Falls Sie Fragen zu Produkten oder Lieferungen haben, kontaktieren Sie uns gerne unter <a href="mailto:${storeEmail}" style="color: #ea580c; font-weight: bold; text-decoration: none;">${storeEmail}</a>.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Haben Sie etwas in Ihrem Warenkorb vergessen? 🔥 - ${storeName}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 5. Review Request Email (Bewertungsanfrage nach Zustellung)
export async function sendReviewRequestEmail(order: any, userEmail: string, userName: string, storeUrl: string) {
  try {
    const { logo, storeName, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #ea580c; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const orderId = order.id.slice(-6).toUpperCase();

    let itemsHtml = '';
    if (order.orderItems && order.orderItems.length > 0) {
      itemsHtml = order.orderItems.map((item: any) => {
        let imageUrl = '';
        if (item.product?.images && Array.isArray(item.product.images) && item.product.images.length > 0) {
          imageUrl = typeof item.product.images[0] === 'string' ? item.product.images[0] : item.product.images[0].url;
        } else if (typeof item.product?.images === 'string') {
          try {
            const imgs = JSON.parse(item.product.images);
            if (imgs.length > 0) imageUrl = imgs[0];
          } catch (e) { }
        }

        const imgTag = imageUrl
          ? `<img src="${imageUrl}" alt="Artikel" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px; margin-right: 15px; border: 1px solid #eee;" />`
          : '';

        return `
          <tr style="border-bottom: 1px dashed #e2e8f0;">
            <td style="padding: 14px 0;">
              <table style="width: 100%; border: none;">
                <tr>
                  ${imgTag ? `<td style="width: 65px; vertical-align: middle;">${imgTag}</td>` : ''}
                  <td style="vertical-align: middle;">
                    <strong style="font-size: 13px; color: #1e293b;">${escapeHtml(item.product?.title || 'Artikel')}</strong>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 14px 0; text-align: right; vertical-align: middle;">
              <a href="${storeUrl}/produkt/${item.product?.slug || item.product?.id}" style="background-color: #ea580c; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; display: inline-block;">
                Artikel bewerten
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          Wie war Ihre Erfahrung mit FRANK HAUSGERÄTE?
        </h1>
        <p style="font-size: 14px; color: #475569;">Hallo ${escapeHtml(userName) || 'Sehr geehrte(r) Kunde/Kundin'},</p>
        <p style="font-size: 14px; color: #475569;">
          Wir hoffen, dass Sie mit den Artikeln aus Ihrer kürzlichen Bestellung bei <strong>${escapeHtml(storeName)}</strong> rundum zufrieden sind!
        </p>
        <p style="font-size: 14px; color: #475569;">
          Ihre Meinung ist uns sehr wichtig und hilft anderen Kunden bei der Auswahl passender Haushaltsgeräte für ihr Zuhause.
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-top: 30px; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #ea580c; padding-bottom: 6px;">
          Ihre Bewertung abgeben
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 30px; font-size: 13px; color: #475569;">
          <p>Wir bedanken uns herzlich für Ihr Feedback und Ihre Unterstützung.</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Wie war Ihre Erfahrung? Bewerten Sie Ihre Bestellung #${orderId} - ${storeName}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 6. Admin Low Stock Alert (Warnung bei geringem Lagerbestand)
export async function sendLowStockAlertEmail(
  productTitle: string,
  variationName: string | null,
  currentStock: number,
  threshold: number,
  adminEmail: string,
  storeUrl: string,
  productId: string
) {
  try {
    const { logo, storeName, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 40px;"></div>`
      : `<div style="font-size: 18px; font-weight: bold; color: #ea580c; margin-bottom: 20px;">${escapeHtml(storeName)}</div>`;

    const productName = variationName ? `${productTitle} (${variationName})` : productTitle;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #dc2626; margin-top: 0; margin-bottom: 12px;">⚠️ Warnung: Kritischer Lagerbestand</h1>
        <p style="font-size: 14px; color: #475569;">Achtung Administrator,</p>
        <p style="font-size: 14px; color: #475569;">Der Lagerbestand des folgenden Artikels hat den Schwellenwert (${threshold} Stück) unterschritten.</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0;">
          <h3 style="margin-top: 0; color: #991b1b; font-size: 15px;">${escapeHtml(productName)}</h3>
          <p style="margin-bottom: 0; font-size: 15px; color: #1e293b;">
            <strong>Verbleibender Lagerbestand: <span style="color: #dc2626; font-size: 18px;">${currentStock}</span> Stück</strong>
          </p>
        </div>
        
        <p style="margin-top: 30px; text-align: center; margin-bottom: 30px;">
          <a href="${storeUrl}/admin/products/${productId}/edit" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Lagerbestand im Admin-Bereich anpassen
          </a>
        </p>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `⚠️ [Lagerbestand-Warnung] ${productName} - Nur noch ${currentStock} Stück auf Lager`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 7. Admin New Chat Message Notification (Neue Kundenservice-Nachricht)
export async function sendAdminNewChatMessageEmail(
  guestName: string,
  guestEmail: string | null,
  messageContent: string,
  adminEmail: string,
  storeUrl: string
) {
  try {
    const { logo, storeName, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 40px;"></div>`
      : `<div style="font-size: 18px; font-weight: bold; color: #ea580c; margin-bottom: 20px;">${escapeHtml(storeName)}</div>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">💬 Neue Kundenservice-Nachricht</h1>
        <p style="font-size: 14px; color: #475569;">Ein Besucher hat eine Nachricht über den Online-Chat in Ihrem Shop hinterlassen.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <tr>
            <td style="padding: 12px; font-size: 13px; font-weight: bold; width: 100px; color: #64748b;">Von:</td>
            <td style="padding: 12px; font-size: 13px; color: #0f172a;">
              <strong>${escapeHtml(guestName) || "Besucher"}</strong>
              ${guestEmail ? ` &lt;<a href="mailto:${guestEmail}" style="color: #2563eb;">${escapeHtml(guestEmail)}</a>&gt;` : ""}
            </td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 12px; vertical-align: top; font-size: 13px; font-weight: bold; color: #64748b;">Nachricht:</td>
            <td style="padding: 12px; font-size: 13px; color: #1e293b; font-style: italic; line-height: 1.5;">
              "${escapeHtml(messageContent)}"
            </td>
          </tr>
        </table>
        
        <p style="margin-top: 30px; text-align: center; margin-bottom: 30px;">
          <a href="${storeUrl}/admin/chat" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">
            Im Admin-Chat antworten
          </a>
        </p>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    const replyTo = guestEmail
      ? (guestName ? `"${guestName}" <${guestEmail}>` : guestEmail)
      : undefined;

    return sendEmail({
      to: adminEmail,
      replyTo,
      subject: `💬 [Kundenservice Chat] Neue Nachricht von ${escapeHtml(guestName) || "Besucher"}`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// 8. Newsletter Welcome Email for Client (Willkommensgutschein mit 10% Rabatt)
export async function sendNewsletterWelcomeEmail(userEmail: string) {
  try {
    const { logo, storeName, storeEmail, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeEmail: 'kontakt@frankhausgeraete.de',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 25px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 48px;"></div>`
      : `<div style="font-size: 20px; font-weight: bold; color: #dc2626; margin-bottom: 25px;">${escapeHtml(storeName)}</div>`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          🎁 Willkommen! Erhalten Sie 10% Rabatt auf Ihren nächsten Einkauf
        </h1>
        
        <p style="font-size: 14px; color: #475569; margin-bottom: 16px;">
          Wir freuen uns sehr, Sie in unserer Community begrüßen zu dürfen! 🌿
        </p>
        <p style="font-size: 14px; color: #475569; margin-bottom: 25px;">
          Als besonderes Willkommensgeschenk schenken wir Ihnen <strong>10% Sofortrabatt</strong> auf Ihre nächste Bestellung hochwertiger Haushaltsgeräte!
        </p>
        
        <div style="background-color: #fef2f2; border: 2px dashed #dc2626; padding: 22px; text-align: center; border-radius: 8px; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 13px; color: #991b1b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">
            Ihr persönlicher Gutscheincode:
          </p>
          <p style="margin: 10px 0 0 0; font-size: 26px; font-weight: 800; color: #dc2626; letter-spacing: 3px; font-family: monospace;">
            🏷️ WELCOME10
          </p>
        </div>
        
        <p style="font-size: 13px; color: #64748b; margin-bottom: 25px; text-align: center;">
          Geben Sie den Gutscheincode einfach im Checkout ein, um den Rabatt einzulösen! 🛒
        </p>
        
        <h3 style="font-size: 15px; font-weight: bold; margin-bottom: 12px; color: #0f172a; border-bottom: 2px solid #dc2626; padding-bottom: 6px;">
          Exklusive Vorteile des FRANK HAUSGERÄTE Newsletters:
        </h3>
        <ul style="font-size: 13px; color: #475569; padding-left: 20px; margin-bottom: 25px; line-height: 1.8;">
          <li>✨ Exklusive Rabattaktionen und saisonale Sonderangebote</li>
          <li>🏠 Neuheiten aus den Bereichen Haushaltsgroßgeräte, Kaffeevollautomaten und Küchengeräte</li>
          <li>💡 Expertentipps zu Pflege, Energieeffizienz und moderner Haustechnik</li>
        </ul>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="https://frankhausgeraete.de/produkt" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
            Jetzt im Online-Shop stöbern
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 35px; margin-bottom: 25px; font-size: 13px; color: #475569;">
          <p style="font-weight: bold; color: #dc2626; margin-bottom: 4px;">Das Team von FRANK HAUSGERÄTE</p>
          <p style="margin-top: 0; font-size: 12px; color: #64748b;">Kontakt: ${storeEmail}</p>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: userEmail,
      subject: `Willkommen bei FRANK HAUSGERÄTE! Ihr 10% Willkommensgutschein 🎁`,
      html
    });
  } catch (e) {
    console.error(e);
  }
}

// Helper to retrieve the active administrator notification email
export async function getAdminNotificationEmail(): Promise<string> {
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { email: true }
    });
    const settingsDb = await prisma.setting.findMany({
      where: { key: { in: ['CONTACT_RECEIVER_EMAIL', 'CONTACT_FORM_RECIPIENT', 'ADMIN_EMAIL'] } }
    });
    const sMap = settingsDb.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
    const configuredReceiver = sMap['CONTACT_RECEIVER_EMAIL'] || sMap['CONTACT_FORM_RECIPIENT'] || sMap['ADMIN_EMAIL'];
    if (configuredReceiver && !configuredReceiver.includes('@frankhausgeraete.de')) {
      return configuredReceiver;
    }
    return adminUser?.email || configuredReceiver || 'kemd622@gmail.com';
  } catch {
    return 'kemd622@gmail.com';
  }
}

// 9. Admin Notification on Newsletter Subscription
export async function sendAdminNewsletterNotification(subscriberEmail: string, ip?: string) {
  try {
    const adminEmail = await getAdminNotificationEmail();
    const { logo, storeName, storeAddress } = await getTransporter().catch(() => ({
      logo: '',
      storeName: 'FRANK HAUSGERÄTE',
      storeAddress: 'Wildbader Straße 51, 75394 Oberreichenbach, Deutschland'
    }));

    const logoHtml = logo
      ? `<div style="text-align: left; margin-bottom: 20px;"><img src="${logo}" alt="${escapeHtml(storeName)}" style="max-height: 40px;"></div>`
      : `<div style="font-size: 18px; font-weight: bold; color: #ea580c; margin-bottom: 20px;">${escapeHtml(storeName)}</div>`;

    const nowDE = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 25px; background: #ffffff;">
        ${logoHtml}
        <h1 style="font-size: 20px; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
          📬 Neue Newsletter-Anmeldung
        </h1>
        <p style="font-size: 14px; color: #475569;">
          Ein neuer Kunde hat sich für den Newsletter auf <strong>${escapeHtml(storeName)}</strong> angemeldet.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <tr>
            <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; width: 130px; color: #64748b;">Kunden-E-Mail:</td>
            <td style="padding: 12px 16px; font-size: 14px;">
              <a href="mailto:${escapeHtml(subscriberEmail)}" style="color: #ea580c; text-decoration: none; font-weight: 600;">${escapeHtml(subscriberEmail)}</a>
            </td>
          </tr>
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #64748b;">Datum & Uhrzeit:</td>
            <td style="padding: 12px 16px; font-size: 13px; color: #1e293b;">
              ${nowDE}
            </td>
          </tr>
          ${ip ? `
          <tr style="border-top: 1px solid #e2e8f0;">
            <td style="padding: 12px 16px; font-size: 13px; font-weight: bold; color: #64748b;">IP-Adresse:</td>
            <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-family: monospace;">
              ${escapeHtml(ip)}
            </td>
          </tr>` : ''}
        </table>

        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 12px 16px; border-radius: 0 6px 6px 0; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 13px; color: #9a3412;">
            Der Kunde wurde zur Bestätigungsseite weitergeleitet und hat die Willkommens-E-Mail mit dem 10% Rabattcode (<strong>WELCOME10</strong>) erhalten.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
          <strong style="color: #64748b;">${escapeHtml(storeName)}</strong><br/>
          ${escapeHtml(storeAddress)}
        </div>
      </div>
    `;

    return sendEmail({
      to: adminEmail,
      subject: `📬 [Newsletter] Neue Anmeldung von ${subscriberEmail}`,
      html,
    });
  } catch (err) {
    console.error('Fehler beim Senden der Newsletter-Benachrichtigung an den Administrator:', err);
  }
}

// 10. Supervision Live Admin Alert Email
export async function sendAdminAlertEmail({
  title,
  message,
  details,
}: {
  title: string;
  message: string;
  details?: Record<string, any>;
}) {
  try {
    const recipient = await getAdminNotificationEmail();

    let detailsHtml = '';
    if (details && Object.keys(details).length > 0) {
      detailsHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin-top: 15px;">
          <table style="width: 100%; font-size: 13px; color: #334155;">
            ${Object.entries(details).map(([k, v]) => `
              <tr>
                <td style="padding: 4px 8px; font-weight: bold; width: 140px; vertical-align: top;">${escapeHtml(k)}:</td>
                <td style="padding: 4px 8px; font-family: monospace;">${escapeHtml(typeof v === 'object' ? JSON.stringify(v) : String(v))}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
        <div style="background-color: #ef4444; color: white; padding: 12px 20px; border-radius: 6px 6px 0 0; font-size: 16px; font-weight: bold;">
          ⚠️ Live-Überwachung des Online-Shops: ${escapeHtml(title)}
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px; border-radius: 0 0 6px 6px; background: white;">
          <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">${escapeHtml(message)}</p>
          ${detailsHtml}
          <p style="font-size: 12px; color: #64748b; margin-top: 25px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            Automatische Warnmeldung des Shop-Überwachungssystems.
          </p>
        </div>
      </div>
    `;

    return sendEmail({
      to: recipient,
      subject: `🚨 [Shop-Überwachung] ${title}`,
      html,
    });
  } catch (err) {
    console.error('Fehler beim Senden der Überwachungs-E-Mail an den Administrator:', err);
  }
}
