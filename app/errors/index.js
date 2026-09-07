const CustomAPIError = require("./custom-api-error");
const BadRequestError = require("./bad-request");
const NotFoundError = require("./not-found");
const UnauthorizedError = require("./unauthorized");
const UnauthenticatedError = require("./unauthenticated");
const ServiceUnavailableError = require("./service-unavailable");
const ConflictError = require("./conflict");

module.exports = {
  CustomAPIError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UnauthenticatedError,
  ServiceUnavailableError,
  ConflictError,
};
