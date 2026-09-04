/**
 * api/webhook.js
 * WhatsApp Webhook Handler for Vercel
 */

module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

    // Preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verification Token
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '123456';

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // GET - Webhook Verification by Facebook
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('GET Verification:', { mode, challenge });

        // Verify the token matches
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified');
            return res.status(200).send(challenge);
        }

        console.log('❌ Verification failed:', { 
            received_token: token, 
            expected_token: VERIFY_TOKEN 
        });
        return res.status(403).json({ error: 'Invalid token' });
    }

    // POST - Incoming Messages/Status Updates
    if (req.method === 'POST') {
        const body = req.body;

        console.log('POST Webhook:', JSON.stringify(body).substring(0, 200));

        // Meta format validation
        if (body.object === 'whatsapp_business_account') {
            try {
                const entry = body.entry?.[0];
                const changes = entry?.changes?.[0];
                const value = changes?.value;

                // Handle messages
                if (value?.messages) {
                    value.messages.forEach(msg => {
                        console.log('📬 Message:', {
                            from: msg.from,
                            text: msg.text?.body,
                            id: msg.id
                        });
                    });
                }

                // Handle status updates
                if (value?.statuses) {
                    value.statuses.forEach(status => {
                        console.log('📤 Status:', {
                            id: status.id,
                            status: status.status
                        });
                    });
                }

                return res.status(200).json({ received: true });
            } catch (error) {
                console.error('Error processing webhook:', error);
                return res.status(200).json({ received: true });
            }
        }

        console.log('⚠️ Unknown format');
        return res.status(200).json({ received: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
