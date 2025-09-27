// Module Imports
const cron = require("node-cron");
const pool = require("./config/db");
const transporter = require("./config/mailer");

// ===================
// Automatic Cleanup for Expired Bookings
// ===================
cron.schedule("0 0 * * *", async () => {
    try {
      const expiredBookingsResults = await pool.query(`
        SELECT b.id, b.destination, b.travel_date, u.email, u.fullname
        FROM bookings b
        INNER JOIN users u ON b.user_id = u.id
        WHERE b.travel_date < CURRENT_DATE
      `);

      if (expiredBookingsResults.rows.length > 0) {
        for (const expiredBooking of expiredBookingsResults.rows) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: expiredBooking.email,
            subject: "Your Booking Has Expired",
            html: `
              <p>Hi ${expiredBooking.fullname},</p>
              <p>Your booking for <strong>${expiredBooking.destination}</strong> scheduled on <strong>${new Date(expiredBooking.travel_date).toLocaleDateString()}</strong> has expired and has been removed from our system.</p>
              <p>We hope we were helpful to you.
              <p>Contact us at info@aictp.com.ng for more enquiries. Thanks!</p>
              <p>– AICTP Logistics Team</p>
            `,
          });
        }

        await pool.query("DELETE FROM bookings WHERE travel_date < CURRENT_DATE");
        console.log(`[Cleanup Job] Deleted ${expiredBookingsResults.rows.length} expired bookings and notified users.`);
      }
    } catch (err) {
      console.error("[Cleanup Job] Error deleting expired bookings:", err);
    }
});
module.exports = cron;