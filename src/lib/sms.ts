/**
 * MSG91 SMS Service — Punnami Hotels
 * SMS functionality has been disabled. Function signatures are preserved
 * to prevent breaking existing code references.
 */

export async function sendOtpSMS(phone: string, otp: string): Promise<boolean> {
  console.log(`[SMS - DISABLED] OTP code ${otp} would be sent to ${phone}`);
  return true;
}

export async function sendRoomConfirmationSMS({
  customerName,
  customerPhone,
  publicId,
  hotelName,
  roomName,
  checkInDate,
  checkInTime,
  checkOutDate,
  checkOutTime,
  paidAmount,
  totalAmount,
}: {
  customerName: string;
  customerPhone: string;
  publicId: string;
  hotelName: string;
  roomName: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  paidAmount: string;
  totalAmount: string;
}): Promise<boolean> {
  console.log(`[SMS - DISABLED] Confirmation message would be sent to ${customerPhone} for booking ${publicId}`);
  return true;
}

export async function sendCheckInReminderSMS({
  customerName,
  customerPhone,
  publicId,
  hotelName,
  checkInDetail,
  hotelPhone,
}: {
  customerName: string;
  customerPhone: string;
  publicId: string;
  hotelName: string;
  checkInDetail: string;
  hotelPhone: string;
}): Promise<boolean> {
  console.log(`[SMS - DISABLED] Check-in reminder would be sent to ${customerPhone} for booking ${publicId}`);
  return true;
}
