const cloudinaryUploadMiddleware = require('../middleware/cloudinary');
const express = require('express');
const { College } = require('../models/collegeProgram');
const authenticate = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Create a college
router.post('/', authenticate, async (req, res) => {
  try {
    const college = new College(req.body);
    await college.save();
    res.status(201).json(college);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all colleges
router.get('/', authenticate, async (req, res) => {
  try {
    const colleges = await College.find().populate('programs'); // Populate referenced programs
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single college by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findById(req.params.id).populate('programs'); // Populate referenced programs
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a college by ID
router.put('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json(college);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a college by ID
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const college = await College.findByIdAndDelete(req.params.id);
    if (!college) return res.status(404).json({ message: 'College not found' });
    res.json({ message: 'College deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to upload a logo
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

// Route to upload a banner
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