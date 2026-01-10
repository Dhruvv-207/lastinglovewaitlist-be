const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lasting-loves-waitlist')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Waitlist Model
const waitlistSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'pending' }
});

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

// Email Transporter (Placeholder for Resend/SendGrid)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.post('/api/waitlist/join', async (req, res) => {
    const { email, name } = req.body;

    try {
        const existing = await Waitlist.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'You are already on the waitlist!' });
        }

        const newUser = new Waitlist({ email, name });
        await newUser.save();

        // Email Transporter (Updated for better production reliability)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to the Legacy | Lasting Loves Waitlist',
            text: `Hi ${name || 'there'},\n\nThank you for joining the Lasting Loves waitlist. We'll let you know as soon as we're ready to launch!\n\nBest,\nThe Lasting Loves Team`
        };

        // Send email asynchronously and don't block the response
        transporter.sendMail(mailOptions).catch(err => {
            console.error('Email sending failed:', err.message);
        });

        res.status(201).json({ message: 'Success! You are on the list.' });
    } catch (error) {
        console.error('Waitlist Join Error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
});

app.get('/api/waitlist/count', async (req, res) => {
    try {
        const count = await Waitlist.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching count' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

