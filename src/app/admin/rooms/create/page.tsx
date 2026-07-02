'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import RoomForm from '@/components/rooms/RoomForm';
import { useModalStore } from '@/hooks/useModalStore';

export default function AdminRoomCreatePage() {
  const router = useRouter();
  const { showAlert } = useModalStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('Success', 'Room variant created successfully.', 'success');
        router.push(`/admin/rooms`);
      } else {
        showAlert('Error', data.error || 'Failed to create room category', 'error');
      }
    } catch {
      showAlert('Error', 'Failed to save room category', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-6">
      <RoomForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
