import crypto from 'crypto';

const defaultLength = 16;

function guid(length = defaultLength) {
  return crypto.randomBytes(length).toString("hex");
}

export default guid;
