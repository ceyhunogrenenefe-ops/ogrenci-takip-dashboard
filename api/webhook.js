// api/webhook.js - WhatsApp Webhook Handler (FIXED)
export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "123456";

    console.log(`[${new Date().toISOString()}] Webhook request:`, {
        method: req.method,
        query: req.query,
        body: req.body ? Object.keys(req.body) : null
    });

    // ===== GET - WEBHOOK VERIFICATION (Facebook sends this) =====
    if (req.method === 'GET') {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            console.log('🔍 Verification Request:', { mode, token: token?.substring(0, 10) + '...', challenge });

            // Verify token matches
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('✅ Webhook verified successfully');
                res.status(200).send(challenge);
                return;
            } else {
                console.log('❌ Verification failed:', { mode, tokenMatch: token === VERIFY_TOKEN });
                res.status(403).json({ 
                    error: 'Invalid verification token',
                    received: token?.substring(0, 20),
                    expected: VERIFY_TOKEN.substring(0, 20)
                });
                return;
            }
        } catch (error) {
            console.error('❌ GET Error:', error);
            res.status(500).json({ error: error.message });
            return;
        }
    }

    // ===== POST - INCOMING MESSAGES =====
    if (req.method === 'POST') {
        try {
            const body = req.body;

            console.log('📨 Webhook POST received:', JSON.stringify(body, null, 2));

            // Check format
            if (body.object === 'whatsapp_business_account') {
                const entry = body.entry?.[0];
                const changes = entry?.changes?.[0];
                const value = changes?.value;

                // Process incoming messages
                if (value?.messages) {
                    console.log(`📬 Processing ${value.messages.length} message(s)`);
                    
                    value.messages.forEach(msg => {
                        const from = msg.from;
                        const text = msg.text?.body || '[Media/Unsupported]';
                        const timestamp = msg.timestamp;
                        const messageId = msg.id;

                        console.log('💬 Incoming Message:', {
                            from,
                            text: text.substring(0, 50),
                            timestamp,
                            messageId
                        });

                        // Store in-memory or database
                        // For now: localStorage JavaScript'te (dashboard'da handle et)
                    });
                }

                // Process message status updates
                if (value?.statuses) {
                    console.log(`📤 Processing ${value.statuses.length} status update(s)`);
                    
                    value.statuses.forEach(status => {
                        console.log('📊 Message Status:', {
                            id: status.id,
                            status: status.status,
                            timestamp: status.timestamp
                        });
                    });
                }

                // Response immediately (required by Facebook)
                res.status(200).json({ received: true });
                return;
            }

            console.log('⚠️ Unknown format:', body.object);
            res.status(200).json({ received: true });
            return;

        } catch (error) {
            console.error('❌ POST Error:', error);
            res.status(200).json({ received: true }); // Still return 200 to Facebook
            return;
        }
    }

    // ===== OPTIONS =====
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // ===== OTHER METHODS =====
    res.status(405).json({ error: 'Method not allowed' });
}
