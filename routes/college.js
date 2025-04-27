/**
 * @module College Routes
 * This module defines all API routes related to the College model.
 * It includes CRUD operations for colleges, as well as specific routes for uploading files (logo, banner, faculty images).
 */

const express = require('express');
const { College } = require('../models/collegeProgram');
const authenticate = require('../middleware/auth');
const cloudinaryUploadMiddleware = require('../middleware/cloudinary');
const handleFileUploads = require('../middleware/fileUploadMiddleware');
require('dotenv').config();


const router = express.Router();

/**
 * @route POST /colleges
 * @description Create a new college.
 * @access Private (requires authentication)
 * @param {Object} req.body - The request body containing college details.
 * @param {string} req.body.name - The name of the college. (Required)
 * @param {string} req.body.shortName - The short name of the college. (Required)
 * @param {string} [req.body.description] - A description of the college. (Required)
 * @param {string} [req.body.location] - The location of the college. (Required)
 * @param {Object} [req.body.contact] - Contact details of the college. (Required)
 * @param {string} [req.body.contact.address] - The address of the college. (Required)
 * @param {string[]} [req.body.contact.phone] - An array of phone numbers. (Required)
 * @param {string} [req.body.contact.email] - The email address of the college. (Required)
 * @param {string} [req.body.affiliation] - The affiliation of the college. (Optional)
 * @param {string} [req.body.color] - The primary color associated with the college. (Optional)
 * @param {string[]} [req.body.facilities] - An array of facilities provided by the college. (Optional)
 * @param {string[]} [req.body.programs] - An array of program IDs referencing the Program model. (Optional)
 * @param {Object[]} [req.body.faculty] - An array of faculty members. (Optional)
 * @param {string} req.body.faculty[].name - The name of the faculty member. (Required if faculty is provided)
 * @param {string} req.body.faculty[].position - The position of the faculty member. (Required if faculty is provided)
 * @param {string} req.body.faculty[].qualification - The qualification of the faculty member. (Required if faculty is provided)
 * @param {string} [req.body.faculty[].image] - The image URL of the faculty member. (Optional)
 * @param {Object[]} [req.body.events] - An array of events hosted by the college. (Optional)
 * @param {string} req.body.events[].title - The title of the event. (Required if events are provided)
 * @param {string} req.body.events[].date - The date of the event. (Required if events are provided)
 * @param {string} [req.body.events[].description] - A description of the event. (Optional)
 * @param {File} [req.files.logo] - The college logo file. (Optional)
 * @param {File} [req.files.banner] - The college banner file. (Optional)
 * @param {File[]} [req.files.facultyImages] - An array of faculty image files. (Optional)
 * @returns {Object} 201 - The newly created college object.
 * @returns {Object} 400 - Error message if validation fails.
 * @returns {Object} 500 - Error message if file upload or server error occurs.
 */
router.post("/", authenticate, handleFileUploads, async (req, res) => {
  try {
    // Extract uploaded file URLs
    const { logo, banner, facultyImages } = req.uploadedFiles || {};

    const faculty = Array.isArray(req.body.faculty)
    ? req.body.faculty
    : JSON.parse(req.body.faculty || "[]");

    const events = Array.isArray(req.body.events)
      ? req.body.events
      : JSON.parse(req.body.events || "[]");
    // Prepare college data with uploaded file URLs
    const collegeData = {
      ...req.body,
      logo: logo || req.body.logo, // Use uploaded logo URL or fallback to body value
      banner: banner || req.body.banner, // Use uploaded banner URL or fallback to body value
      faculty: faculty?.map((member, index) => ({
        ...member,
        image: facultyImages?.[index] || member.image, 
      })),
      events: events.map((event) => ({
        title: event.title,
        date: event.date,
        description: event.description || "",
      })),
    };

    // Create and save the new college
    const college = new College(collegeData);
    await college.save();

    res.status(201).json(college);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ message: err.message });
  }
});

