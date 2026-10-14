export function badRequest(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}
