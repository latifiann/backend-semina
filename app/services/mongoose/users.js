const Users = require("../../api/v1/users/model");
const Organizers = require("../../api/v1/organizers/model");
const { BadRequestError } = require("../../errors");

const createOrganizer = async (req) => {
  const { organizer, role, name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new BadRequestError("Password dan konfirmasi password tidak cocok");
  }

  const result = await Organizers.create({ organizer });

  const users = await Users.create({
    name,
    email,
    password,
    organizer: result._id,
    role,
  });

  delete users._doc.password;

  return users;
};

module.exports = { createOrganizer };
