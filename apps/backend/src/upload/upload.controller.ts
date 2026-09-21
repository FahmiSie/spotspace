import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      // Generate a random 16-character hex string and append the original extension
      const randomName = randomBytes(16).toString('hex');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Format file tidak didukung. Harap unggah gambar (jpg, jpeg, png, webp)'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
};

@Controller('api/upload')
export class UploadController {
  
  // Endpoint untuk single upload (contoh: Avatar)
  @Post()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan dalam request');
    }
    // Return the URL path
    return {
      url: `/uploads/${file.filename}`,
    };
  }

  // Endpoint untuk multiple upload (contoh: Galeri / Tambah Space)
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions)) // Maksimal 10 file sekaligus
  uploadMultiple(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Tidak ada file yang diunggah');
    }
    // Return an array of URL paths
    const urls = files.map((file) => `/uploads/${file.filename}`);
    return {
      urls,
    };
  }
}
