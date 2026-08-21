const mongoose = require("mongoose");
const { model, Schema } = mongoose;

let categorySchema = new Schema(
  {
    name: {
      type: String,
      minLength: [3, "Panjang nama kategori minimal 3 karakter"],
      maxLenth: [20, "Panjang nama kategori maximal 20 karakter"],
      required: [true, "Nama kategori harus diisi"],
    },
  },
  { timestamps: true },
);

module.exports = model("Category", categorySchema);
