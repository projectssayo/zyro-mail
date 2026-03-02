@app.get("/send_otp")
def send_otp(email : str, mac_id : str):
    try:
        otp=random.randint(100_000,999_999)

        data = {"_id" : email,"otp" : otp,"mac_id" : mac_id,"sent_at" : datetime.datetime.now()}

        otp_table.update_one(
            {"_id": email},
            {"$set": data},
            upsert=True
        )
        print(data)
        sender_email = "projects.sayo@gmail.com"
        sender_password = "qwkt wfrd mmon soeg"

        html_message =f"""

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
                {otp}
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

                    <!-- Footer Text (Tight Spacing) -->
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

"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your OTP Code"
        msg["From"] = sender_email
        msg["To"] = email
        msg.attach(MIMEText(html_message, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email,sender_password)
            server.send_message(msg)

        return {"message": "OTP sent successfully", "success" : True}
    except ServerSelectionTimeoutError:
        return {"success": False, "message": "Server selection timeout, internet nahi hai gareeb bc"}
    except Exception as e:
        return {"message": str(e), "success": False}
