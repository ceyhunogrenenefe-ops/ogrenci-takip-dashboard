// api/send-message.js - WhatsApp Mesaj Gönderme
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { to, message } = req.body || {};

        if (!to || !message) {
            return res.status(400).json({
                error: 'to and message are required',
                status: 'error'
            });
        }

        const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;
        const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
        const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

        if (!ACCESS_TOKEN) {
            return res.status(400).json({
                error: 'WHATSAPP_TOKEN not found in environment variables',
                status: 'error'
            });
        }

        if (!PHONE_NUMBER_ID) {
            return res.status(400).json({
                error: 'WHATSAPP_PHONE_ID not found in environment variables',
                status: 'error'
            });
        }

        const cleanPhone = String(to).replace(/[^\d]/g, '');
        const formattedPhone = cleanPhone.startsWith('90') ? cleanPhone : '90' + cleanPhone;

        // WhatsApp Cloud API uses graph.facebook.com (not graph.instagram.com)
        const apiUrl = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

        const payload = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'text',
            text: {
                preview_url: true,
                body: message
            }
        };

        console.log('WhatsApp Request:', {
            url: apiUrl,
            to: formattedPhone,
            message: String(message).substring(0, 50) + '...'
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API Error:', responseData);
            return res.status(response.status).json({
                error: responseData.error?.message || 'WhatsApp API error',
                details: responseData.error,
                status: 'error'
            });
        }

        console.log('Message sent:', responseData);

        return res.status(200).json({
            success: true,
            message_id: responseData.messages?.[0]?.id,
            to: formattedPhone,
            status: 'sent'
        });
    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({
            error: error.message,
            status: 'error'
        });
    }
};
