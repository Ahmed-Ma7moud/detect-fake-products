const nodemailer = require('nodemailer');

async function sendingEmail(options) {
  try {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or another service like 'outlook', 'yahoo'
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app password
      },
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
    });

    // 2. Define the email options
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender address
      to: options.email, // Recipient address
      subject: options.subject, // Subject line
      text: options.message, // plain text body
    };

    // 3. Send the email
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Rethrow the error for handling in the calling function.
  }
}

module.exports = sendingEmail