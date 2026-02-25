// ============================================
// LOOMI WAITLIST & TESTFLIGHT EMAIL SYSTEM
// Complete Google Apps Script
// Updated: Feb 2026 - Single-email flow with public TestFlight link
// ============================================

// Install page handles device detection and redirects iOS to TestFlight
var TESTFLIGHT_PUBLIC_LINK = "https://www.loomi.kids/install";

// Handle form submissions from landing page
function doPost(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Honeypot check - if filled, it's a bot
    if (data.website) {
      output.setContent(JSON.stringify({
        'result': 'error',
        'message': 'Bot detected'
      }));
      return output;
    }

    var timestamp = new Date();

    // Append row with data
    sheet.appendRow([
      timestamp,
      data.parent_name,
      data.email,
      data.child_age,
      data.language,
      data.source || 'landing_page'
    ]);

    // Send email notification to owner
    sendEmailNotification(data.parent_name, data.email);

    // Send welcome email with public TestFlight link
    sendUserConfirmation(data.parent_name, data.email);

    output.setContent(JSON.stringify({
      'result': 'success',
      'message': 'Thank you for joining our waitlist!'
    }));
    return output;

  } catch (error) {
    output.setContent(JSON.stringify({
      'result': 'error',
      'message': error.toString()
    }));
    return output;
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  return ContentService.createTextOutput("Loomi Waitlist API is running!");
}

// Send notification email to team about new signup
function sendEmailNotification(parentName, email) {
  var recipient = "hello@loomi.kids";
  var subject = "New Loomi Waitlist Signup!";
  var body = "New signup:\n\n" +
             "Parent: " + parentName + "\n" +
             "Email: " + email + "\n\n" +
             "View all signups: " + SpreadsheetApp.getActiveSpreadsheet().getUrl();

  GmailApp.sendEmail(recipient, subject, body, {
    from: "hello@loomi.kids",
    name: "Loomi Waitlist"
  });
}

