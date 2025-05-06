const mongoose = require('mongoose');
const cloudinary = require("cloudinary").v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
// Import your models
import Gallery from './models/galleryImage';
const { College } = require('./models/collegeProgram') // Adjust path accordingly

// Helper: Extract public_id from Cloudinary URL
function extractPublicId(url) {
  const regex = /\/([^\/]+\/[^\.]+)(?:\.\w+)?$/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Convert public_id back to secure_url
function publicIdToUrl(publicId) {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
}

// Collect all image URLs from DB
async function collectAllImageUrlsFromDB() {
  const urls = new Set();

  // From Gallery
  const galleryDocs = await Gallery.find({}, 'src');
  galleryDocs.forEach((doc) => {
    if (doc.src) urls.add(doc.src);
  });

  console.log('gallery urls', galleryDocs)

  // From College
  const collegeDocs = await College.find({}, 'logo banner faculty.image');
  collegeDocs.forEach((college) => {
    if (college.logo) urls.add(college.logo);
    if (college.banner) urls.add(college.banner);

    if (college.faculty && college.faculty.length > 0) {
      college.faculty.forEach((prof) => {
        if (prof.image) urls.add(prof.image);
      });
    }
  });
  console.log('college urls',collegeDocs);

  return Array.from(urls);
}

// Main cleanup function
async function cleanupUnusedCloudinaryFiles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Step 1: Get all URLs stored in database
    console.log('🔄 Fetching all image URLs from database...');
    const dbUrls = await collectAllImageUrlsFromDB();
    console.log(`📦 Found ${dbUrls.length} image URLs in the database`);

    // Step 2: Get all assets from Cloudinary
    let nextCursor = null;
    let cloudinaryPublicIds = [];

    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        max_results: 500,
        next_cursor: nextCursor,
      });

      cloudinaryPublicIds.push(...result.resources.map(r => r.public_id));
      nextCursor = result.next_cursor;
    } while (nextCursor);

    console.log(`📷 Found ${cloudinaryPublicIds.length} image assets in Cloudinary`);

    // Step 3: Check which files are unused
    const unusedPublicIds = [];

    for (const publicId of cloudinaryPublicIds) {
      const url = publicIdToUrl(publicId);
      if (!dbUrls.includes(url)) {
        unusedPublicIds.push(publicId);
      }
    }

    console.log(`❌ Found ${unusedPublicIds.length} unused image files`);

    if (unusedPublicIds.length === 0) {
      console.log('🎉 No unused files to delete.');
      return;
    }

    // Step 4: Prompt user to confirm deletion
    console.log('\n🗑️ The following files will be deleted:');
    unusedPublicIds.forEach((id, i) => {
      console.log(`   ${i + 1}. ${publicIdToUrl(id)}`);
    });

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\n⚠️ Are you sure you want to delete these files? (yes/no): ', async (answer) => {
      readline.close();

      if (answer.trim().toLowerCase() === 'yes') {
        console.log('🔥 Deleting files from Cloudinary...');
        await cloudinary.api.delete_resources(unusedPublicIds);
        console.log('✅ All unused files deleted successfully!');
      } else {
        console.log('🛑 Deletion canceled.');
      }
    });

  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupUnusedCloudinaryFiles();