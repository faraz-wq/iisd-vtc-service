import mongoose from "mongoose";

const GalleryImageSchema = new mongoose.Schema(
  {
    src: { type: String, required: true },
    alt: { type: String, required: true },
    category: { type: String },
    title: { type: String, required: true },
    description: { type: String }, 
    colleges: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "College",
      },
    ],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const Gallery = mongoose.model("Gallery", GalleryImageSchema);

export default Gallery;