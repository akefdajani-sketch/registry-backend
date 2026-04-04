function badRequest(message, details) {
  const error = new Error(message);
  error.status = 400;
  error.details = details;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

module.exports = { badRequest, notFound };