// ============================================
// EMAIL: Welcome + Install Loomi (Public Link)
// Sent automatically on waitlist signup
// ============================================
function sendUserConfirmation(parentName, email) {
  var subject = "Welcome to Loomi - install it now!";

  var htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0e1f; font-family: 'Fredoka', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0e1f;">
        <tr>
          <td align="center" style="padding: 40px 20px; background: url('https://www.loomi.kids/assets/starfield-tile-transparent.png') repeat, linear-gradient(to bottom, #0a0e1f 0%, #141b2d 50%, #1a2332 100%); background-color: #0a0e1f;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background: rgba(10, 14, 31, 0.65); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.08);">

              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding: 40px 40px 30px;">
                  <img src="https://www.loomi.kids/assets/loomi-logo-header.png" alt="Loomi" width="120" style="display: block;">
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 0 40px;">
                  <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 20px; text-align: center;">
                    Hi ${parentName}!
                  </h1>

                  <p style="color: #a5b4fc; font-size: 18px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                    Thank you for signing up for Loomi &#127769;<br>
                    You're in &#8212; let's get you set up.
                  </p>

                  <p style="color: #a5b4fc; font-size: 16px; line-height: 1.6; margin: 0 0 25px;">
                    Loomi is in early beta, so we share it through Apple's <span style="color: #f4a460;">TestFlight</span> app. The good news? It only takes one tap to install.
                  </p>

                  <!-- Primary CTA Box -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="background: rgba(244, 164, 96, 0.1); border: 1px solid rgba(244, 164, 96, 0.3); border-radius: 16px; padding: 25px; text-align: center;">
                        <p style="color: #ffffff; font-size: 18px; font-weight: 600; line-height: 1.7; margin: 0 0 15px;">
                          &#128073; Tap below to install Loomi
                        </p>
                        <p style="color: #a5b4fc; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                          This link opens TestFlight and installs Loomi directly.
                        </p>
                        <a href="${TESTFLIGHT_PUBLIC_LINK}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #8b5cf6 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 30px;">Install Loomi</a>
                      </td>
                    </tr>
                  </table>

                  <!-- TestFlight note -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                    <tr>
                      <td style="background: rgba(167, 139, 250, 0.1); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 10px; padding: 12px 16px;">
                        <p style="color: #ffffff; font-size: 13px; font-weight: 600; line-height: 1.5; margin: 0 0 6px;">
                          Don't have TestFlight yet?
                        </p>
                        <p style="color: #a5b4fc; font-size: 13px; line-height: 1.6; margin: 0;">
                          No worries &#8212; when you tap the link above, you'll be prompted to download TestFlight first (it's free from Apple). Then tap the link again and Loomi will install.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- What to do after install -->
              <tr>
                <td style="padding: 30px 40px 0;">
                  <h2 style="color: #ffffff; font-size: 20px; font-weight: 500; margin: 0 0 20px;">
                    Once Loomi is installed:
                  </h2>

                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="padding: 10px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="color: #f4a460; font-size: 16px; padding-right: 12px; vertical-align: top;">&#10024;</td>
                            <td style="color: #a5b4fc; font-size: 16px; line-height: 1.6;">Sign in with your Apple ID</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="color: #f4a460; font-size: 16px; padding-right: 12px; vertical-align: top;">&#10024;</td>
                            <td style="color: #a5b4fc; font-size: 16px; line-height: 1.6;">Create your child's profile (takes ~1 minute)</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <table role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="color: #f4a460; font-size: 16px; padding-right: 12px; vertical-align: top;">&#10024;</td>
                            <td style="color: #a5b4fc; font-size: 16px; line-height: 1.6;">Choose your first story &#127769;</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Feedback request -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 25px;">
                    <tr>
                      <td style="background: rgba(167, 139, 250, 0.15); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 16px; padding: 20px; text-align: center;">
                        <p style="color: #ffffff; font-size: 15px; line-height: 1.7; margin: 0;">
                          After your first listen, we'd love your honest feedback &#8212; what worked, what didn't, and how your child responded. <span style="color: #f4a460;">This is shaping the product in real time.</span>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Sign-off -->
              <tr>
                <td style="padding: 30px 40px 40px;">
                  <p style="color: #a5b4fc; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    If anything feels confusing, just reply to this email and we'll personally help you through it.
                  </p>

                  <p style="color: #ffffff; font-size: 18px; margin: 0;">
                    Sweet dreams,<br>
                    <span style="color: #f4a460;">The Loomi Team</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding-bottom: 12px;">
                        <img src="https://www.loomi.kids/apple-touch-icon.png" alt="Loomi" width="24" height="24" style="display: inline-block; vertical-align: middle; border-radius: 6px;">
                        <span style="color: #8b9dc3; font-size: 13px; margin-left: 8px; vertical-align: middle;">Loomi &#8211; The science of calm &amp; confident kids</span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <p style="color: #6b7a99; font-size: 12px; margin: 0; line-height: 1.5;">
                          &#169; 2026 Loomi. Built with &#10084;&#65039; by 3 brothers and dads for parents seeking peaceful bedtimes.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 12px;">
                        <a href="https://www.loomi.kids" style="color: #8b9dc3; font-size: 12px; text-decoration: none;">www.loomi.kids</a>
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

  var plainBody = "Hi " + parentName + "!\n\n" +
                  "Thank you for signing up for Loomi 🌙 You're in — let's get you set up.\n\n" +
                  "Loomi is in early beta, so we share it through Apple's TestFlight app. The good news? It only takes one tap to install.\n\n" +
                  "👉 Tap this link to install Loomi:\n" +
                  TESTFLIGHT_PUBLIC_LINK + "\n\n" +
                  "This link opens TestFlight and installs Loomi directly.\n\n" +
                  "Don't have TestFlight yet? No worries — when you tap the link, you'll be prompted to download TestFlight first (it's free from Apple). Then tap the link again and Loomi will install.\n\n" +
                  "Once Loomi is installed:\n" +
                  "✨ Sign in with your Apple ID\n" +
                  "✨ Create your child's profile (takes ~1 minute)\n" +
                  "✨ Choose your first story 🌙\n\n" +
                  "After your first listen, we'd love your honest feedback — what worked, what didn't, and how your child responded. This is shaping the product in real time.\n\n" +
                  "If anything feels confusing, just reply to this email and we'll personally help you through it.\n\n" +
                  "Sweet dreams,\n" +
                  "The Loomi Team\n\n" +
                  "---\n" +
                  "Loomi – The science of calm & confident kids\n" +
                  "© 2026 Loomi. Built with love by 3 brothers and dads for parents seeking peaceful bedtimes.\n" +
                  "www.loomi.kids";

  GmailApp.sendEmail(email, subject, plainBody, {
    htmlBody: htmlBody,
    from: "hello@loomi.kids",
    name: "Loomi"
  });
}


