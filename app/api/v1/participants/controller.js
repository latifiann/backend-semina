const { StatusCodes } = require("http-status-codes");
const {
  signupParticipant,
  activateParticipant,
  signinParticipant,
  getAllEvents,
  getAllOrders,
  getOneEvent,
} = require("../../../services/mongoose/participant");

const signup = async (req, res, next) => {
  try {
    const result = await signupParticipant(req);

    res.status(StatusCodes.CREATED).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const activeParticipant = async (req, res, next) => {
  try {
    const result = await activateParticipant(req);

    res.status(StatusCodes.OK).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const signin = async (req, res, next) => {
  try {
    const result = await signinParticipant(req);

    res.status(StatusCodes.OK).json({
      data: { token: result },
    });
  } catch (error) {
    next(error);
  }
};

const getAllLandingPage = async (req, res, next) => {
  try {
    const result = await getAllEvents(req);

    res.status(StatusCodes.OK).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const result = await getAllOrders(req);

    res.status(StatusCodes.OK).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getDetailLandingPage = async (req, res, next) => {
  try {
    const result = await getOneEvent(req);

    res.status(StatusCodes.OK).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  activeParticipant,
  signin,
  getAllLandingPage,
  getDashboard,
  getDetailLandingPage,
};
