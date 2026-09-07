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

const renderTemplate = (templateName, data) => {
  const templatePath = path.join(
    __dirname,
    `../../views/email/${templateName}.html`,
  );
  const template = fs.readFileSync(templatePath, "utf8");

  return Mustache.render(template, data);
};

const otpMail = async (email, data) => {
  try {
    const message = {
      from: `Semina <${gmail}>`,
      to: email,
      subject: "OTP for registration",
      html: renderTemplate("otp", data),
    };

    return await transporter.sendMail(message);
  } catch (error) {
    console.error("Failed to send participant OTP email:", error);
    throw new ServiceUnavailableError(
      "Layanan email sedang tidak tersedia. Silakan coba lagi.",
    );
  }
};

const checkoutMail = async (email, data) => {
  const message = {
    from: `Semina <${gmail}>`,
    to: email,
    subject: `Your Semina Checkout Confirmation - Order ${data.orderId}`,
    text: [
      `Hi ${data.customerName},`,
      "",
      `Your checkout for ${data.eventTitle} was successful and is pending payment.`,
      `Order ID: ${data.orderId}`,
      `Order date: ${data.orderDate}`,
      `Event date: ${data.eventDate}`,
      `Venue: ${data.venueName}`,
      `Payment method: ${data.paymentType}`,
      `Total tickets: ${data.totalOrderTicket}`,
      `Total payment: ${data.totalPay}`,
      "",
      "Thank you for using Semina.",
    ].join("\n"),
    html: renderTemplate("order-confirmation", data),
  };

  return transporter.sendMail(message);
};

module.exports = { otpMail, checkoutMail };