/**
 * @route GET /colleges
 * @description Retrieve all colleges.
 * @access Private (requires authentication)
 * @returns {Object[]} 200 - An array of college objects, with referenced programs populated.
 * @returns {Object} 500 - Error message if an internal server error occurs.
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const colleges = await College.find().populate('programs'); // Populate referenced programs
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /colleges/:id
 * @description Retrieve a single college by ID.
 * @access Private (requires authentication)
 * @param {string} req.params.id - The ID of the college to retrieve. (Required)
 * @returns {Object} 200 - The college object, with referenced programs populated.
 * @returns {Object} 404 - Error message if the college is not found.
 * @returns {Object} 500 - Error message if an internal server error occurs.
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findById(req.params.id).populate('programs'); // Populate referenced programs
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route PUT /colleges/:id
 * @description Update a college by ID.
 * @access Private (requires authentication)
 * @param {string} req.params.id - The ID of the college to update. (Required)
 * @param {Object} req.body - The updated college details.
 * @param {string} [req.body.name] - The updated name of the college. (Optional)
 * @param {string} [req.body.shortName] - The updated short name of the college. (Optional)
 * @param {string} [req.body.logo] - The updated URL of the college logo. (Optional)
 * @param {string} [req.body.banner] - The updated URL of the college banner. (Optional)
 * @param {string} [req.body.description] - The updated description of the college. (Optional)
 * @param {string} [req.body.location] - The updated location of the college. (Optional)
 * @param {string} [req.body.affiliation] - The updated affiliation of the college. (Optional)
 * @param {Object} [req.body.contact] - Updated contact details of the college. (Optional)
 * @param {string} [req.body.contact.address] - The updated address of the college. (Optional)
 * @param {string[]} [req.body.contact.phone] - An updated array of phone numbers. (Optional)
 * @param {string} [req.body.contact.email] - The updated email address of the college. (Optional)
 * @param {string} [req.body.color] - The updated primary color associated with the college. (Optional)
 * @param {string[]} [req.body.programs] - An updated array of program IDs referencing the Program model. (Optional)
 * @param {string[]} [req.body.facilities] - An updated array of facilities provided by the college. (Optional)
 * @param {Object[]} [req.body.faculty] - An updated array of faculty members. (Optional)
 * @param {string} req.body.faculty[].name - The updated name of the faculty member. (Required if faculty is provided)
 * @param {string} req.body.faculty[].position - The updated position of the faculty member. (Required if faculty is provided)
 * @param {string} req.body.faculty[].qualification - The updated qualification of the faculty member. (Required if faculty is provided)
 * @param {string} [req.body.faculty[].image] - The updated image URL of the faculty member. (Optional)
 * @param {Object[]} [req.body.events] - An updated array of events hosted by the college. (Optional)
 * @param {string} req.body.events[].title - The updated title of the event. (Required if events are provided)
 * @param {string} req.body.events[].date - The updated date of the event. (Required if events are provided)
 * @param {string} [req.body.events[].description] - The updated description of the event. (Optional)
 * @returns {Object} 200 - The updated college object.
 * @returns {Object} 404 - Error message if the college is not found.
 * @returns {Object} 400 - Error message if validation fails.
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @route DELETE /colleges/:id
 * @description Delete a college by ID.
 * @access Private (requires authentication)
 * @param {string} req.params.id - The ID of the college to delete. (Required)
 * @returns {Object} 200 - Success message indicating the college was deleted.
 * @returns {Object} 404 - Error message if the college is not found.
 * @returns {Object} 500 - Error message if an internal server error occurs.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json({ message: 'College deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route POST /colleges/:id/upload-logo
 * @description Upload a logo for a specific college.
 * @access Private (requires authentication)
 * @param {string} req.params.id - The ID of the college to upload the logo for. (Required)
 * @param {File} req.file - The file to upload (handled by Cloudinary middleware). (Required)
 * @returns {Object} 200 - Success message and the updated college object with the new logo URL.
 * @returns {Object} 404 - Error message if the college is not found.
 * @returns {Object} 500 - Error message if an internal server error occurs.
 */
router.post('/colleges/:id/upload-logo', authenticate, cloudinaryUploadMiddleware, async (req, res) => {
  try {
    const collegeId = req.params.id;
    const filePath = req.cloudinaryUrl; // Path to the uploaded file

    // Update the college's logo field
    const updatedCollege = await College.findByIdAndUpdate(
      collegeId,
      { logo: filePath },
      { new: true }
    );

    if (!updatedCollege) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.json({ message: 'Logo uploaded successfully', college: updatedCollege });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route POST /colleges/:id/upload-banner
 * @description Upload a banner for a specific college.
 * @access Private (requires authentication)
 * @param {string} req.params.id - The ID of the college to upload the banner for. (Required)
 * @param {File} req.file - The file to upload (handled by Cloudinary middleware). (Required)
 * @returns {Object} 200 - Success message and the updated college object with the new banner URL.
 * @returns {Object} 404 - Error message if the college is not found.
 * @returns {Object} 500 - Error message if an internal server error occurs.
 */
router.post('/colleges/:id/upload-banner', authenticate, cloudinaryUploadMiddleware, async (req, res) => {
  try {
    const collegeId = req.params.id;
    const filePath = req.cloudinaryUrl; // Path to the uploaded file

    // Update the college's banner field
    const updatedCollege = await College.findByIdAndUpdate(
      collegeId,
      { banner: filePath },
      { new: true }
    );

    if (!updatedCollege) {
      return res.status(404).json({ message: 'College not found' });
    }

    res.json({ message: 'Banner uploaded successfully', college: updatedCollege });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route POST /colleges/:collegeId/faculty/:facultyId/upload-image
 * @description Upload an image for a specific faculty member of a college.
 * @access Private (requires authentication)
 * @param {string} req.params.collegeId - The ID of the college. (Required)
 * @param {string} req.params.facultyId - The ID of the faculty member to upload the image for. (Required)
 * @param {File} req.file - The file to upload (handled by Cloudinary middleware). (Required)
 * @returns {Object} 200 - Success message and the updated college object with the new faculty image URL.
 * @returns {Object} 404 - Error message if the college or faculty member is not found.
 * @returns {Object} 500 - Error message if an internal server error occurs.
 */
router.post(
  '/colleges/:collegeId/faculty/:facultyId/upload-image',
  authenticate,
  cloudinaryUploadMiddleware,
  async (req, res) => {
    try {
      const { collegeId, facultyId } = req.params;
      const filePath = req.cloudinaryUrl; // Path to the uploaded file

      // Find the college and update the specific faculty member's image
      const updatedCollege = await College.findOneAndUpdate(
        {
          _id: collegeId,
          'faculty._id': facultyId, // Match the specific faculty member
        },
        {
          $set: {
            'faculty.$.image': filePath, // Update the image field of the matched faculty member
          },
        },
        { new: true }
      );

      if (!updatedCollege) {
        return res.status(404).json({ message: 'College or faculty member not found' });
      }

      res.json({
        message: 'Profile picture uploaded successfully',
        college: updatedCollege,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;