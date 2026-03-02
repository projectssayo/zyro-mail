import express from "express";
import nodemailer from "nodemailer";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection - using environment variable
const url = process.env.MONGODB_URL;

const client = new MongoClient(url, {
    serverSelectionTimeoutMS: 3000,
    connectTimeoutMS: 3000,
    socketTimeoutMS: 3000
});

// Create databases and collections
const otp_db = client.db("otp_db");
const otp_table = otp_db.collection("verify_otp");

const user_db = client.db("users_db");
const user_table = user_db.collection("user_info");
const remember_me_table = user_db.collection("remember_me");
const logged_in_table = user_db.collection("logged_in");

// Connect to MongoDB
try {
    await client.connect();
    console.log("✅ Connected to MongoDB successfully");
} catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
}

// SMTP setup - using environment variables
const sender_email = process.env.SENDER_EMAIL;
const sender_password = process.env.SENDER_PASSWORD;

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: sender_email,
        pass: sender_password,
    },
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        "status": "Connected to MongoDB successfully",
        "/send_otp": `http://127.0.0.1:${PORT}/send_otp?email=user@example.com&mac_id=82c6395286be`,
        "/check_otp": `http://127.0.0.1:${PORT}/check_otp?email=user@example.com&mac_id=82c6395286be&input_otp=306741`,
        "/set_remember_me": `http://127.0.0.1:${PORT}/set_remember_me?mac_id=82c6395286be&remember_me=1&email=user@example.com`,
        "/remember_me": `http://127.0.0.1:${PORT}/remember_me?email=user@example.com&mac_id=82c6395286be`,
        "/check_exists": `http://127.0.0.1:${PORT}/check_exists?email=user@example.com`,
        "/create_account": `http://127.0.0.1:${PORT}/create_account?name=s&email=user@example.com&password=123&remember_me=true&square_pfp=http://res.cloudinary.com/image.png&circle_pfp=http://res.cloudinary.com/image.png&mac_id=b57365813414`,
        "/reset_password": `http://127.0.0.1:${PORT}/reset_password?email=user@example.com&password=123456`,
        "/login": `http://127.0.0.1:${PORT}/login?email=user@example.com&password=123&mac_id=172382053270683&remember_me=True`
    });
});

