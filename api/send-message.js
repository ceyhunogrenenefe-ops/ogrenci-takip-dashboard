// api/send-message.js - WhatsApp Mesaj Gönderme API

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Telefon numarası ve mesaj gerekli' });
    }

    try {
        const response = await fetch(
            'https://graph.instagram.com/v18.0/105451023440373/messages',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to,
                    type: 'text',
                    text: { body: message }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('WhatsApp API Hatası:', data);
            return res.status(response.status).json({ 
                error: data.error?.message || 'WhatsApp mesaj gönderilemedi'
            });
        }

        return res.status(200).json({ 
            success: true,
            message: 'Mesaj gönderildi',
            data
        });
    } catch (error) {
        console.error('Server Hatası:', error);
        return res.status(500).json({ 
            error: 'Sunucu hatası: ' + error.message 
        });
    }
}
