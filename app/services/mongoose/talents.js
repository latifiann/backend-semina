const Talents = require("../../api/v1/talents/model");
const { checkingImage } = require("./images");
const { NotFoundError, BadRequestError } = require("../../errors");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getAllTalents = async (req) => {
  const { keyword } = req.query;

  let condition = { organizer: req.user.organizer };

  if (keyword !== undefined && typeof keyword !== "string") {
    throw new BadRequestError("Keyword harus berupa string");
  }

  const normalizedKeyword = keyword?.trim();

  if (normalizedKeyword && normalizedKeyword.length > 100) {
    throw new BadRequestError("Keyword maksimal 100 karakter");
  }

  if (normalizedKeyword) {
    condition = {
      ...condition,
      name: { $regex: escapeRegex(normalizedKeyword), $options: "i" },
    };
  }

  const result = await Talents.find(condition)
    .populate({
      path: "image",
      select: "_id name",
    })
    .select("_id name role image");

  return result;
};

const createTalents = async (req) => {
  const { name, role, image } = req.body;

  await checkingImage(image);

  const check = await Talents.findOne({ name, organizer: req.user.organizer });

  if (check) throw new BadRequestError("Pembicara sudah terdaftar");

  const result = await Talents.create({
    name,
    image,
    role,
    organizer: req.user.organizer,
  });

  return result;
};

const getOneTalents = async (req) => {
  const { id } = req.params;

  const result = await Talents.findOne({
    _id: id,
    organizer: req.user.organizer,
  })
    .populate({
      path: "image",
      select: "_id name",
    })
    .select("_id name role image");

  if (!result) throw new NotFoundError(`Tidak ada pembicara dengan id: ${id}`);

  return result;
};

const updateTalents = async (req) => {
  const { id } = req.params;
  const { name, image, role } = req.body;

  await checkingTalents(id);
  await checkingImage(image);

  const check = await Talents.findOne({
    name,
    organizer: req.user.organizer,
    _id: { $ne: id },
  });

  if (check) throw new BadRequestError("Pembicara sudah terdaftar");

  const result = await Talents.findOneAndUpdate(
    { _id: id },
    { name, image, role, organizer: req.user.organizer },
    { new: true, runValidators: true },
  );

  if (!result) throw new NotFoundError(`Tidak ada pembicara dengan id: ${id}`);

  return result;
};

const deleteTalents = async (req) => {
  const { id } = req.params;

  const result = await Talents.findOne({
    _id: id,
    organizer: req.user.organizer,
  });

  if (!result) throw new NotFoundError(`Tidak ada pembicara dengan id: ${id}`);

  await result.deleteOne();

  return result;
};

const checkingTalents = async (id, organizer) => {
  const result = await Talents.findOne({ _id: id, organizer });

  if (!result) throw new NotFoundError(`Tidak ada pembicara dengan id: ${id}`);

  return result;
};

module.exports = {
  getAllTalents,
  createTalents,
  getOneTalents,
  updateTalents,
  deleteTalents,
  checkingTalents,
};
