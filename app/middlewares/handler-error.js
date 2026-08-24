const { StatusCodes } = require("http-status-codes");
const multer = require("multer");
const { CustomAPIError } = require("../errors");

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    msg: "Something went wrong, please try again later",
  };
  let isKnownError = false;

  if (err instanceof CustomAPIError) {
    customError.statusCode = err.statusCode;
    customError.msg = err.message;
    isKnownError = true;
  }

  if (err instanceof multer.MulterError) {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg =
      err.code === "LIMIT_FILE_SIZE"
        ? "File size exceeds the 3 MB limit"
        : "Invalid file upload";
    isKnownError = true;
  }

  if (err.name === "ValidationError") {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
    customError.statusCode = StatusCodes.BAD_REQUEST;
    isKnownError = true;
  }

  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
    isKnownError = true;
  }

  if (err.name === "CastError") {
    customError.msg = `No item found with id: ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
    isKnownError = true;
  }

  if (!isKnownError) {
    console.error(err);
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

module.exports = errorHandlerMiddleware;
