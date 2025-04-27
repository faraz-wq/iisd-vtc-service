const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: String, required: true },
  eligibility: { type: String, required: true },
  description: { type: String, required: true },
  career: { type: String, required: true },
  features: { type: [String], required: true },
});

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  logo: { type: String, required: true },
  banner: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  affiliation: { type: String, required: false },
  contact: {
    address: { type: String, required: true },
    phone: { type: [String], required: true },
    email: { type: String, required: true },
  },
  color: { type: String, required: true },
  programs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
  facilities: { type: [String], required: true },
  faculty: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: { type: String, required: true },
      position: { type: String, required: true },
      qualification: { type: String, required: true },
      image: { type: String, required: true },
    },
  ],
  events: [
    { 
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      title: { type: String, required: true },
      date: { type: String, required: true },
      description: { type: String, required: true },
    },
  ],
});

const Program = mongoose.model('Program', programSchema);
const College = mongoose.model('College', collegeSchema);

module.exports = { Program, College };