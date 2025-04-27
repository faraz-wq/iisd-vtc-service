import mongoose, { Schema, models, model } from "mongoose";

// Define the Inquiry Schema
const inquirySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: (value) => /^[0-9]{10,15}$/.test(value),
        message: "Phone number must be 10-15 digits",
      },
    },
    college: {
      type: String,
      required: [true, "College of interest is required"],
      trim: true,
    },
    program: {
      type: String,
      required: [true, "Program of interest is required"],
      trim: true,
    },
    inquiry: {
      type: String,
      required: [true, "Inquiry details are required"],
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create the Mongoose model
const Inquiry = models.Inquiry || model("Inquiry", inquirySchema);

export default Inquiry;