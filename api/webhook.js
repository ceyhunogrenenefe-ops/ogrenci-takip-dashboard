// api/webhook.js - DEBUG VERSION (No token check)
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Log everything
    console.log('=== WEBHOOK DEBUG ===');
    console.log('Method:', req.method);
    console.log('Query:', JSON.stringify(req.query));
    console.log('Body:', JSON.stringify(req.body));
    console.log('==================');

    // GET - Verification (Accept ANY token for testing)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        console.log('✅ GET VERIFICATION RECEIVED');
        console.log('Mode:', mode);
        console.log('Token received:', token?.substring(0, 20) + '...');
        console.log('Challenge:', challenge);

        // For debugging: accept any token
        if (mode === 'subscribe' && challenge) {
            console.log('✅ SENDING CHALLENGE BACK');
            res.status(200).send(challenge);
            return;
        }

        res.status(403).json({ error: 'Invalid request' });
        return;
    }

    // POST - Handle messages
    if (req.method === 'POST') {
        const body = req.body;
        console.log('📨 POST RECEIVED');
        console.log('Object type:', body?.object);

        // Accept any POST
        res.status(200).json({ received: true });
        return;
    }

    // OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    res.status(405).json({ error: 'Method not allowed' });
}
