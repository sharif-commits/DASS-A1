const { customAlphabet } = require("nanoid");
const QRCode = require("qrcode");

const makeId = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);

function generateTicketId() {
  return `TKT-${makeId()}`;
}

async function generateQrData(ticketId, eventId, participantId) {
  const payload = JSON.stringify({ ticketId, eventId, participantId });
  const qrImageDataUrl = await QRCode.toDataURL(payload);
  return { payload, qrImageDataUrl };
}

module.exports = { generateTicketId, generateQrData };
