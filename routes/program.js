const express = require('express');
const { Program } = require('../models/collegeProgram');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth');
const mongoose = require('mongoose');
require('dotenv').config();

const router = express.Router();

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create a program
router.post('/', authenticate, async (req, res) => {
  try { 
    const program = new Program(req.body);
    await program.save();
    res.status(201).json(program);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all programs
router.get('/', authenticate, async (req, res) => {
  try { 
    const programs = await Program.find().populate('colleges'); // Populate colleges field
    res.json(programs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single program
router.get('/:id', authenticate, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id).populate('colleges'); // Populate colleges field
    if (!program) return res.status(404).json({ message: 'Program not found' });
    res.json(program);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a program
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { addColleges, removeColleges, ...updateData } = req.body;

    // Validate the program ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid program ID' });
    }

    // Perform the update in two steps to avoid conflicts
    let updatedProgram;

    // Step 1: Add colleges
    if (addColleges && Array.isArray(addColleges)) {
      updatedProgram = await Program.findByIdAndUpdate(
        id,
        { $addToSet: { colleges: { $each: addColleges } } }, // Use $addToSet to avoid duplicates
        { new: true }
      );
    }

    // Step 2: Remove colleges
    if (removeColleges && Array.isArray(removeColleges)) {
      updatedProgram = await Program.findByIdAndUpdate(
        id,
        { $pull: { colleges: { $in: removeColleges } } },
        { new: true }
      );
    }

    // Step 3: Update other fields
    if (Object.keys(updateData).length > 0) {
      updatedProgram = await Program.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
    }

    if (!updatedProgram) {
      return res.status(404).json({ message: 'Program not found' });
    }

    res.json(updatedProgram);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a program
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });
    res.json({ message: 'Program deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;