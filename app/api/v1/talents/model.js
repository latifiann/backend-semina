const mongoose = require("mongoose");
const { model, Schema } = mongoose;

let talentSchema = new Schema(
  {
    name: {
      type: String,
      unique: true,
      required: [true, "Nama harus diisi"],
    },
    role: {
      type: String,
      default: "-",
    },
    image: {
      type: mongoose.Types.ObjectId,
      ref: "Image",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = model("Talent", talentSchema);
