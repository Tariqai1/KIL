import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Aapki Env Settings (Hardcoded for now based on your message)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = "itsoft404@gmail.com"
SENDER_PASSWORD = "fagbpflegfwegswk" # ⚠️ Real App me isay .env file se lein

def send_otp_email(to_email: str, otp: str):
    """
    Sends a 6-digit OTP to the user's email.
    """
    try:
        # Email Content
        subject = "Password Reset OTP - Library System"
        body = f"""
        <html>
            <body>
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>Use the following OTP to reset your password:</p>
                    <h1 style="color: #10b981; letter-spacing: 5px;">{otp}</h1>
                    <p>This OTP is valid for <b>10 minutes</b>.</p>
                    <p>If you did not request this, please ignore this email.</p>
                </div>
            </body>
        </html>
        """

        # Setup Message
        msg = MIMEMultipart()
        msg['From'] = SENDER_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))

        # Send Email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()  # Secure Connection
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False