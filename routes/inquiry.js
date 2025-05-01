import express from "express";
import Inquiry from "../models/inquiry"; // Import the Mongoose model
import authenticate from "../middleware/auth";
const router = express.Router();

// Middleware to parse JSON
router.use(express.json());

// 1. Create a new inquiry (POST)
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, college, program, inquiry } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !college || !program || !inquiry) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create a new inquiry document
    const newInquiry = new Inquiry({
      name,
      email,
      phone,
      college,
      program,
      inquiry,
    });

    // Save the document to the database
    await newInquiry.save();

    res.status(201).json({ message: "Inquiry submitted successfully", data: newInquiry });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Get all inquiries (GET)
router.get("/", async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }); // Sort by newest first
    res.status(200).json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Get a single inquiry by ID (GET)
router.get("/:id", authenticate, async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    res.status(200).json(inquiry);
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
 
// 5. Delete an inquiry by ID (DELETE)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const deletedInquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!deletedInquiry) {
      return res.status(404).json({ error: "Inquiry not found" });
    }

    res.status(200).json({ message: "Inquiry deleted successfully" });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;