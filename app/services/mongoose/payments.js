const Payments = require("../../api/v1/payments/model");
const { checkingImage } = require("./images");
const { BadRequestError, NotFoundError } = require("../../errors");

const normalizePaymentType = (type) => {
  if (typeof type !== "string" || !type.trim()) {
    throw new BadRequestError("Tipe pembayaran harus diisi");
  }

  return type.trim();
};

const getAllPayments = async (req) => {
  let condition = { organizer: req.user.organizer };

  const result = await Payments.find(condition)
    .populate({
      path: "image",
      select: "_id name",
    })
    .select("_id type status image");

  return result;
};

const createPayments = async (req) => {
  const { type, image } = req.body;
  const normalizedType = normalizePaymentType(type);

  await checkingImage(image);

  const check = await Payments.findOne({
    type: normalizedType,
    organizer: req.user.organizer,
  }).collation({ locale: "en", strength: 2 });

  if (check) throw new BadRequestError("Tipe pembayaran duplikat");

  const result = await Payments.create({
    image,
    type: normalizedType,
    organizer: req.user.organizer,
  });

  return result;
};

const getOnePayments = async (req) => {
  const { id } = req.params;

  const result = await Payments.findOne({
    _id: id,
    organizer: req.user.organizer,
  })
    .populate({
      path: "image",
      select: "_id name",
    })
    .select("_id type status image");

  if (!result)
    throw new NotFoundError(`Tidak ada tipe pembayaran dengan id:  ${id}`);

  return result;
};

const updatePayments = async (req) => {
  const { id } = req.params;
  const { type, image } = req.body;
  const normalizedType = normalizePaymentType(type);

  await checkingImage(image);

  const check = await Payments.findOne({
    type: normalizedType,
    organizer: req.user.organizer,
    _id: { $ne: id },
  }).collation({ locale: "en", strength: 2 });

  if (check) throw new BadRequestError("Tipe pembayaran duplikat");

  const result = await Payments.findOneAndUpdate(
    { _id: id, organizer: req.user.organizer },
    { type: normalizedType, image },
    { returnDocument: "after", runValidators: true },
  );

  if (!result)
    throw new NotFoundError(`Tidak ada tipe pembayaran dengan id:  ${id}`);

  return result;
};

const deletePayments = async (req) => {
  const { id } = req.params;

  const result = await Payments.findOne({
    _id: id,
    organizer: req.user.organizer,
  });

  if (!result)
    throw new NotFoundError(`Tidak ada tipe pembayaran dengan id:  ${id}`);

  await result.deleteOne();

  return result;
};

const checkingPayments = async (id) => {
  const result = await Payments.findOne({ _id: id });

  if (!result)
    throw new NotFoundError(`Tidak ada tipe pembayaran dengan id:  ${id}`);

  return result;
};

module.exports = {
  getAllPayments,
  createPayments,
  getOnePayments,
  updatePayments,
  deletePayments,
  checkingPayments,
};
