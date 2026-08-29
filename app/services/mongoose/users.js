const mongoose = require("mongoose");
const Users = require("../../api/v1/users/model");
const Organizers = require("../../api/v1/organizers/model");
const { BadRequestError } = require("../../errors");

const createOrganizer = async (req) => {
  const { organizer, name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    throw new BadRequestError("Password dan konfirmasi password tidak cocok");
  }

  let user;

  await mongoose.connection.transaction(async (session) => {
    const [organizerDocument] = await Organizers.create([{ organizer }], {
      session,
    });

    [user] = await Users.create(
      [
        {
          name,
          email,
          password,
          organizer: organizerDocument._id,
          role: "organizer",
        },
      ],
      { session },
    );
  });

  const result = user.toObject();
  delete result.password;

  return result;
};

const createUser = async (req) => {
  const { name, password, role, confirmPassword, email } = req.body;

  if (password !== confirmPassword) {
    throw new BadRequestError("Password dan konfirmasi password tidak sesuai");
  }

  const user = await Users.create({
    name,
    email,
    organizer: req.user.organizer,
    password,
    role,
  });

  const result = user.toObject();
  delete result.password;

  return result;
};

module.exports = { createOrganizer, createUser };
