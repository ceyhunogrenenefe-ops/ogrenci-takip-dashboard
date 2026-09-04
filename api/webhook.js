// api/webhook.js - WhatsApp Webhook Handler
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Verification token (Meta tarafından gönderilen)
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "123456";

    // GET - Webhook Doğrulama (Facebook'tan)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified');
            return res.status(200).send(challenge);
        } else {
            return res.status(403).json({ error: 'Forbidden' });
        }
    }

    // POST - Gelen Mesajları Al
    if (req.method === 'POST') {
        const body = req.body;

        // Meta gönderdiği format
        if (body.object === 'whatsapp_business_account') {
            const changes = body.entry?.[0]?.changes?.[0]?.value;

            if (changes?.messages) {
                changes.messages.forEach(msg => {
                    const from = msg.from;
                    const text = msg.text?.body || '';
                    const timestamp = msg.timestamp;

                    // Bu mesajı backend'e kaydet veya veritabanına gönder
                    console.log(`📨 Gelen Mesaj: ${from} → ${text}`);

                    // Örnek: Redis/Database'ye kaydet
                    // saveIncomingMessage(from, text, timestamp);
                });
            }

            // Status güncelleme
            if (changes?.statuses) {
                changes.statuses.forEach(status => {
                    console.log(`📤 Mesaj Status: ${status.id} → ${status.status}`);
                });
            }

            return res.status(200).json({ received: true });
        }

        return res.status(400).json({ error: 'Invalid format' });
    }

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
