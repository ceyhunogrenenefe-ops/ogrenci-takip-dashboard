// api/webhook.js - WhatsApp Webhook Handler
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "123456";

    // GET - Webhook Verification (Facebook tarafından)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('🔍 Webhook Verification:', { mode, token, challenge });

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully');
            res.status(200).send(challenge);
            return;
        } else {
            console.log('❌ Token mismatch or invalid mode');
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
    }

    // POST - Gelen Mesajları Al
    if (req.method === 'POST') {
        const body = req.body;

        console.log('📨 Webhook received:', JSON.stringify(body, null, 2));

        // Meta format control
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // Gelen mesajlar
            if (value?.messages) {
                value.messages.forEach(msg => {
                    const from = msg.from;
                    const text = msg.text?.body || '[Media]';
                    const timestamp = msg.timestamp;
                    const messageId = msg.id;

                    console.log('💬 Incoming Message:', { from, text, timestamp });

                    // Backend'e kaydet (REST API veya database)
                    // Örnek: saveMessage(from, text, timestamp);
                });
            }

            // Mesaj status güncellemeleri
            if (value?.statuses) {
                value.statuses.forEach(status => {
                    console.log('📤 Message Status:', {
                        id: status.id,
                        status: status.status,
                        timestamp: status.timestamp
                    });
                });
            }

            // Kontaktlar
            if (value?.contacts) {
                value.contacts.forEach(contact => {
                    console.log('👤 Contact:', contact);
                });
            }

            // Pozitif response gönder (Facebook webhook doğrulaması için)
            res.status(200).json({ received: true });
            return;
        }

        // Unknown format
        console.log('⚠️ Unknown webhook format');
        res.status(200).json({ received: true });
        return;
    }

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
