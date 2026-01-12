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
mongoose.connect(process.env.MONGODB_URI)
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

// Email Transporter (Optimized for Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
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

        // Premium HTML Email Template
        const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
                .header { background: #cba150; padding: 40px 20px; text-align: center; }
                .logo-text { color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
                .content { padding: 40px; text-align: center; }
                .welcome-text { font-size: 24px; color: #0f172a; margin-bottom: 20px; font-weight: 600; }
                .body-text { font-size: 16px; color: #475569; margin-bottom: 30px; }
                .divider { height: 1px; background: #e2e8f0; margin: 30px 0; }
                .mantra { font-family: 'Georgia', serif; font-style: italic; color: #cba150; font-size: 18px; margin-bottom: 10px; }
                .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #94a3b8; }
                .btn { display: inline-block; padding: 14px 28px; background: #cba150; color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 class="logo-text">Lasting Loves</h1>
                </div>
                <div class="content">
                    <h2 class="welcome-text">Welcome to the Legacy</h2>
                    <p class="body-text">Hi ${name || 'there'},</p>
                    <p class="body-text">Thank you for joining our exclusive early access waitlist. You've just taken the first step toward bridging the gap between generations and preserving your unique voice forever.</p>
                    <div class="mantra">"Keep their spirit alive."</div>
                    <div class="divider"></div>
                    <p class="body-text">We'll reach out to you personally as soon as we're ready to invite you into the inner circle.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Lasting Loves. All rights reserved.</p>
                    <p>Designed with love for the memories that matter.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Lasting Loves" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to the Legacy | Lasting Loves Waitlist',
            text: `Hi ${name || 'there'},\n\nThank you for joining the Lasting Loves waitlist. We'll let you know as soon as we're ready to launch!\n\nBest,\nThe Lasting Loves Team`,
            html: emailTemplate
        };

        // Send email (Must await in Vercel/Serverless environment)
        try {
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully to:', email);
        } catch (emailError) {
            console.log('Email user:', process.env.EMAIL_USER);
            console.log('Email pass:', process.env.EMAIL_PASS);
            console.error('Email sending failed:', emailError.message);
        }

        res.status(201).json({ message: 'Success! You are on the list.' });
    } catch (error) {
        console.error('Waitlist Join Error:', error);
        res.status(500).json({ message: 'Something went wrong. Please try again.' });
    }
});

app.get('/api/waitlist/count', async (req, res) => {
    try {
        console.log('Fetching waitlist count...');
        const count = await Waitlist.countDocuments();
        console.log('Waitlist count:', count);
        res.json({ count });
    } catch (error) {
        console.error('Count Error:', error);
        res.status(500).json({ message: 'Error fetching count', error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Lasting Loves Waitlist Backend is Running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

