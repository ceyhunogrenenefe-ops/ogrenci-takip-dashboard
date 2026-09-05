export type WhatsAppSendResult =
  | { success: true; message_id?: string; to: string; status: "sent" }
  | { success: false; error: string; details?: unknown; status: "error"; httpStatus: number };

export async function sendWhatsAppText(to: string, message: string): Promise<WhatsAppSendResult> {
  const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
  const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";

  if (!ACCESS_TOKEN) {
    return {
      success: false,
      error: "WHATSAPP_TOKEN not found in environment variables",
      status: "error",
      httpStatus: 400,
    };
  }

  if (!PHONE_NUMBER_ID) {
    return {
      success: false,
      error: "WHATSAPP_PHONE_ID not found in environment variables",
      status: "error",
      httpStatus: 400,
    };
  }

  const cleanPhone = String(to).replace(/[^\d]/g, "");
  const formattedPhone = cleanPhone.startsWith("90") ? cleanPhone : `90${cleanPhone}`;

  const apiUrl = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "text",
    text: {
      preview_url: true,
      body: message,
    },
  };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: responseData.error?.message || "WhatsApp API error",
      details: responseData.error,
      status: "error",
      httpStatus: response.status,
    };
  }

  return {
    success: true,
    message_id: responseData.messages?.[0]?.id,
    to: formattedPhone,
    status: "sent",
  };
}
