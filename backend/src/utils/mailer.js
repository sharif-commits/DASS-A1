async function sendMail({ to, subject, text }) {
  console.log("[MAIL]", { to, subject, text });
}

module.exports = { sendMail };
