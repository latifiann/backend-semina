const createTokenUser = (user) => {
  return {
    subjectType: "user",
    name: user.name,
    userId: user._id,
    role: user.role,
    email: user.email,
    organizer: user.organizer,
  };
};

const createTokenParticipant = (participant) => {
  return {
    subjectType: "participant",
    firstName: participant.firstName,
    lastName: participant.lastName,
    participantId: participant._id,
    email: participant.email,
  };
};

module.exports = { createTokenUser, createTokenParticipant };
