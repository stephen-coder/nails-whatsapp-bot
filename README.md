# 💅 Nails Shop WhatsApp Bot

A fully working WhatsApp bot for a nails salon — handles service listings, appointment bookings, location info, and human handoff.

---

## What the Bot Does

| Feature | Description |
|---|---|
| 📋 Services menu | Lists all services with prices & duration |
| 📅 Booking flow | Guides customer through service → date → time → name |
| 📍 Location & hours | Sends address, opening hours, and contact info |
| 👩‍💼 Human handoff | Directs customers to call/WhatsApp the owner |
| 🔄 Smart sessions | Remembers where each customer is in the flow |
| 0 / "menu" | Any customer can restart anytime |

---

## Setup Guide (Step by Step)

### Step 1 — Install Node.js
Download from: https://nodejs.org (version 18 or higher)

### Step 2 — Get a Free Twilio Account
1. Sign up at https://www.twilio.com (free trial gives you credit)
2. Go to **Console → Messaging → Try it Out → Send a WhatsApp Message**
3. Follow the sandbox setup — send "join [your-sandbox-word]" from your WhatsApp to +1 415 523 8886
4. Copy your **Account SID** and **Auth Token** from the Console dashboard

### Step 3 — Install & Configure the Bot
```bash
# 1. Go into the bot folder
cd nails-whatsapp-bot

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env

# 4. Edit .env and paste your Twilio credentials
nano .env   # or open in any text editor
```

### Step 4 — Run the Bot Locally + Expose It to the Internet
Twilio needs a public URL to send messages to your bot. Use ngrok (free):

```bash
# In terminal 1 — start the bot
npm start

# In terminal 2 — expose it to the internet
npx ngrok http 3000
```

ngrok will give you a URL like: `https://abc123.ngrok.io`

### Step 5 — Connect to Twilio
1. Copy your ngrok URL
2. In Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings
3. Set **"When a message comes in"** to: `https://abc123.ngrok.io/webhook`
4. Save

### Step 6 — Test It!
Send **"hi"** to the Twilio sandbox WhatsApp number from your phone. The bot will respond.

---

## Customising the Bot

### Change shop name, location, hours
Edit the `SHOP` object at the top of `bot.js`:
```js
const SHOP = {
  name: "Your Salon Name",
  location: "Your Location",
  hours: "Mon–Sat: 9am–6pm",
  phone: "+254 7XX XXX XXX",
  instagram: "@yourhandle",
};
```

### Change services & prices
Edit the `SERVICES` array:
```js
const SERVICES = [
  { id: 1, name: "Manicure", price: "KSh 500", duration: "45 min" },
  // add or remove services here
];
```

### Save bookings to a database
In `bot.js`, find this line:
```js
// TODO: Save booking to your database here
console.log(`📅 NEW BOOKING:`, session.booking);
```
Replace it with your database call (MongoDB, Supabase, Google Sheets API, etc.)

---

## Going Live (Production)

When ready to move beyond the sandbox to your real WhatsApp number:

1. Apply for **Meta WhatsApp Business API** at https://business.facebook.com
2. OR use **Twilio's paid WhatsApp sender** (link your business number)
3. Deploy the bot to a cloud server — cheapest options:
   - **Railway** (https://railway.app) — free tier available
   - **Render** (https://render.com) — free tier available
   - **Fly.io** — free tier available
4. Set your production URL as the webhook in Twilio/Meta

---

## Folder Structure

```
nails-whatsapp-bot/
├── bot.js          ← Main bot logic (edit this)
├── package.json    ← Dependencies
├── .env.example    ← Environment variable template
└── README.md       ← This guide
```

---

## Cost Estimate

| Item | Cost |
|---|---|
| Twilio sandbox testing | **Free** |
| ngrok (local testing) | **Free** |
| Twilio WhatsApp (live) | ~$0.005–$0.008 per message |
| Hosting (Railway/Render) | **Free tier** available |

For a small salon sending ~500 messages/month, total cost is under **KSh 500/month**.
