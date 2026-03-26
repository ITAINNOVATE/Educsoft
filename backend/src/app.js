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

const { prisma } = require('./context');

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.get('/api/health-db', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'OK', database: 'Connected' });
    } catch (error) {
        console.error("DB Health Check Failed:", error);
        res.status(500).json({ status: 'ERROR', message: error.message, stack: error.stack });
    }
});

// Import routes
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const studentRoutes = require('./routes/students');
const paymentRoutes = require('./routes/payments');
const accountingRoutes = require('./routes/accounting');
const teacherPaymentRoutes = require('./routes/teacherPayments');

const userRoutes = require('./routes/users');
const establishmentRoutes = require('./routes/establishments');

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/teacher-payments', teacherPaymentRoutes);

app.use('/api/users', userRoutes);
app.use('/api/establishments', establishmentRoutes);

module.exports = app;
