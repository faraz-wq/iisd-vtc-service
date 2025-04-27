import mongoose, { Schema, models, model } from "mongoose";

// Define the Generic Form Submission Schema
const formSubmissionSchema = new Schema(
  {
    // Common fields
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String, 
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => /^[0-9]{10,15}$/.test(value),
        message: "Phone number must be 10-15 digits",
      },
    },

    // Optional fields for specific forms
    subject: {
      type: String,
      trim: true,
    },
    program: {
      type: String,
      trim: true,
    },
    bestTime: {
      type: String,
      enum: ["morning", "afternoon", "evening"], // Restrict to predefined values
    },
    message: {
      type: String,
      trim: true,
    },

    // Dynamic metadata for additional fields
    metadata: {
      type: Schema.Types.Mixed, // Allows storing arbitrary key-value pairs
      default: {},
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Create the Mongoose model
const FormSubmission =
  models.FormSubmission || model("FormSubmission", formSubmissionSchema);

export default FormSubmission;