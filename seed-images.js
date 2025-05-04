import mongoose from "mongoose";
import Gallery from "./models/galleryImage.js"; // Adjust path accordingly
import { galleryImages } from "../catalogue/src/data/galleryImages.ts"; // Adjust path to your data
require('dotenv').config();

// MongoDB connection URI
const MONGO_URI = "mongodb+srv://f35041063:aabbccddee@cluster0.p7hzuzn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"


async function seedGallery() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected for seeding...");

    // Clear existing data
    await Gallery.deleteMany({});
    console.log("Existing Gallery data cleared");

    // Insert new data
    await Gallery.insertMany(galleryImages);
    console.log(`Seeded ${galleryImages.length} gallery images`);

    // Close connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

seedGallery();