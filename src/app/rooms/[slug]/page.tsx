import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import RoomDetailClient from './RoomDetailClient';

export const revalidate = 3600;
export const dynamicParams = true;

import { cache } from 'react';

const getRoomDetail = cache(async (slug: string) => {
  try {
    const room = await prisma.roomType.findUnique({
      where: { slug, status: 'PUBLISHED', isActive: true },
      include: {
        hotel: {
          select: {
            id: true, name: true, slug: true, address: true, mapUrl: true,
            checkInTime: true, checkOutTime: true, coverImageUrl: true,
            facilities: true, policies: true,
          },
        },
      },
    });
    return room;
  } catch { return null; }
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoomDetail(slug);
  if (!room) return { title: 'Room Not Found' };

  return {
    title: `${room.name} | Punnami Southern Residency`,
    description: (room.description || `Book ${room.name} at Punnami Southern Residency — modern amenities, comfortable stay.`).slice(0, 160),
    openGraph: {
      title: `${room.name} | Punnami Southern Residency`,
      images: room.coverImageUrl ? [{ url: room.coverImageUrl }] : [],
    },
  };
}

export default async function RoomDetailPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const room = await getRoomDetail(slug);
  if (!room) notFound();

  return (
    <RoomDetailClient
      room={{
        ...room,
        id: room.id.toString(),
        hotelId: room.hotelId.toString(),
        weekdayPrice: Number(room.weekdayPrice),
        weekendPrice: Number(room.weekendPrice),
        hotel: { ...room.hotel, id: room.hotel.id.toString() },
      }}
      initialCheckIn={sp.checkIn}
      initialCheckOut={sp.checkOut}
    />
  );
}
