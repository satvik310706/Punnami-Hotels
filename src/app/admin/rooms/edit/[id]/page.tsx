'use client';

import { useEffect, useState } from 'react';
import InlineLoader from '@/components/InlineLoader';
import { useRouter, useParams } from 'next/navigation';
import RoomForm from '@/components/rooms/RoomForm';
import { useModalStore } from '@/hooks/useModalStore';

export default function AdminRoomEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showAlert } = useModalStore();

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/v1/admin/rooms/${id}`);
        if (res.ok) {
          const data = await res.json();
          setRoom(data);
        } else {
          showAlert('Error', 'Room variant not found.', 'error');
          router.push('/admin/rooms');
        }
      } catch {
        showAlert('Error', 'Network error fetching room.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoom();
    }
  }, [id, router]);

  const handleSubmit = async (formData: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/admin/rooms/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('Success', 'Room variant updated successfully.', 'success');
        router.push('/admin/rooms');
      } else {
        showAlert('Error', data.error || 'Failed to update room variant', 'error');
      }
    } catch {
      showAlert('Error', 'Failed to save room category', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <InlineLoader size="lg" label="Loading room" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6">
      <RoomForm initialData={room} onSubmit={handleSubmit} isLoading={saving} />
    </div>
  );
}
