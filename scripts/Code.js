// ============================================
// LOOMI NEWSLETTER & APP STORE WELCOME SYSTEM
// Complete Google Apps Script
// Updated: May 2026 — App Store launch, post-TestFlight
//
// IMPORTANT: After updating this file in the repo, redeploy via clasp
// or the Apps Script editor for live email behaviour to change.
// ============================================

// Replace __APP_STORE_URL__ with the live App Store URL at launch.
var APP_STORE_LINK = "__APP_STORE_URL__";

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

    // Send welcome email — App Store install CTA, no TestFlight onboarding
    sendUserConfirmation(data.parent_name, data.email);

    output.setContent(JSON.stringify({
      'result': 'success',
      'message': 'Thanks for subscribing!'
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
  return ContentService.createTextOutput("Loomi Newsletter API is running!");
}

// Send notification email to team about new signup
function sendEmailNotification(parentName, email) {
  var recipient = "hello@loomi.kids";
  var subject = "New Loomi Newsletter Signup!";
  var body = "New signup:\n\n" +
             "Parent: " + parentName + "\n" +
             "Email: " + email + "\n\n" +
             "View all signups: " + SpreadsheetApp.getActiveSpreadsheet().getUrl();

  GmailApp.sendEmail(recipient, subject, body, {
    from: "hello@loomi.kids",
    name: "Loomi Newsletter"
  });
}

// ============================================
// EMAIL: Welcome to Loomi (App Store install)
// Sent automatically on newsletter signup
// ============================================
function sendUserConfirmation(parentName, email) {
  var subject = "Welcome to Loomi";

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
          <td align="center" style="padding: 40px 20px; background: linear-gradient(to bottom, #0a0e1f 0%, #141b2d 50%, #1a2332 100%); background-color: #0a0e1f;">
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
                    Thanks for subscribing to Loomi &#127769;<br>
                    We'll send you product updates and the occasional bedtime drop.
                  </p>

                  <p style="color: #a5b4fc; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                    Loomi is now on the App Store. Tap below to install.
                  </p>

                  <!-- App Store CTA -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="center" style="padding: 8px 0 16px;">
                        <a href="${APP_STORE_LINK}" style="display: inline-block; line-height: 0; text-decoration: none;">
                          <img src="https://www.loomi.kids/assets/app-store-badge.svg" alt="Download on the App Store" height="56" style="height: 56px; width: auto; display: block;">
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Sign-off -->
              <tr>
                <td style="padding: 20px 40px 40px;">
                  <p style="color: #a5b4fc; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Once you've installed Loomi, sign in with your Apple ID, set up your child's profile, and pick your first story. If anything feels confusing, just reply to this email &#8212; we'll personally help you through it.
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
                        <span style="color: #8b9dc3; font-size: 13px; margin-left: 8px; vertical-align: middle;">Loomi: The art &amp; science of calm &amp; confident kids</span>
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
                  "Thanks for subscribing to Loomi 🌙 We'll send you product updates and the occasional bedtime drop.\n\n" +
                  "Loomi is now on the App Store. Tap below to install:\n" +
                  APP_STORE_LINK + "\n\n" +
                  "Once you've installed Loomi, sign in with your Apple ID, set up your child's profile, and pick your first story. If anything feels confusing, just reply to this email — we'll personally help you through it.\n\n" +
                  "Sweet dreams,\n" +
                  "The Loomi Team\n\n" +
                  "---\n" +
                  "Loomi: The art & science of calm & confident kids\n" +
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
