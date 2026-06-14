require('dotenv').config();
/**
 * 💅 Nails Shop WhatsApp Bot
 * Platform: Twilio WhatsApp Sandbox (free) or Meta WhatsApp Business API
 * Stack: Node.js + Express + Twilio
 */

const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Twilio sandbox default

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ─── SHOP DATA ────────────────────────────────────────────────────────────────
const SHOP = {
  name: "Glam Nails Studio",
  location: "Westlands, Nairobi",
  hours: "Mon–Sat: 8am–7pm | Sun: 10am–5pm",
  phone: "+254 700 000 000",
  instagram: "@glamnailske",
};

const SERVICES = [
  { id: 1, name: "Manicure (Classic)",        price: "KSh 500",  duration: "45 min" },
  { id: 2, name: "Pedicure (Classic)",         price: "KSh 700",  duration: "60 min" },
  { id: 3, name: "Gel Nails",                  price: "KSh 1,500", duration: "90 min" },
  { id: 4, name: "Acrylic Full Set",           price: "KSh 2,000", duration: "2 hrs"  },
  { id: 5, name: "Nail Art (per nail)",        price: "KSh 100",  duration: "varies" },
  { id: 6, name: "Nail Removal",               price: "KSh 300",  duration: "30 min" },
  { id: 7, name: "Manicure + Pedicure Combo",  price: "KSh 1,100", duration: "1.5 hrs" },
  { id: 8, name: "Bridal Package",             price: "KSh 5,000", duration: "3 hrs"  },
];

// In-memory session store (use Redis or a DB in production)
const sessions = {};

// ─── SESSION HELPERS ──────────────────────────────────────────────────────────
function getSession(phone) {
  if (!sessions[phone]) {
    sessions[phone] = { step: "main_menu", booking: {} };
  }
  return sessions[phone];
}

function resetSession(phone) {
  sessions[phone] = { step: "main_menu", booking: {} };
}

// ─── MESSAGE BUILDERS ─────────────────────────────────────────────────────────
function mainMenu() {
  return (
    `💅 *Welcome to ${SHOP.name}!*\n` +
    `We're your go-to spot for gorgeous nails in ${SHOP.location}.\n\n` +
    `What can we help you with today?\n\n` +
    `1️⃣  View our services & prices\n` +
    `2️⃣  Book an appointment\n` +
    `3️⃣  Check appointment status\n` +
    `4️⃣  Our location & hours\n` +
    `5️⃣  Talk to a human 👩‍💼\n\n` +
    `_Reply with a number (1–5)_`
  );
}

function serviceList() {
  let msg = `💅 *Our Services*\n\n`;
  SERVICES.forEach((s) => {
    msg += `*${s.id}. ${s.name}*\n   💰 ${s.price} | ⏱ ${s.duration}\n\n`;
  });
  msg += `_Reply *BOOK* to book any service, or *0* to go back to the main menu._`;
  return msg;
}

function locationInfo() {
  return (
    `📍 *Find Us*\n\n` +
    `*${SHOP.name}*\n` +
    `${SHOP.location}\n\n` +
    `🕐 *Hours:*\n${SHOP.hours}\n\n` +
    `📞 *Call/WhatsApp:* ${SHOP.phone}\n` +
    `📸 *Instagram:* ${SHOP.instagram}\n\n` +
    `_Reply *0* to return to the main menu._`
  );
}

function bookingStart() {
  let msg = `📅 *Book an Appointment*\n\nWhich service would you like?\n\n`;
  SERVICES.forEach((s) => {
    msg += `*${s.id}*. ${s.name} — ${s.price}\n`;
  });
  msg += `\n_Reply with the service number (e.g. *3* for Gel Nails)_\nor *0* to go back.`;
  return msg;
}

function askDate() {
  return (
    `Great choice! 🎉\n\n` +
    `📅 What *date* would you like?\n` +
    `_(e.g. *Monday 16 June* or *18/06*)_`
  );
}

function askTime() {
  return (
    `Perfect! ⏰ What *time* works for you?\n\n` +
    `Available slots:\n` +
    `• 8:00 AM\n• 9:00 AM\n• 10:00 AM\n• 11:00 AM\n` +
    `• 1:00 PM\n• 2:00 PM\n• 3:00 PM\n• 4:00 PM\n• 5:00 PM\n\n` +
    `_Reply with your preferred time (e.g. *10:00 AM*)_`
  );
}

function askName() {
  return `What's your *name*? 😊`;
}

