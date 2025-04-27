const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: String, required: true },
  eligibility: { type: String, default: 'NA' },
  description: { type: String,  },
  career: { type: String,  },
  features: { type: [String]  },
  colleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
  }]
});

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  logo: { type: String,  },
  banner: { type: String,  },
  description: { type: String,  },
  location: { type: String,  },
  affiliation: { type: String,  },
  contact: {
    address: { type: String,  },
    phone: { type: [String],  },
    email: { type: String,  },
  },
  color: { type: String,  },
  programs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Program' }],
  facilities: { type: [String]  },
  faculty: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: { type: String, required: true },
      position: { type: String, required: true },
      qualification: { type: String, required: true },
      image: { type: String,  },
    },
  ],
  events: [
    { 
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      title: { type: String, required: true },
      date: { type: String, required: true },
      description: { type: String,  },
    },
  ],
});

const Program = mongoose.model('Program', programSchema);
const College = mongoose.model('College', collegeSchema);

module.exports = { Program, College };