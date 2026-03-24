const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Import routes
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const accountingRoutes = require('./routes/accounting');
const teacherPaymentRoutes = require('./routes/teacherPayments');

const userRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/teacher-payments', teacherPaymentRoutes);

app.use('/api/users', userRoutes);

module.exports = app;