// Send OTP endpoint
app.get("/send_otp", async (req, res) => {
    try {
        const { email, mac_id } = req.query;
        
        // Validate input
        if (!email || !mac_id) {
            return res.status(400).json({ 
                "message": "Email and MAC ID are required", 
                "success": false 
            });
        }
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        
        // Create data object
        const data = {
            "_id": email,
            "otp": otp,
            "mac_id": mac_id,
            "sent_at": new Date()
        };
        
        // Update with upsert
        await otp_table.updateOne(
            { "_id": email },
            { "$set": data },
            { upsert: true }
        );
        
        console.log("📤 OTP Data:", data);
        
        // HTML email template
        const html_message = `
<html>
<body style="margin:0; padding:0; background-color:#f2f4f7; font-family: Arial, Helvetica, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7; padding:20px 0;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
       style="max-width:600px; background:#ffffff; border-radius:10px; overflow:hidden;">

    <!-- Top Banner -->
    <tr>
        <td align="center">
            <img src="https://res.cloudinary.com/dnssyb7hu/image/upload/v1771342930/oik7ztbt79ykygpaoewx.png"
                 width="100%"
                 style="display:block; max-width:600px; height:auto;">
        </td>
    </tr>

    <!-- Main Content -->
    <tr>
        <td style="padding:35px 25px; text-align:center;">

            <h2 style="color:#2c3e50; margin:0 0 15px 0;">
                Verify Your Email Address
            </h2>

            <p style="color:#555555; font-size:14px; margin:0 0 25px 0;">
                Use the One-Time Password below to complete verification.
            </p>

            <div style="display:inline-block;
                        background:#f0f4f8;
                        padding:18px 35px;
                        border-radius:8px;
                        font-size:28px;
                        font-weight:bold;
                        letter-spacing:6px;
                        color:#1f4e79;">
                ${otp}
            </div>

            <p style="margin:25px 0 0 0; font-size:13px; color:#777777;">
                This OTP is valid for 5 minutes.
            </p>

            <p style="margin:15px 0 0 0; font-size:12px; color:#999999;">
                If you didn’t request this, you can safely ignore this email.
            </p>

        </td>
    </tr>

    <!-- Divider -->
    <tr>
        <td style="border-top:1px solid #e5e5e5;"></td>
    </tr>

    <!-- Footer -->
    <tr>
        <td style="padding:20px;">

            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>

                    <!-- Logo -->
                    <td width="30%" align="left" style="vertical-align:top;">
                        <img src="https://res.cloudinary.com/dnssyb7hu/image/upload/v1771343726/ev1pgoriwsaixlkmhr1i.png"
                             width="110"
                             style="display:block; max-width:110px; height:auto;">
                    </td>

                    <!-- Footer Text -->
                    <td width="70%" align="right"
                        style="vertical-align:top; font-size:11px; line-height:14px; color:#8a8a8a;">

                        <div style="margin:0;">
                            Please do not reply directly to this email.
                        </div>

                        <div style="margin:0;">
                            © 2026 sayoLabs. All rights reserved.
                        </div>

                        <div style="margin:0;">
                            <a href="https://projectssayo.github.io/a/"
                               style="color:#8a8a8a; text-decoration:none;">
                               Contact Us
                            </a> |
                            <a href="https://projectssayo.github.io/b/"
                               style="color:#8a8a8a; text-decoration:none;">
                               Terms
                            </a> |
                            <a href="https://projectssayo.github.io/b/"
                               style="color:#8a8a8a; text-decoration:none;">
                               Privacy
                            </a>
                        </div>

                    </td>

                </tr>
            </table>

        </td>
    </tr>
</table>

</td>
</tr>
</table>

</body>
</html>
`;

        // Send email
        await transporter.sendMail({
            from: sender_email,
            to: email,
            subject: "Your OTP Code",
            html: html_message
        });

        console.log(`📧 OTP ${otp} sent to ${email}`);
        
        return res.json({ 
            "message": "OTP sent successfully", 
            "success": true 
        });

    } catch (error) {
        console.error("❌ Error:", error);
        
        // Check for MongoDB timeout error
        if (error.name === 'MongoServerSelectionError' || error.message.includes('timed out')) {
            return res.json({ 
                "success": false, 
                "message": "Server selection timeout, internet nahi hai gareeb bc" 
            });
        }
        
        // Check for email auth error
        if (error.code === 'EAUTH') {
            return res.json({ 
                "success": false, 
                "message": "Email authentication failed. Check your .env credentials." 
            });
        }
        
        return res.json({ 
            "message": error.message, 
            "success": false 
        });
    }
});

// Check OTP endpoint
app.get("/check_otp", async (req, res) => {
    try {
        const { email, mac_id, input_otp } = req.query;
        
        const a = await otp_table.findOne({ "_id": email });
        
        console.log("📥 Retrieved from DB:", a);
        
        if (!a) {
            return res.json({ 
                "message": "GAND mara tera se galti hui hai otp bhejne main bcz _id me email exist hi naih karti ", 
                "success": false 
            });
        }
        
        const timeDiff = (new Date() - a.sent_at) / 1000; // Convert to seconds
        console.log("⏱️ Time elapsed:", timeDiff, "seconds");
        
        if (timeDiff > 600) {  // 600 seconds = 10 minutes
            return res.json({ 
                "message": "OTP is has been expired. Retry with new", 
                "success": false 
            });
        }
        
        if (a.otp.toString() === input_otp.toString() && a.mac_id.toString() === mac_id.toString()) {
            return res.json({ 
                "message": "OTP verifed successfully", 
                "success": true 
            });
        }
        
        return res.json({ 
            "success": false, 
            "data": "wrong otp or try again" 
        });
        
    } catch (error) {
        if (error.name === 'MongoServerSelectionError') {
            return res.json({ 
                "success": false, 
                "message": "Server selection timeout, internet nahi hai gareeb bc" 
            });
        }
        return res.json({ 
            "message": error.message, 
            "success": false 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Email configured for: ${sender_email}`);
    console.log(`💾 MongoDB: Connected to otp_db and users_db`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    if (client) {
        await client.close();
        console.log('👋 MongoDB connection closed');
    }
    process.exit(0);
});
