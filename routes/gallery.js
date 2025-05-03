import express from "express";
import mongoose from "mongoose";
import handleFileUploads from "../middleware/fileUploadMiddleware.js";
import Gallery from "../models/galleryImage.js";
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// Helper: Send standardized API response
const sendApiResponse = (res, status, data, message, error = null) => {
  return res.status(status).json({
    status,
    data,
    message,
    ...(error && { error }),
  });
};

// GET all images with populated college info
router.get("/", async (req, res) => {
  try {
    const images = await Gallery.find().populate("colleges", "name shortName");
    return sendApiResponse(res, 200, images, "Images retrieved successfully");
  } catch (error) {
    return sendApiResponse(
      res,
      500,
      null,
      "Failed to retrieve images",
      error.message
    );
  }
});

// GET image by ID with populated college info
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendApiResponse(res, 400, null, "Invalid ID format");
    }

    const image = await Gallery.findById(id).populate(
      "colleges",
      "name shortName"
    );

    if (!image) {
      return sendApiResponse(res, 404, null, "Image not found");
    }

    return sendApiResponse(res, 200, image, "Image retrieved successfully");
  } catch (error) {
    return sendApiResponse(
      res,
      500,
      null,
      "Failed to retrieve image",
      error.message
    );
  }
});

// Filter images by category, college, or tag
router.get("/filter", async (req, res) => {
  try {
    const { filterType, value } = req.query;

    if (!["category", "college", "tag"].includes(filterType)) {
      return sendApiResponse(res, 400, [], "Invalid filter type");
    }

    let query = {};
    if (value !== "All") {
      switch (filterType) {
        case "category":
          query.category = value;
          break;
        case "college":
          query.colleges = new mongoose.Types.ObjectId(value);
          break;
        case "tag":
          query.tags = value;
          break;
      }
    }

    const filteredImages = await Gallery.find(query).populate(
      "colleges",
      "name shortName"
    );

    return sendApiResponse(
      res,
      200,
      filteredImages,
      `Found ${filteredImages.length} images matching ${filterType}: ${value}`
    );
  } catch (error) {
    return sendApiResponse(res, 500, [], "Filtering failed", error.message);
  }
});

// Get available filter options (including college names)
router.get("/filters/options", async (req, res) => {
  try {
    const { filterType } = req.query;

    if (!["category", "college", "tag"].includes(filterType)) {
      return sendApiResponse(res, 400, [], "Invalid filter type");
    }

    const images = await Gallery.find().populate("colleges", "name");

    const optionsMap = new Map();

    images.forEach((img) => {
      if (filterType === "category") {
        const val = img.category;
        if (val) optionsMap.set(val, (optionsMap.get(val) || 0) + 1);
      } else if (filterType === "college") {
        img.colleges?.forEach((college) => {
          optionsMap.set(college.name, (optionsMap.get(college.name) || 0) + 1);
        });
      } else if (filterType === "tag") {
        img.tags?.forEach((tag) => {
          optionsMap.set(tag, (optionsMap.get(tag) || 0) + 1);
        });
      }
    });

    const options = Array.from(optionsMap.entries()).map(([value, count]) => ({
      value,
      label: value,
      count,
    }));

    options.sort((a, b) => a.label.localeCompare(b.label));
    options.unshift({ value: "All", label: "All", count: images.length });

    return sendApiResponse(
      res,
      200,
      options,
      `Retrieved ${options.length - 1} ${filterType} options`
    );
  } catch (error) {
    return sendApiResponse(
      res,
      500,
      [],
      "Failed to retrieve filter options",
      error.message
    );
  }
});

// Upload single gallery image
router.post("/upload", handleFileUploads, async (req, res) => {
  try {
    if (!req.uploadedFiles.image) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imageData = {
      src: req.uploadedFiles.image,
      alt: req.body.alt || "Gallery Image",
      category: req.body.category || "",
      title: req.body.title,
      description: req.body.description || "",
      colleges: req.body.colleges
        ? JSON.parse(req.body.colleges).map(
            (id) => new mongoose.Types.ObjectId(id)
          )
        : [],
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
    };

    const savedImage = await Gallery.create(imageData);
    res.status(201).json(savedImage);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error saving image", error: error.message });
  }
});

// Update an existing gallery image
router.put("/:id", handleFileUploads, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendApiResponse(res, 400, null, "Invalid ID format");
    }

    // Find the existing image
    const existingImage = await Gallery.findById(id);
    if (!existingImage) {
      return sendApiResponse(res, 404, null, "Image not found");
    }

    // Prepare update data
    const updateData = {
      alt: req.body.alt || existingImage.alt,
      category: req.body.category || existingImage.category,
      title: req.body.title || existingImage.title,
      description: req.body.description || existingImage.description,
      colleges: req.body.colleges
        ? JSON.parse(req.body.colleges).map(
            (id) => new mongoose.Types.ObjectId(id)
          )
        : existingImage.colleges,
      tags: req.body.tags ? JSON.parse(req.body.tags) : existingImage.tags,
    };

    // If a new image was uploaded, update the src
    if (req.uploadedFiles?.image) {
      updateData.src = req.uploadedFiles.image;
      // TODO: Optionally delete the old image from Cloudinary here
    }

    const updatedImage = await Gallery.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("colleges", "name shortName");

    return sendApiResponse(
      res,
      200,
      updatedImage,
      "Image updated successfully"
    );
  } catch (error) {
    return sendApiResponse(
      res,
      500,
      null,
      "Failed to update image",
      error.message
    );
  }
});

// Delete a gallery image
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendApiResponse(res, 400, null, "Invalid ID format");
    }

    const image = await Gallery.findByIdAndDelete(id);

    if (!image) {
      return sendApiResponse(res, 404, null, "Image not found");
    }

    // TODO: Add Cloudinary image deletion here if needed
    await cloudinary.uploader.destroy(getPublicIdFromUrl(image.src));

    return sendApiResponse(res, 200, null, "Image deleted successfully");
  } catch (error) {
    return sendApiResponse(
      res,
      500,
      null,
      "Failed to delete image",
      error.message
    );
  }
});
export default router;
