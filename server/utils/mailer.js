const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({ host: process.env.EMAIL_HOST, port: Number(process.env.EMAIL_PORT), secure: false, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
const templates = {
  welcome_artisan: (name) => ({ subject: 'Welcome to Boafo GH!', html: `<h2>Welcome, ${name}!</h2><p>Your artisan profile on <b>Boafo GH</b> has been created. Once verified, customers will find you.</p><p><b>The Boafo GH Team</b></p>` }),
  welcome_customer: (name) => ({ subject: 'Welcome to Boafo GH!', html: `<h2>Hello ${name},</h2><p>Your Boafo GH account is ready. Find skilled tradespeople near you.</p><p><b>The Boafo GH Team</b></p>` }),
  new_job_alert: (artisanName, job) => ({ subject: `New Job Alert: ${job.title}`, html: `<h2>Hello ${artisanName},</h2><p>A new job matching your trade: <b>${job.title}</b> in ${job.location}. Log in to apply!</p>` }),
  application_received: (customerName, artisanName, job) => ({ subject: `New Application for: ${job.title}`, html: `<h2>Hello ${customerName},</h2><p><b>${artisanName}</b> applied for "<b>${job.title}</b>". Log in to review.</p>` }),
  application_accepted: (artisanName, job) => ({ subject: 'Your application was accepted!', html: `<h2>Hello ${artisanName},</h2><p>Your application for "<b>${job.title}</b>" was <b>accepted</b>. Log in to connect with the customer.</p>` }),
  review_prompt: (customerName, artisanName) => ({ subject: `How was your experience with ${artisanName}?`, html: `<h2>Hello ${customerName},</h2><p>Please leave a review for <b>${artisanName}</b> — it helps the community.</p>` }),
};
async function sendEmail(to, templateKey, ...args) {
  const { subject, html } = templates[templateKey](...args);
  try { await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html }); return true; }
  catch (err) { console.error(`[Mailer] Failed ${templateKey}:`, err.message); return false; }
}
module.exports = { sendEmail };
