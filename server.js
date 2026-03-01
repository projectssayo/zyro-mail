import express from "express";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

const app = express();
app.use(express.json());

// =====================================================
// 🔹 MONGODB CONNECTION
// =====================================================
const PORT = process.env.PORT || 7444;

const url =
  "mongodb+srv://projectssayo_db_user:1234@test.mdv08ad.mongodb.net/?retryWrites=true&w=majority&appName=test";

const client = new MongoClient(url, {
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 3000,
  socketTimeoutMS: 3000,
});

await client.connect();
console.log("MongoDB Connected ✅");

// Databases
const otp_db = client.db("otp_db");
const user_db = client.db("users_db");

// Collections
const otp_table = otp_db.collection("verify_otp");
const user_table = user_db.collection("user_info");
const remember_me_table = user_db.collection("remember_me");
const logged_in_table = user_db.collection("logged_in");

// =====================================================
// 🔹 GMAIL SMTP SETUP
// =====================================================
// ⚠️ Use Gmail App Password (NOT real password)

const sender_email = "projects.sayo@gmail.com";
const sender_password = "qwkt wfrd mmon soeg";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: sender_email,
    pass: sender_password,
  },
});

// =====================================================
// 🔹 SEND OTP ROUTE
// =====================================================

app.get("/send_otp", async (req, res) => {
  try {
    const { email, mac_id } = req.query;

    if (!email || !mac_id) {
      return res.status(400).json({
        success: false,
        message: "Email and mac_id required",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    const data = {
      _id: email,
      otp: otp,
      mac_id: mac_id,
      sent_at: new Date(),
    };

    // Upsert OTP
    await otp_table.updateOne(
      { _id: email },
      { $set: data },
      { upsert: true }
    );

    console.log("OTP Stored:", data);

    // =====================================================
    // 🔹 HTML EMAIL TEMPLATE
    // =====================================================

    const html_message = `
    <html>
    <body style="margin:0; padding:0; background-color:#f2f4f7; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f4f7; padding:20px 0;">
    <tr>
    <td align="center">
    <table width="100%" cellpadding="0" cellspacing="0"
           style="max-width:600px; background:#ffffff; border-radius:10px; overflow:hidden;">

        <tr>
            <td style="padding:35px 25px; text-align:center;">
                <h2 style="color:#2c3e50;">Verify Your Email Address</h2>
                <p style="color:#555; font-size:14px;">
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

                <p style="margin-top:20px; font-size:13px; color:#777;">
                    This OTP is valid for 5 minutes.
                </p>
            </td>
        </tr>

        <tr>
            <td style="border-top:1px solid #e5e5e5; padding:15px; text-align:center; font-size:12px; color:#999;">
                © 2026 sayoLabs. All rights reserved.
            </td>
        </tr>

    </table>
    </td>
    </tr>
    </table>
    </body>
    </html>
    `;

    // Send Email
    await transporter.sendMail({
      from: sender_email,
      to: email,
      subject: "Your OTP Code",
      html: html_message,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================================
// 🔹 START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log("Server running on port 7444 🚀");
});
