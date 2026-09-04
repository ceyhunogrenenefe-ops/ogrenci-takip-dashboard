# Öğrenci Takip Dashboard + WhatsApp

Vercel'de çalışan öğrenci takip ve WhatsApp entegrasyonu dashboard'ı.

## Kurulum

### 1. GitHub'a Push Et
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

### 2. Vercel'e Deploy Et
```bash
npm install -g vercel
vercel
```

### 3. Environment Variable Ekle
Vercel Dashboard'da:
- Settings → Environment Variables
- `WHATSAPP_TOKEN` = Senin Token'ın

## API Endpoints

### POST /api/send-message
WhatsApp mesaj gönder.

**Request:**
```json
{
  "to": "905503034014",
  "message": "Merhaba!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mesaj gönderildi",
  "data": {...}
}
```

## Özellikler

✅ 624 Öğrenci Yönetimi
✅ WhatsApp Entegrasyonu
✅ Durumları Takip
✅ Excel Export
✅ localStorage Desteği
