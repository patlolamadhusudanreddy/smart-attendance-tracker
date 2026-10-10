const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk Storage for Image uploads (Profile Photos)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Image filter
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed!'), false);
};

// Memory Storage for Excel files (processed directly via xlsx buffer)
const memoryStorage = multer.memoryStorage();

// Excel filter
const excelFilter = (req, file, cb) => {
  const allowedExts = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExts.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error('Only Excel/CSV spreadsheets (.xlsx, .xls, .csv) are allowed!'), false);
};

const uploadPhoto = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFilter,
});

const uploadExcel = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: excelFilter,
});

module.exports = {
  uploadPhoto,
  uploadExcel,
};
