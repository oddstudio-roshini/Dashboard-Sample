package com.medicare.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@arthomove.com}")
    private String fromEmail;

    /**
     * Sends a "Set Your Password" email to a newly created doctor.
     * If email sending fails (e.g. no SMTP configured), it logs the setup link
     * so the admin can share it manually.
     */
    public void sendPasswordSetupEmail(String toEmail, String doctorName, String token) {
        String setupLink = frontendUrl + "/setup-password?token=" + token;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("ARthoMove — Set Up Your Doctor Account Password");
            helper.setText(buildEmailBody(doctorName, setupLink), true);

            mailSender.send(message);
            log.info("Password setup email sent to {}", toEmail);

        } catch (Exception e) {
            // Email sending failed (SMTP not configured, etc.)
            // Log the link so admin can share it manually
            log.warn("Email sending failed for {}. Share this link manually: {}", toEmail, setupLink);
        }
    }

    private String buildEmailBody(String doctorName, String setupLink) {
        return """
            <!DOCTYPE html>
            <html>
            <body style="margin:0;padding:0;background:#f5f6fa;font-family:Arial,sans-serif;">
              <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                <!-- Header -->
                <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">ARthoMove</h1>
                  <p style="color:#c4b5fd;margin:6px 0 0;font-size:14px;">Doctor Portal</p>
                </div>

                <!-- Body -->
                <div style="padding:36px 40px;">
                  <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hello, <strong>Dr. %s</strong></p>
                  <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 28px;">
                    Your doctor account has been created on the ARthoMove platform.
                    Please click the button below to set up your password and activate your account.
                  </p>

                  <!-- CTA Button -->
                  <div style="text-align:center;margin:28px 0;">
                    <a href="%s"
                       style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;
                              font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;">
                      Set Up My Password
                    </a>
                  </div>

                  <p style="color:#9ca3af;font-size:12px;text-align:center;margin:20px 0 0;">
                    This link expires in 48 hours. If you did not request this, contact your admin.
                  </p>

                  <!-- Fallback link -->
                  <div style="background:#f9fafb;border-radius:8px;padding:12px 16px;margin:20px 0 0;">
                    <p style="color:#6b7280;font-size:11px;margin:0 0 4px;">Or copy this link:</p>
                    <p style="color:#7c3aed;font-size:11px;word-break:break-all;margin:0;">%s</p>
                  </div>
                </div>

                <!-- Footer -->
                <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;">
                    © ARthoMove · Admin Portal · Do not reply to this email.
                  </p>
                </div>
              </div>
            </body>
            </html>
            """.formatted(doctorName, setupLink, setupLink);
    }
}
