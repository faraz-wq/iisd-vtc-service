import express from "express";
import FormSubmission from "../models/forms"; // Import the generic model

const router = express.Router();

// Middleware to parse JSON
router.use(express.json());

// POST route to handle form submissions
router.post("/", async (req, res) => {
  try {
    const formData = req.body;
    
    // Validate required fields
    if (!formData.name || !formData.phone) {
      return res.status(400).json({ error: "Name, email, and phone are required" });
    }

    // Create a new form submission document
    const newSubmission = new FormSubmission(formData);

    // Save the document to the database
    await newSubmission.save();

    res.status(201).json({
      message: "Form submitted successfully",
      data: newSubmission,
    });
  } catch (error) {
    console.error("Error saving form submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;