function bookingConfirmation(booking) {
  const service = SERVICES.find((s) => s.id === booking.serviceId);
  return (
    `✅ *Booking Confirmed!*\n\n` +
    `Here's your summary:\n` +
    `💅 *Service:* ${service.name}\n` +
    `💰 *Price:* ${service.price}\n` +
    `📅 *Date:* ${booking.date}\n` +
    `⏰ *Time:* ${booking.time}\n` +
    `👤 *Name:* ${booking.name}\n\n` +
    `We'll send you a reminder 1 hour before your appointment.\n\n` +
    `📞 Questions? Call us: ${SHOP.phone}\n\n` +
    `_Thank you for choosing ${SHOP.name}! 💕_\n\n` +
    `_Reply *0* to return to the main menu._`
  );
}

// ─── MAIN BOT LOGIC ───────────────────────────────────────────────────────────
function processMessage(phone, incomingMsg) {
  const session = getSession(phone);
  const msg = incomingMsg.trim().toLowerCase();

  // Global: always allow "0" or "menu" to reset
  if (msg === "0" || msg === "menu" || msg === "hi" || msg === "hello" || msg === "start") {
    resetSession(phone);
    return mainMenu();
  }

  switch (session.step) {
    // ── MAIN MENU ──
    case "main_menu": {
      if (msg === "1") {
        session.step = "services";
        return serviceList();
      }
      if (msg === "2" || msg === "book") {
        session.step = "booking_service";
        return bookingStart();
      }
      if (msg === "3") {
        return (
          `🔍 *Check Appointment*\n\n` +
          `Please call or WhatsApp us directly at *${SHOP.phone}* to check your booking.\n\n` +
          `_Reply *0* for the main menu._`
        );
      }
      if (msg === "4") {
        session.step = "location";
        return locationInfo();
      }
      if (msg === "5") {
        return (
          `👩‍💼 *Talk to Us*\n\n` +
          `You'll be connected to our team shortly.\n` +
          `Or reach us directly:\n` +
          `📞 ${SHOP.phone}\n` +
          `📸 ${SHOP.instagram}\n\n` +
          `_Reply *0* to return to the main menu._`
        );
      }
      return (
        `❓ I didn't catch that. Please reply with a number *1–5*.\n\n` + mainMenu()
      );
    }

    // ── SERVICES LIST ──
    case "services": {
      if (msg === "book") {
        session.step = "booking_service";
        return bookingStart();
      }
      return `_Reply *BOOK* to make a booking, or *0* for the main menu._`;
    }

    // ── BOOKING: CHOOSE SERVICE ──
    case "booking_service": {
      const choice = parseInt(msg);
      const service = SERVICES.find((s) => s.id === choice);
      if (service) {
        session.booking.serviceId = service.id;
        session.step = "booking_date";
        return `You chose *${service.name}* (${service.price}) 💅\n\n` + askDate();
      }
      return `❓ Please reply with a number between *1 and ${SERVICES.length}*.`;
    }

    // ── BOOKING: DATE ──
    case "booking_date": {
      session.booking.date = incomingMsg.trim();
      session.step = "booking_time";
      return askTime();
    }

    // ── BOOKING: TIME ──
    case "booking_time": {
      session.booking.time = incomingMsg.trim();
      session.step = "booking_name";
      return askName();
    }

    // ── BOOKING: NAME → CONFIRM ──
    case "booking_name": {
      session.booking.name = incomingMsg.trim();
      const confirmation = bookingConfirmation(session.booking);
      // TODO: Save booking to your database here
      console.log(`📅 NEW BOOKING:`, session.booking);
      session.step = "main_menu";
      session.booking = {};
      return confirmation;
    }

    default:
      resetSession(phone);
      return mainMenu();
  }
}

// ─── WEBHOOK ENDPOINT ─────────────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body || "";
  const from = (req.body.From || "").replace(/\s+/g, "");           // e.g. "whatsapp:+254712345678"
  const to   = req.body.To   || TWILIO_WHATSAPP_NUMBER;

  console.log(`📨 Message from ${from}: ${incomingMsg}`);

  const reply = processMessage(from, incomingMsg);

  // Send reply via Twilio  
try {
    await client.messages.create({
      from: to,
      to: from,
      body: reply,
    });
    console.log(`📤 Replied to ${from}`);
  } catch (err) {
    console.error("❌ Twilio send error:", err.message);
  }

  res.sendStatus(200);

});

// Health check
app.get("/", (req, res) => res.send(`💅 ${SHOP.name} WhatsApp Bot is running!`));

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n💅 ${SHOP.name} WhatsApp Bot`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook\n`);
});
