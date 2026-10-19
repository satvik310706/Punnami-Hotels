import prisma from '../src/lib/db';
import { sendBookingConfirmationEmail, sendAdminBookingConfirmationEmail } from '../src/lib/zohoMail';
import { formatDate } from '../src/lib/utils';

function formatSlotTime(timeStr?: string | null, fallback: string = '12:00 PM') {
  if (!timeStr) return fallback;
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return fallback;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours.toString().padStart(2, '0')}:${displayMinutes} ${period}`;
  } catch {
    return fallback;
  }
}

async function resendEmails() {
  console.log('Fetching recent confirmed/partial-paid bookings...');

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'PARTIAL_PAID'] },
      createdAt: { gte: new Date('2026-10-01T00:00:00Z') },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      roomType: { include: { hotel: true } },
    },
  });

  console.log(`Found ${bookings.length} confirmed/partial-paid bookings in October:`);

  const results: any[] = [];

  for (const b of bookings) {
    const displayId = b.sequenceId || b.publicId;
    const slotIn = formatSlotTime(b.slotStart, '12:00 PM');
    const slotOut = formatSlotTime(b.slotEnd, '11:00 AM');
    const checkInStr = formatDate(b.checkInDate);
    const checkOutStr = formatDate(b.checkOutDate);

    console.log(`\n========================================`);
    console.log(`Processing Booking #${b.id} (${displayId}) for ${b.guestName}...`);

    let guestEmailSent = false;
    let guestEmailError = null;

    if (b.guestEmail && b.guestEmail.includes('@')) {
      try {
        console.log(`Sending Guest Confirmation to ${b.guestEmail}...`);
        guestEmailSent = await sendBookingConfirmationEmail({
          guestEmail: b.guestEmail,
          guestName: b.guestName,
          publicId: displayId,
          roomName: b.roomType.name,
          checkInDate: checkInStr,
          checkInTime: slotIn,
          checkOutDate: checkOutStr,
          checkOutTime: slotOut,
          nights: b.totalNights,
          rooms: b.roomsBooked,
          paidAmount: (b.paidAmount || b.totalAmount).toString(),
          totalAmount: b.totalAmount.toString(),
        });
        console.log(`Guest Email result: ${guestEmailSent ? 'SUCCESS' : 'FAILED'}`);
      } catch (err: any) {
        guestEmailError = err.message;
        console.error(`Error sending to guest:`, err);
      }
    } else {
      console.log(`Guest has no email registered (phone: ${b.guestPhone}). Skipping guest email.`);
    }

    let adminEmailSent = false;
    let adminEmailError = null;

    try {
      console.log(`Sending Admin Confirmation to punnamirooms@gmail.com...`);
      adminEmailSent = await sendAdminBookingConfirmationEmail({
        adminEmail: 'punnamirooms@gmail.com',
        guestName: b.guestName,
        guestEmail: b.guestEmail || '',
        guestPhone: b.guestPhone,
        publicId: displayId,
        roomName: b.roomType.name,
        checkInDate: checkInStr,
        checkInTime: slotIn,
        checkOutDate: checkOutStr,
        checkOutTime: slotOut,
        nights: b.totalNights,
        rooms: b.roomsBooked,
        paidAmount: (b.paidAmount || b.totalAmount).toString(),
        totalAmount: b.totalAmount.toString(),
      });
      console.log(`Admin Email result: ${adminEmailSent ? 'SUCCESS' : 'FAILED'}`);
    } catch (err: any) {
      adminEmailError = err.message;
      console.error(`Error sending to admin:`, err);
    }

    results.push({
      bookingId: b.id.toString(),
      publicId: displayId,
      guestName: b.guestName,
      guestEmail: b.guestEmail || 'N/A',
      guestEmailSent,
      adminEmailSent,
    });

    // Small delay between sends to avoid rate-limiting
    await new Promise(res => setTimeout(res, 1000));
  }

  console.log('\n========================================');
  console.log('FINAL SUMMARY OF EMAILS SENT:');
  console.table(results);
}

resendEmails()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
