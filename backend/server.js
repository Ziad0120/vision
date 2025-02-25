const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000; // استخدام متغير البيئة أو المنفذ 5000

// Middleware
app.use(cors()); // السماح لجميع الطلبات من أي مصدر
app.use(bodyParser.json());

// خدمة الملفات الثابتة من مجلد frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// الاتصال بقاعدة البيانات MongoDB Atlas
const uri = "mongodb+srv://ziadm8445:1234@cluster0.gicfr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

// تعريف نموذج المستخدم
const userSchema = new mongoose.Schema({
  name: String,
  password: Number,
  details: [{
    exam: String,
    points: Number,
    total: Number,
  }],
});

const User = mongoose.model('User', userSchema);

// API Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html')); // إرسال ملف index.html عند زيارة المسار الرئيسي
});

// الحصول على جميع المستخدمين
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ password: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// الحصول على مستخدم بالاسم
app.get('/api/users/:name', async (req, res) => {
  try {
    const user = await User.findOne({ name: req.params.name });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إضافة مستخدم جديد
app.post('/api/users', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Name and password are required" });
  }

  const user = new User({
    name,
    password,
    details: [],
  });

  try {
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// تعديل مستخدم بالاسم
app.put('/api/users/:name', async (req, res) => {
  const { name } = req.params;
  const { newName, password } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (newName) user.name = newName;
    if (password) user.password = password;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// حذف مستخدم بالاسم
app.delete('/api/users/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const user = await User.findOneAndDelete({ name });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// إضافة تفاصيل للمستخدم بالاسم
app.post('/api/users/:name/details', async (req, res) => {
  const { name } = req.params;
  const { exam, points, total } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.details.push({ exam, points, total });
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// تعديل تفاصيل المستخدم بالاسم
app.put('/api/users/:name/details/:detailId', async (req, res) => {
  const { name, detailId } = req.params;
  const { exam, points, total } = req.body;

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const detail = user.details.id(detailId);
    if (!detail) {
      return res.status(404).json({ message: "Detail not found" });
    }

    if (exam) detail.exam = exam;
    if (points) detail.points = points;
    if (total) detail.total = total;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// حذف تفاصيل المستخدم بالاسم
app.delete('/api/users/:name/details/:detailId', async (req, res) => {
  const { name, detailId } = req.params;

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.details.id(detailId).remove();
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});