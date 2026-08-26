const Events = require("../../api/v1/events/model");
const { checkingImage } = require("./images");
const { checkingCategories } = require("./categories");
const { checkingTalents } = require("./talents");
const { BadRequestError, NotFoundError } = require("../../errors");
const mongoose = require("mongoose");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllEvents = async (req) => {
  const { keyword, category, talent } = req.query;
  let condition = {};

  if (keyword !== undefined && typeof keyword !== "string") {
    throw new BadRequestError("Keyword harus berupa string");
  }

  const normalizedKeyword = keyword?.trim();

  if (normalizedKeyword && normalizedKeyword.length > 100) {
    throw new BadRequestError("Keyword maksimal 100 karakter");
  }

  if (normalizedKeyword) {
    condition.title = {
      $regex: escapeRegex(normalizedKeyword),
      $options: "i",
    };
  }

  if (category !== undefined) {
    if (
      typeof category !== "string" ||
      !mongoose.isObjectIdOrHexString(category)
    ) {
      throw new BadRequestError("Id kategori tidak valid");
    }
    condition.category = category;
  }

  if (talent !== undefined) {
    if (typeof talent !== "string" || !mongoose.isObjectIdOrHexString(talent)) {
      throw new BadRequestError("Id pembicara tidak valid");
    }
    condition.talent = talent;
  }

  const result = await Events.find(condition)
    .populate({ path: "image", select: "_id name" })
    .populate({ path: "category", select: "_id name" })
    .populate({
      path: "talent",
      select: "_id name role image",
      populate: { path: "image", select: "_id name" },
    });

  return result;
};

const createEvents = async (req) => {
  const {
    title,
    date,
    about,
    tagline,
    venueName,
    keyPoint,
    statusEvent,
    tickets,
    image,
    category,
    talent,
  } = req.body;

  await checkingImage(image);
  await checkingCategories(category);
  await checkingTalents(talent);

  const check = await Events.findOne({ title });

  if (check) throw new BadRequestError("Judul acara sudah terdaftar");

  const result = await Events.create({
    title,
    date,
    about,
    tagline,
    venueName,
    keyPoint,
    statusEvent,
    tickets,
    image,
    category,
    talent,
  });

  return result;
};

const getOneEvents = async (req) => {
  const { id } = req.params;

  const result = await Events.findOne({ _id: id })
    .populate({ path: "image", select: "_id name" })
    .populate({ path: "category", select: "_id name" })
    .populate({
      path: "talent",
      select: "_id name role image",
      populate: { path: "image", select: "_id name" },
    });

  if (!result) throw new NotFoundError(`Tidak ada acara dengan id: ${id}`);

  return result;
};

const updateEvents = async (req) => {
  const { id } = req.params;
  const {
    title,
    date,
    about,
    tagline,
    venueName,
    keyPoint,
    statusEvent,
    tickets,
    image,
    category,
    talent,
  } = req.body;

  const checkEvents = await Events.findOne({ _id: id });

  if (!checkEvents) throw new NotFoundError(`Tidak ada acara dengan id: ${id}`);

  await checkingImage(image);
  await checkingCategories(category);
  await checkingTalents(talent);

  const check = await Events.findOne({
    title,
    _id: { $ne: id },
  });

  if (check) throw new BadRequestError("Judul acara sudah terdaftar");

  const result = await Events.findOneAndUpdate(
    { _id: id },
    {
      title,
      date,
      about,
      tagline,
      venueName,
      keyPoint,
      statusEvent,
      tickets,
      image,
      category,
      talent,
    },
    { new: true, runValidators: true },
  );

  if (!result) {
    throw new NotFoundError(`Tidak ada acara dengan id: ${id}`);
  }

  return result;
};

const deleteEvents = async (req) => {
  const { id } = req.params;

  const result = await Events.findOne({
    _id: id,
  });

  if (!result) throw new NotFoundError(`Tidak ada acara dengan id: ${id}`);

  await result.deleteOne();

  return result;
};

module.exports = {
  getAllEvents,
  createEvents,
  getOneEvents,
  updateEvents,
  deleteEvents,
};
