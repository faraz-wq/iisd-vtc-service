const mongoose = require('mongoose');
const { Program, College } = require('./models/collegeProgram'); 
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI);

import { COLLEGES, PROGRAMS } from './collegedata';  

async function seedDatabase() {
  try {
    // Step 1: Clear existing data
    await College.deleteMany({});
    await Program.deleteMany({});
    const savedColleges = await College.insertMany(COLLEGES);
    // Create a mapping of college names to their IDs
    const collegeNameToId = {};
    savedColleges.forEach((college) => {
      collegeNameToId[college.name] = college._id;
    });

    // Step 3: Transform Programs to Include College References
    const transformedPrograms = PROGRAMS.map((program) => {
      return {
        ...program,
        colleges: program.colleges.map((collegeName) => collegeNameToId[collegeName]),
      };
    });

    // Step 4: Save Programs to Database
    const savedPrograms = await Program.insertMany(transformedPrograms);

    // Create a mapping of program titles to their IDs
    const programTitleToId = {};
    savedPrograms.forEach((program) => {
      programTitleToId[program.title] = program._id;
    });

    // Step 5: Update Colleges with Program References
    const updatedColleges = savedColleges.map((college) => {
      const programIds = PROGRAMS
        .filter((program) => program.colleges.includes(college.name))
        .map((program) => programTitleToId[program.title]);

      return {
        ...college.toObject(),
        programs: programIds,
      };
    });

    // Save Updated Colleges
    await College.bulkWrite(
      updatedColleges.map((college) => ({
        updateOne: {
          filter: { _id: college._id },
          update: { $set: { programs: college.programs } },
        },
      }))
    );

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();