import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { Errors } from 'groundup';

class FileManager {
  constructor(fileStorageFolder) {
    if (fileStorageFolder === undefined) {
      throw Errors.MissingInput('fileStorageFolder');
    }
    this.folder = `${fileStorageFolder}`;
    this.verifyPathExists(fileStorageFolder);
  }

  verifyPathExists(path) {
    let accFolder = '';

    path.split('/').forEach(folder => {
      accFolder += `${folder}/`;
      if (!existsSync(accFolder)) {
        mkdirSync(accFolder);
      }
    });
  }

  exists (fileName) {
    return existsSync(this.folder + '/' + fileName);
  }
  
  set (fileName, data) {
    const target = `${this.folder}/${fileName}`;

    if (data) {
      const isBase64 = (data.indexOf('data:image/png;base64') === 0 ),
        base64Data = data.replace(/^data:image\/png;base64,/, '');
  
      return writeFileSync (target, base64Data, isBase64 ? 'base64' : 'utf8');
    } else if (existsSync(target)) {
      return unlinkSync (target);
    }
  }
  
  get (fileName) {
    readFileSync(`${this.folder}/${fileName}`);
  }
}

export default FileManager;
