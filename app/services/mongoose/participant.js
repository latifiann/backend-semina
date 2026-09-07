const Participant = require("../../api/v1/participants/model");
const Events = require("../../api/v1/events/model");
const Orders = require("../../api/v1/orders/model");
const {
  BadRequestError,
  NotFoundError,
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

module.exports = {
  signupParticipant,
  activateParticipant,
  signinParticipant,
  getAllEvents,
  getOneEvent,
  getAllOrders,
};
