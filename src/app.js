const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check (Independent of Prisma)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'EDUSOFT-API', version: '1.5.0-SAAS' });
});

// Import routes (Prisma is lazy-loaded inside context.js used by these routes)
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const accountingRoutes = require('./routes/accounting');
const teacherPaymentRoutes = require('./routes/teacherPayments');
const userRoutes = require('./routes/users');
const establishmentRoutes = require('./routes/establishments');
const gradeRoutes = require('./routes/grades');

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/establishments', establishmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/teacher-payments', teacherPaymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grades', gradeRoutes);

module.exports = app;
