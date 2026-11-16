/**
 * Builds a wa.me deep link with a pre-filled message. No WhatsApp Business
 * API or key needed — this is just a formatted URL that opens a chat.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digitsOnly = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
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
  propertyLink?: string
): string {
  const priceFormatted = `₦${propertyPrice.toLocaleString()}`;
  
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

/**
 * Validate Nigerian phone number
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^\d+]/g, "");
  // Accept formats: +234..., 0234..., 234...
  return /^(\+234|234|0)[\d]{10}$/.test(cleaned);
}
