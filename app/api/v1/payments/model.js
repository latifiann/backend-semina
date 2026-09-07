const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const paymentSchema = new Schema(
  {
    type: {
      type: String,
      required: [true, "Tipe pembayaran harus diisi"],
      trim: true,
      minLength: 3,
      maxLength: 50,
    },
    image: {
      type: mongoose.Types.ObjectId,
      ref: "Image",
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    organizer: {
      type: mongoose.Types.ObjectId,
      ref: "Organizer",
      required: true,
    },
  },
  { timestamps: true },
);

paymentSchema.index(
  { organizer: 1, type: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } },
);

module.exports = model("Payment", paymentSchema);
