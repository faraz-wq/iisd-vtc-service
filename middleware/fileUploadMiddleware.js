// fileUploadMiddleware.js
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const sanitize = require("sanitize-filename");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Ensure the uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Create the folder if it doesn't exist
}

// Multer configuration for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Configure Multer to handle multiple file types
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",        // JPEG/JPG images
      "image/png",         // PNG images
      "image/webp",        // WebP images
      "image/gif",         // GIF images
      "image/svg+xml",     // SVG images
      "image/tiff",        // TIFF images
      "image/x-icon",      // ICO images (alternative MIME type)
      "image/vnd.microsoft.icon", // ICO images (standard MIME type)
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed!"), false);
    }
  },
}).fields([
  { name: "logo", maxCount: 1 }, // Single logo upload
  { name: "banner", maxCount: 1 }, // Single banner upload
  { name: "facultyImages", maxCount: 10 }, // Multiple faculty images
  { name: "image", maxCount: 1 } // Or use this if you prefer single image uploads
]);

/**
 * Middleware to handle file uploads and Cloudinary integration.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const handleFileUploads = async (req, res, next) => {
  try {
    // Handle file uploads using Multer
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    console.log(req.files);
    // Check if any files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      console.log("No files were uploaded.");
      req.uploadedFiles = {}; // Attach an empty object to indicate no files were uploaded
      return next();
    }

    // Process each uploaded file and upload to Cloudinary
    const uploadedFiles = {}; 
    if (req.files["logo"]) {
      uploadedFiles.logo = await uploadToCloudinary(req.files["logo"][0]);
    }

    if (req.files["banner"]) {
      uploadedFiles.banner = await uploadToCloudinary(req.files["banner"][0]);
    }

    if (req.files["facultyImages"]) {
      uploadedFiles.facultyImages = await Promise.all(
        req.files["facultyImages"].map(async (file) => {
          return await uploadToCloudinary(file);
        })
      );
    }

    if (req.files["image"]) {
      uploadedFiles.image = await uploadToCloudinary(req.files["image"][0]);
    }
    console.log(uploadedFiles);
    // Attach uploaded file URLs to the request object
    req.uploadedFiles = uploadedFiles;

    next();
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ message: "File upload failed", error: error.message });
  }
};

/**
 * Helper function to upload a single file to Cloudinary.
 * @param {Object} file - The file object to upload.
 * @returns {Promise<string>} - The secure URL of the uploaded file.
 */
const uploadToCloudinary = async (file) => {
  const baseName = file.originalname.split(".").slice(0, -1).join(".");
  const sanitizedBaseName = sanitize(baseName);
  const truncatedBaseName = sanitizedBaseName.substring(0, 50); // Limit to 50 characters
  const uniqueFileName = `${uuidv4()}-${truncatedBaseName}`;

  const filePath = file.path; // Path to the file saved on disk
  const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
    public_id: uniqueFileName,
    resource_type: "image",
  });

  // Optionally, delete the file from disk after uploading to Cloudinary
  fs.unlinkSync(filePath);

  return cloudinaryResponse.secure_url;
};

module.exports = handleFileUploads;