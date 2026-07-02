import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Punnami South Residency data...');

  // 1. Create Hotel
  const hotel = await prisma.hotel.upsert({
    where: { slug: 'punnami-hotels' },
    update: {},
    create: {
      name: 'Punnami South Residency',
      slug: 'punnami-hotels',
      tagline: 'Experience luxury and comfort in Bhadrachalam',
      description: 'Punnami South Residency is a premium lodging destination in Bhadrachalam, offering state-of-the-art room variants, modern amenities, and world-class hospitality.',
      address: 'Near Temple Road, Bhadrachalam, Telangana, 507111',
      mapUrl: 'https://maps.google.com',
      checkInTime: '12:00 PM',
      checkOutTime: '11:00 AM',
      coverImageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
      facilities: [
        'Free Wi-Fi',
        'Air Conditioning',
        '24/7 Hot Water',
        'Flat Screen TV',
        'In-Room Dining',
        'Complimentary Breakfast',
        'Free Parking',
        'Room Service',
      ],
      policies: [
        { title: 'Check-in Policy', description: 'Guests must present a valid government-issued photo ID (Aadhaar Card preferred) at the time of check-in.' },
        { title: 'Cancellation Policy', description: 'Cancellations made 24 hours or more before check-in will receive a full refund. Cancellations within 24 hours are non-refundable.' },
        { title: 'Child Policy', description: 'Children up to 5 years stay free of charge using existing beds. Extra bedding charges apply for children above 5 years.' },
      ],
      galleryImages: [
        { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80', alt: 'Hotel Entrance' },
        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80', alt: 'Lobby' },
      ],
    },
  });

  console.log(`Hotel created: ${hotel.name}`);

  // 2. Create Room Types
  const roomTypes = [
    {
      name: 'Luxury Suite',
      slug: 'luxury-suite',
      description: 'Our spacious Luxury Suite offers the finest comforts, including a king-size bed, elegant seating area, work desk, and high-end room toiletries. Perfect for couples seeking a premium experience.',
      coverImageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      weekdayPrice: 3500.0,
      weekendPrice: 4000.0,
      capacityPerRoom: 2,
      maxAdults: 2,
      maxChildren: 1,
      totalInventory: 5,
      isFeatured: true,
      orderPriority: 1,
      facilities: ['A/C', 'Wi-Fi', 'Hot Water', 'Room Service', 'Smart TV', 'Complimentary Breakfast', 'Mini Bar'],
      highlights: [
        { icon: '👑', title: 'King Size Bed' },
        { icon: '☕', title: 'Coffee Maker' },
        { icon: '🛁', title: 'Premium Bath Tub' },
      ],
      faqs: [
        { question: 'Is breakfast included?', answer: 'Yes, complimentary breakfast is served daily from 7:30 AM to 10:00 AM.' },
        { question: 'Is there a balcony?', answer: 'Yes, the Luxury Suite features a private balcony with temple town views.' },
      ],
      policies: [
        { title: 'No Smoking', description: 'Smoking is strictly prohibited inside the room.' },
        { title: 'No Pets', description: 'Pets are not allowed in this room type.' },
      ],
    },
    {
      name: 'Premium Deluxe Room',
      slug: 'premium-deluxe-room',
      description: 'The Premium Deluxe Room is designed for convenience and style. It features a queen-size bed, workstation, modern bathroom fittings, and views of the town.',
      coverImageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800',
      weekdayPrice: 2500.0,
      weekendPrice: 2800.0,
      capacityPerRoom: 3,
      maxAdults: 3,
      maxChildren: 1,
      totalInventory: 10,
      isFeatured: true,
      orderPriority: 2,
      facilities: ['A/C', 'Wi-Fi', 'Hot Water', 'Room Service', 'Flat Screen TV', 'Complimentary Breakfast'],
      highlights: [
        { icon: '🛏️', title: 'Queen Size Bed' },
        { icon: '💼', title: 'Work Desk' },
      ],
      faqs: [
        { question: 'Can an extra bed be added?', answer: 'Yes, an extra rollaway bed can be added for ₹500/night.' },
      ],
      policies: [
        { title: 'Max Occupancy', description: 'Strictly limited to 3 adults.' },
      ],
    },
    {
      name: 'Executive Twin Room',
      slug: 'executive-twin-room',
      description: 'Ideal for friends or business colleagues, the Executive Twin Room offers two single beds, individual study desks, and modern bathroom amenities.',
      coverImageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
      weekdayPrice: 1800.0,
      weekendPrice: 2000.0,
      capacityPerRoom: 4,
      maxAdults: 4,
      maxChildren: 2,
      totalInventory: 8,
      isFeatured: false,
      orderPriority: 3,
      facilities: ['A/C', 'Wi-Fi', 'Hot Water', 'Room Service', 'Flat Screen TV'],
      highlights: [
        { icon: '👯', title: 'Twin Beds' },
      ],
      faqs: [],
      policies: [],
    },
  ];

  for (const rt of roomTypes) {
    await prisma.roomType.upsert({
      where: { slug: rt.slug },
      update: {},
      create: {
        hotelId: hotel.id,
        name: rt.name,
        slug: rt.slug,
        description: rt.description,
        coverImageUrl: rt.coverImageUrl,
        weekdayPrice: rt.weekdayPrice,
        weekendPrice: rt.weekendPrice,
        capacityPerRoom: rt.capacityPerRoom,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        totalInventory: rt.totalInventory,
        isFeatured: rt.isFeatured,
        orderPriority: rt.orderPriority,
        facilities: rt.facilities,
        highlights: rt.highlights,
        faqs: rt.faqs,
        policies: rt.policies,
        status: 'PUBLISHED',
      },
    });
    console.log(`Room type seeded: ${rt.name}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
