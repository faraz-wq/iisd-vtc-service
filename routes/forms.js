import express from "express";
import FormSubmission from "../models/forms"; 
import authenticate from "../middleware/auth";

const router = express.Router();

// Middleware to parse JSON
router.use(express.json());

// 1. CREATE: POST route to handle form submissions
router.post("/", async (req, res) => {
  try {
    const formData = req.body;

    // Validate required fields
    if (!formData.name || !formData.phone) {
      return res.status(400).json({ error: "Name and phone are required" });
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

// 2. READ: GET route to fetch all form submissions
router.get("/", authenticate, async (req, res) => {
  try {
    const submissions = await FormSubmission.find();  
    res.status(200).json({
      message: "Form submissions retrieved successfully",
      data: submissions,
    });
  } catch (error) {
    console.error("Error fetching form submissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. READ (Single): GET route to fetch a single form submission by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the form submission by ID
    const submission = await FormSubmission.findById(id).lean();

    if (!submission) {
      return res.status(404).json({ error: "Form submission not found" });
    }

    res.status(200).json({
      message: "Form submission retrieved successfully",
      data: submission,
    });
  } catch (error) {
    console.error("Error fetching form submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. DELETE: DELETE route to delete a form submission by ID
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the form submission by ID
    const deletedSubmission = await FormSubmission.findByIdAndDelete(id);

    if (!deletedSubmission) {
      return res.status(404).json({ error: "Form submission not found" });
    }

    res.status(200).json({
      message: "Form submission deleted successfully",
      data: deletedSubmission,
    });
  } catch (error) {
    console.error("Error deleting form submission:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;