const multer = require("multer");
const { BadRequestError } = require("../errors");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Math.floor(Math.random() * 99999999) + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new BadRequestError("Unsupported file format"));
  }
};

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 3000000,
  },
  fileFilter: fileFilter,
});

module.exports = uploadMiddleware;
