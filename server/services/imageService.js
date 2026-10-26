const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';

if (isProd || process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const MAGIC_BYTES = {
  'image/jpeg': Buffer.from([0xFF, 0xD8, 0xFF]),
  'image/png': Buffer.from([0x89, 0x50, 0x4E, 0x47]),
  'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]), // RIFF
};

const verifyMagicBytes = (buffer, mime) => {
  const expected = MAGIC_BYTES[mime];
  if (!expected) return false;
  return buffer.slice(0, expected.length).equals(expected);
};

const generateSafeFilename = (original) => {
  const ext = path.extname(original).toLowerCase() || '.jpg';
  return `${crypto.randomBytes(16).toString('hex')}${ext}`;
};

const upload = async (file) => {
  if (!verifyMagicBytes(file.buffer, file.mimetype)) {
    const err = new Error('Invalid image file (magic bytes mismatch)');
    err.statusCode = 400;
    throw err;
  }
  const filename = generateSafeFilename(file.originalname);
  if (isProd || process.env.CLOUDINARY_CLOUD_NAME) {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'property-portal', public_id: filename.replace(/\.[^.]+$/, ''), resource_type: 'image' },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(file.buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  } else {
    // Local disk for dev/test
    const uploadDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return { url: `/uploads/${filename}`, publicId: filename };
  }
};

const deleteImage = async (publicId) => {
  if (!publicId) return;
  try {
    if (isProd || process.env.CLOUDINARY_CLOUD_NAME) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      const filepath = path.join(__dirname, '../../uploads', publicId);
      await fs.unlink(filepath).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to delete image:', e.message);
  }
};

module.exports = { upload, deleteImage, verifyMagicBytes, generateSafeFilename };
