const mongoose = require("mongoose");
const Participant = require("../../api/v1/participants/model");
const Events = require("../../api/v1/events/model");
const Orders = require("../../api/v1/orders/model");
const Payments = require("../../api/v1/payments/model");
const {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthenticatedError,
  UnauthorizedError,
} = require("../../errors");
const { createJWT, createTokenParticipant } = require("../../utils");
const { otpMail } = require("../mail");

const normalizeEmail = (email) => {
  if (typeof email !== "string") {
    throw new BadRequestError("Format email tidak valid");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new BadRequestError("Format email tidak valid");
  }

  return normalizedEmail;
};

const signupParticipant = async (req) => {
  const { firstName, lastName, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  let result = await Participant.findOne({ email: normalizedEmail });

  if (result?.isActive) {
    throw new BadRequestError("Email sudah terdaftar");
  }

  if (result) {
    result.firstName = firstName;
    result.lastName = lastName;
    result.email = normalizedEmail;
    result.password = password;
    result.otp = otp;
    await result.save();
  } else {
    result = await Participant.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      otp,
    });
  }

  await otpMail(normalizedEmail, result);

  const participant = result.toObject();
  delete participant.password;
  delete participant.otp;

  return participant;
};

const activateParticipant = async (req) => {
  const { otp, email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!otp) {
    throw new BadRequestError("Kode OTP harus diisi");
  }

  const check = await Participant.findOne({ email: normalizedEmail });

  if (!check) {
    throw new NotFoundError("Partisipan belum terdaftar");
  }

  if (check.isActive) {
    throw new BadRequestError("Akun anda sudah aktif");
  }

  if (check.otp !== String(otp)) {
    throw new BadRequestError("Kode OTP salah!");
  }

  const result = await Participant.findOneAndUpdate(
    { _id: check._id, isActive: false, otp: String(otp) },
    {
      $set: { isActive: true },
      $unset: { otp: 1 },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!result) {
    throw new BadRequestError("Aktivasi akun gagal, silakan coba lagi");
  }

  const participant = result.toObject();
  delete participant.password;
  delete participant.otp;

  return participant;
};

const signinParticipant = async (req) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const normalizedEmail = normalizeEmail(email);
  const result = await Participant.findOne({ email: normalizedEmail });

  if (!result) {
    throw new UnauthorizedError("Invalid credentials");
  }

  if (!result.isActive) {
    throw new UnauthorizedError("Akun anda belum aktif");
  }

  const isPasswordCorrect = await result.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const token = createJWT({ payload: createTokenParticipant(result) });

  return token;
};

const getAllEvents = async (req) => {
  const result = await Events.find({ statusEvent: "Published" })
    .populate("category")
    .populate("image")
    .select("_id title date tickets venueName");

  return result;
};

const getOneEvent = async (req) => {
  const { id } = req.params;

  const result = await Events.findOne({ _id: id })
    .populate("category")
    .populate("talent")
    .populate("image");

  if (!result) {
    throw new NotFoundError(`Tidak ada acara dengan id: ${id}`);
  }

  return result;
};

const getAllOrders = async (req) => {
  const result = await Orders.find({ participant: req.participant.id });

  return result;
};

const checkoutOrder = async (req) => {
  const { event, personalDetail, payment, tickets } = req.body;
  const participantId = req.participant?.id;

  if (
    !mongoose.isObjectIdOrHexString(event) ||
    !mongoose.isObjectIdOrHexString(payment) ||
    !mongoose.isObjectIdOrHexString(participantId)
  ) {
    throw new BadRequestError("Data checkout tidak valid");
  }

  if (!personalDetail || !Array.isArray(tickets) || tickets.length === 0) {
    throw new BadRequestError("Detail pembeli dan tiket harus diisi");
  }

  let result;

  try {
    await mongoose.connection.transaction(async (session) => {
      const participant = await Participant.findOne({
        _id: participantId,
        isActive: true,
      }).session(session);

      if (!participant) {
        throw new UnauthenticatedError("Authentication invalid");
      }

      const checkingEvent = await Events.findOne({
        _id: event,
        statusEvent: "Published",
      }).session(session);

      if (!checkingEvent) {
        throw new NotFoundError("Acara tidak ditemukan atau belum dipublikasikan");
      }

      const checkingPayment = await Payments.findOne({
        _id: payment,
        organizer: checkingEvent.organizer,
        status: true,
      }).session(session);

      if (!checkingPayment) {
        throw new NotFoundError("Metode pembayaran tidak tersedia");
      }

      let totalPay = 0;
      let totalOrderTicket = 0;
      const orderItems = [];
      const requestedTicketIds = new Set();
      const now = new Date();

      for (const requestedTicket of tickets) {
        const { ticketId, sumTicket } = requestedTicket;

        if (!mongoose.isObjectIdOrHexString(ticketId)) {
          throw new BadRequestError("Kategori tiket tidak valid");
        }

        if (!Number.isInteger(sumTicket) || sumTicket < 1) {
          throw new BadRequestError(
            "Jumlah tiket harus berupa bilangan bulat minimal 1",
          );
        }

        const normalizedTicketId = String(ticketId);

        if (requestedTicketIds.has(normalizedTicketId)) {
          throw new BadRequestError("Kategori tiket tidak boleh duplikat");
        }
        requestedTicketIds.add(normalizedTicketId);

        const ticket = checkingEvent.tickets.id(ticketId);

        if (!ticket) {
          throw new BadRequestError("Kategori tiket tidak ditemukan");
        }

        if (!ticket.statusTicketCategories) {
          throw new BadRequestError(`Tiket ${ticket.type} sedang tidak aktif`);
        }

        if (ticket.expired && ticket.expired <= now) {
          throw new BadRequestError(`Tiket ${ticket.type} sudah kedaluwarsa`);
        }

        if (sumTicket > ticket.stock) {
          throw new ConflictError(`Stok tiket ${ticket.type} tidak mencukupi`);
        }

        ticket.stock -= sumTicket;
        totalOrderTicket += sumTicket;
        totalPay += ticket.price * sumTicket;
        orderItems.push({
          ticketCategories: {
            ticketId: ticket._id,
            type: ticket.type,
            price: ticket.price,
          },
          sumTicket,
        });
      }

      const historyEvent = {
        title: checkingEvent.title,
        date: checkingEvent.date,
        about: checkingEvent.about,
        tagline: checkingEvent.tagline,
        keyPoint: checkingEvent.keyPoint,
        venueName: checkingEvent.venueName,
        statusEvent: checkingEvent.statusEvent,
        image: checkingEvent.image,
        category: checkingEvent.category,
        talent: checkingEvent.talent,
        organizer: checkingEvent.organizer,
      };

      await checkingEvent.save({ session });

      [result] = await Orders.create(
        [
          {
            date: now,
            personalDetail,
            totalPay,
            totalOrderTicket,
            orderItems,
            participant: participantId,
            event,
            historyEvent,
            payment,
          },
        ],
        { session },
      );
    });
  } catch (error) {
    if (error.name === "VersionError") {
      throw new ConflictError(
        "Stok tiket berubah saat checkout. Silakan coba lagi.",
      );
    }
    throw error;
  }

  return result;
};

module.exports = {
  signupParticipant,
  activateParticipant,
  signinParticipant,
  getAllEvents,
  getOneEvent,
  getAllOrders,
  checkoutOrder,
};
