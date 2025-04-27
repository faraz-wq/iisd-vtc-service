const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const sanitize = require("sanitize-filename");
require("dotenv").config();

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
    // Specify the folder where files will be stored
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using the original name and a timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Preserve the file extension
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Configure Multer with disk storage
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WEBP are allowed!"), false);
    }
  },
}).single("image"); // 'image' is the field name for the uploaded file

// Middleware to handle file upload and Cloudinary integration
const cloudinaryUploadMiddleware = async (req, res, next) => {
  try {
    // Handle file upload using multer
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    // Generate a unique filename for Cloudinary
    const baseName = req.file.originalname.split(".").slice(0, -1).join(".");
    const sanitizedBaseName = sanitize(baseName);
    const truncatedBaseName = sanitizedBaseName.substring(0, 50); // Limit to 50 characters
    const uniqueFileName = `${uuidv4()}-${truncatedBaseName}`;

    // Log the generated filename for debugging
    console.log("Generated uniqueFileName:", uniqueFileName);

    // Upload the file from disk to Cloudinary
    const filePath = req.file.path; // Path to the file saved on disk
    const cloudinaryResponse = await cloudinary.uploader.upload(filePath, {
      public_id: uniqueFileName,
      resource_type: "image",
    });

    // Attach the Cloudinary URL to the request object
    req.cloudinaryUrl = cloudinaryResponse.secure_url;

    // Optionally, delete the file from disk after uploading to Cloudinary
    fs.unlinkSync(filePath); // Delete the file

    next(); 
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ message: "File upload failed", error: error.message });
  }
};

module.exports = cloudinaryUploadMiddleware;