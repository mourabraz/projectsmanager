import { extname, resolve } from 'path';
import * as crypto from 'crypto';
import * as multer from 'multer';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MulterConfigService {
  get uploadPhotoDest(): string {
    return resolve(__dirname, '..', '..', '..', 'tmp', 'upload', 'photos');
  }

  get uploadFileDest(): string {
    return resolve(__dirname, '..', '..', '..', 'tmp', 'upload', 'files');
  }

  get multerPhotoConfig(): any {
    return {
      storage: multer.diskStorage({
        destination: this.uploadPhotoDest,
        filename: (req, file, cb) => {
          crypto.randomBytes(16, (err, res) => {
            if (err) return cb(err, null);
            return cb(null, res.toString('hex') + extname(file.originalname));
          });
        },
      }),
      fileFilter: (req: any, file: any, cb: any) => {
        if (
          !['image/jpeg', 'image/jpg', 'image/gif', 'image/png'].includes(
            file.mimetype,
          )
        ) {
          cb(new BadRequestException('File format not allowed'), null);
        } else if (req.headers['content-length'] > 2.001 * 1024 * 1024) {
          cb(new BadRequestException('File is too big'), null);
        } else {
          cb(null, true);
        }
      },
    };
  }

  get multerFileConfig(): any {
    return {
      storage: multer.diskStorage({
        destination: this.uploadFileDest,
        filename: (req, file, cb) => {
          crypto.randomBytes(16, (err, res) => {
            if (err) return cb(err, null);
            return cb(null, res.toString('hex') + extname(file.originalname));
          });
        },
      }),
      fileFilter: (req: any, file: any, cb: any) => {
        if (
          false &&
          ![
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'image/png',
            'application/pdf',
            'text/plain',
            'application/vnd.oasis.opendocument.text',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          ].includes(file.mimetype)
        ) {
          cb(new BadRequestException('File format not allowed'), null);
        } else if (req.headers['content-length'] > 100.001 * 1024 * 1024) {
          cb(new BadRequestException('File is too big'), null);
        } else {
          cb(null, true);
        }
      },
    };
  }
}
