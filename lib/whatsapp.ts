/**
 * Builds a wa.me deep link with a pre-filled message. No WhatsApp Business
 * API or key needed — this is just a formatted URL that opens a chat.
 */
const MARKET_DIAL_CODES: Record<string, { dialCode: string; nationalLength: number }> = {
  NG: { dialCode: "234", nationalLength: 10 },
  GH: { dialCode: "233", nationalLength: 9 },
  KE: { dialCode: "254", nationalLength: 9 },
  ZA: { dialCode: "27", nationalLength: 9 },
};

export function normalizeWhatsAppPhone(phone: string, countryCode?: string): string | null {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
  }

  const market = countryCode ? MARKET_DIAL_CODES[countryCode.toUpperCase()] : undefined;
  if (!market) return null;
  if (digits.startsWith(market.dialCode) && digits.length === market.dialCode.length + market.nationalLength) {
    return digits;
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === market.nationalLength ? `${market.dialCode}${digits}` : null;
}

export function buildWhatsAppLink(phone: string, message: string, countryCode?: string): string {
  const digitsOnly = normalizeWhatsAppPhone(phone, countryCode) ?? phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

/**
 * Format a property inquiry message for WhatsApp
 */
export function formatPropertyInquiryMessage(
  propertyTitle: string,
  propertyPrice: number,
  propertyAddress: string,
  buyerName: string,
  buyerMessage?: string,
  propertyLink?: string,
  currency = "NGN"
): string {
  const priceFormatted = `${propertyPrice.toLocaleString()} ${currency}`;
  
  let message = `Hi! I'm interested in this property:\n\n`;
  message += `🏠 ${propertyTitle}\n`;
  message += `📍 ${propertyAddress}\n`;
  message += `💰 ${priceFormatted}\n\n`;
  
  if (buyerMessage) {
    message += `Message from ${buyerName}:\n${buyerMessage}\n\n`;
  } else {
    message += `From: ${buyerName}\n\n`;
  }
  
  if (propertyLink) {
    message += `View property: ${propertyLink}\n`;
  }
  
  return message;
}

/**
 * Format an inquiry response message for WhatsApp
 */
export function formatInquiryResponseMessage(
  agentName: string,
  propertyTitle: string,
  responseMessage: string,
  agentPhone?: string
): string {
  let message = `Hi! ${agentName} from Fabhouse replied to your inquiry about ${propertyTitle}:\n\n`;
  message += `${responseMessage}\n\n`;
  
  if (agentPhone) {
    message += `Call/WhatsApp: ${agentPhone}`;
  }
  
  return message;
}

export function isValidWhatsAppPhone(phone: string, countryCode?: string): boolean {
  return normalizeWhatsAppPhone(phone, countryCode) !== null;
}
