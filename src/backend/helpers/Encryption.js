import jwtSimple from 'jwt-simple';
import { Errors } from 'groundup';

const key = `encription-${process.env.npm_package_version}`,
  encryption = {
    encode(string) {
      if (typeof string !== 'string') {
        throw new Errors.BadInput('string', string);
      }

      return jwtSimple.encode(string, key);
    },

    decode(encryptedString) {
      return jwtSimple.decode(encryptedString, key);
    },
  };

export default encryption;
