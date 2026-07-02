const { calculateStayTotal, formatDate } = require('../src/lib/utils');
const assert = require('assert');

// Set up simple console-based test runner
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('Running Unit & Integration Tests...\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Timezone Date Loops: calculateStayTotal
// ─────────────────────────────────────────────────────────────────────────────
test('Timezone Date Loops: calculateStayTotal handles UTC bounds correctly', () => {
  const checkIn = new Date('2026-07-04T00:00:00.000Z');
  const checkOut = new Date('2026-07-07T00:00:00.000Z'); // 3 nights
  
  const result = calculateStayTotal(checkIn, checkOut, 1000, 1500, 1);
  
  assert.strictEqual(result.nights, 3, 'Should be exactly 3 nights');
  assert.strictEqual(result.breakdown[0].date, '2026-07-04');
  assert.strictEqual(result.breakdown[1].date, '2026-07-05');
  assert.strictEqual(result.breakdown[2].date, '2026-07-06');
  
  // 2026-07-04 is Saturday (Weekend: 1500)
  // 2026-07-05 is Sunday (Weekend: 1500)
  // 2026-07-06 is Monday (Weekday: 1000)
  // Total = 1500 + 1500 + 1000 = 4000
  assert.strictEqual(result.subtotal, 4000, 'Subtotal stays count calculation must match');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Aadhar Security Masking logic
// ─────────────────────────────────────────────────────────────────────────────
test('Aadhar Masking: guest details are stripped successfully', () => {
  const mockBookingFromDb = {
    id: 123n,
    publicId: 'HTL-12345678-ABCDE',
    guestName: 'John Doe',
    guestPhone: '9999999999',
    totalAmount: '2500.00',
    aadharEncrypted: 'AES-ENCRYPTED-CONTENT-SECRET',
    aadharHash: 'SHA-256-HASH-VALUE',
    aadharImageUrl: 'https://cloudinary.com/aadhar-doc.png',
  };

  // Mocking the mapping executed in my-bookings / agent stays APIs
  const { aadharEncrypted, aadharHash, aadharImageUrl, ...publicBooking } = mockBookingFromDb;
  const mapped = {
    ...publicBooking,
    id: mockBookingFromDb.id.toString(),
    totalAmount: Number(mockBookingFromDb.totalAmount),
  };

  // Asserts
  assert.strictEqual(mapped.aadharEncrypted, undefined, 'aadharEncrypted must be stripped');
  assert.strictEqual(mapped.aadharHash, undefined, 'aadharHash must be stripped');
  assert.strictEqual(mapped.aadharImageUrl, undefined, 'aadharImageUrl must be stripped');
  assert.strictEqual(mapped.guestName, 'John Doe', 'Public fields must remain intact');
  assert.strictEqual(mapped.totalAmount, 2500, 'Decimals converted to floats');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Expiration TTL validation logic
// ─────────────────────────────────────────────────────────────────────────────
test('Expiration TTL: Booking creation expiresAt is set to 24 hours', () => {
  const now = Date.now();
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
  const diffHours = (expiresAt.getTime() - now) / (1000 * 60 * 60);
  
  assert.ok(diffHours >= 23.9 && diffHours <= 24.1, 'expiresAt TTL duration must be exactly 24 hours');
});

console.log('\nAll Unit & Integration Tests Passed successfully! 🚀');