// ============================================
// SPREADSHEET MENU
// ============================================

// Add a custom menu when the spreadsheet opens
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🌙 Loomi')
    .addItem('Send Welcome Email to Selected Rows', 'sendWelcomeToSelectedRows')
    .addItem('Send Welcome Email to All Unsent', 'sendWelcomeToAllUnsent')
    .addSeparator()
    .addItem('Mark Selected as Welcome Sent', 'markSelectedAsWelcomeSent')
    .addToUi();
}

// ============================================
// MANUAL WELCOME EMAIL SENDING
// ============================================

// Send welcome email to currently selected rows
function sendWelcomeToSelectedRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var startRow = selection.getRow();
  var numRows = selection.getNumRows();

  if (startRow === 1) {
    startRow = 2;
    numRows = numRows - 1;
  }

  var sentCount = 0;
  var skippedCount = 0;

  for (var i = 0; i < numRows; i++) {
    var row = startRow + i;
    var parentName = sheet.getRange(row, 2).getValue();  // Column B
    var email = sheet.getRange(row, 3).getValue();        // Column C
    var welcomeSent = sheet.getRange(row, 8).getValue();  // Column H

    // Skip if already sent or no email
    if (!email || welcomeSent) {
      skippedCount++;
      continue;
    }

    sendUserConfirmation(parentName, email);

    // Mark as sent with timestamp in Column H
    sheet.getRange(row, 8).setValue(new Date());
    sentCount++;

    Utilities.sleep(500);
  }

  SpreadsheetApp.getUi().alert(
    '✅ Welcome Emails Sent!\n\n' +
    'Sent: ' + sentCount + '\n' +
    'Skipped (already sent or no email): ' + skippedCount
  );
}

// Send welcome email to ALL rows that haven't received it yet
function sendWelcomeToAllUnsent() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Send Welcome Emails',
    'This will send the Welcome email to ALL signups who haven\'t received one yet. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var sentCount = 0;

  for (var row = 2; row <= lastRow; row++) {
    var parentName = sheet.getRange(row, 2).getValue();
    var email = sheet.getRange(row, 3).getValue();
    var welcomeSent = sheet.getRange(row, 8).getValue();  // Column H

    if (!email || welcomeSent) {
      continue;
    }

    sendUserConfirmation(parentName, email);
    sheet.getRange(row, 8).setValue(new Date());
    sentCount++;

    Utilities.sleep(500);
  }

  ui.alert('✅ Done! Sent ' + sentCount + ' Welcome emails.');
}

// Mark selected rows as welcome email already sent
function markSelectedAsWelcomeSent() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var selection = sheet.getActiveRange();
  var startRow = selection.getRow();
  var numRows = selection.getNumRows();

  if (startRow === 1) {
    startRow = 2;
    numRows = numRows - 1;
  }

  for (var i = 0; i < numRows; i++) {
    var row = startRow + i;
    sheet.getRange(row, 8).setValue(new Date());
  }

  SpreadsheetApp.getUi().alert('✅ Marked ' + numRows + ' rows as Welcome email sent.');
}

// Test welcome email
function testWelcomeEmail() {
  sendUserConfirmation("Test Parent", "shahinz@mac.com");
}
