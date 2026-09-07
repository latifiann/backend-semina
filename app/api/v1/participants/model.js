const mongoose = require("mongoose");
const { model, Schema } = mongoose;
const bcrypt = require("bcryptjs");

const participantSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Nama depan harus diisi"],
      minLength: 3,
      maxLength: 50,
    },
    lastName: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email harus diisi"],
    },
    password: {
      type: String,
      required: [true, "Password harus diisi"],
      minLength: 6,
    },
    role: {
      type: String,
      default: "-",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
  },
  { timestamps: true },
);

participantSchema.pre("save", async function () {
  const User = this;
  if (User.isModified("password")) {
    User.password = await bcrypt.hash(User.password, 12);
  }
});

participantSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = model("Participant", participantSchema);
