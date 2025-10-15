// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve uploaded files

// ===== MongoDB Connection =====
const mongoURL = process.env.MONGO_URL || 'mongodb+srv://dolambstuit21007_db_user:rsJTX7ACPiAnnzKl@cluster0.21eqdrf.mongodb.net/courseDB';

mongoose.connect(mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1); // stop server if DB connection fails
});

// ===== Schemas =====
const courseSchema = new mongoose.Schema({ name: String });
const Course = mongoose.model('Course', courseSchema);

const fileSchema = new mongoose.Schema({
  title: String,
  url: String,
  course: String
});
const File = mongoose.model('File', fileSchema);

// ===== Multer setup =====
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ===== Routes =====

// Get all courses
app.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get all files for a course
app.get('/files/:course', async (req, res) => {
  try {
    const files = await File.find({ course: req.params.course });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Admin: Add a course
app.post('/admin/add-course', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Course name required' });

    const existing = await Course.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Course already exists' });

    await Course.create({ name });
    res.json({ message: 'Course added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding course' });
  }
});

// Admin: Add file via URL
app.post('/admin/add-file', async (req, res) => {
  try {
    const { title, url, course } = req.body;
    if (!title || !url || !course) return res.status(400).json({ message: 'Missing fields' });

    let c = await Course.findOne({ name: course });
    if (!c) c = await Course.create({ name: course });

    await File.create({ title, url, course });
    res.json({ message: 'File added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding file' });
  }
});

// Admin: Upload local file
app.post('/admin/upload-file', upload.single('file'), async (req, res) => {
  try {
    const { title, course } = req.body;
    const file = req.file;
    if (!title || !course || !file)
      return res.status(400).json({ message: 'Missing fields or file' });

    let c = await Course.findOne({ name: course });
    if (!c) c = await Course.create({ name: course });

    const fileUrl = `uploads/${file.filename}`;
    await File.create({ title, url: fileUrl, course });
    res.json({ message: 'File uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Admin: Delete file
app.delete('/admin/delete-file/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.url.startsWith('uploads/')) fs.unlinkSync(file.url);
    await file.deleteOne();
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// Admin: Delete course and its files
app.delete('/admin/delete-course/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const files = await File.find({ course: course.name });
    for (const file of files) {
      if (file.url.startsWith('uploads/')) fs.unlinkSync(file.url);
      await file.deleteOne();
    }

    await course.deleteOne();
    res.json({ message: 'Course and files deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting course' });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
