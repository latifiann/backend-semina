const nodemailer = require("nodemailer");
const { gmail, password } = require("../../config");
const Mustache = require("mustache");
const fs = require("fs");
const path = require("path");
const { ServiceUnavailableError } = require("../../errors");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
  auth: {
    user: gmail,
    pass: password,
  },
});

const otpMail = async (email, data) => {
  try {
    const templatePath = path.join(__dirname, "../../views/email/otp.html");
    const template = fs.readFileSync(templatePath, "utf8");

    const message = {
      from: gmail,
      to: email,
      subject: "OTP for registration",
      html: Mustache.render(template, data),
    };

    return await transporter.sendMail(message);
  } catch (error) {
    console.error("Failed to send participant OTP email:", error);
    throw new ServiceUnavailableError(
      "Layanan email sedang tidak tersedia. Silakan coba lagi.",
    );
  }
};

module.exports = { otpMail };
