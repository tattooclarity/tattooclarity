'use client';

import { useRouter } from 'next/navigation';

export default function PreviewButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/plans')}
      style={{
        padding: '14px 16px',
        borderRadius: 14,
        fontWeight: 950,
        background: '#111',
        color: '#fff',
        border: 0,
        cursor: 'pointer',
      }}
    >
      PREVIEW MY CHARACTER
    </button>
  );
}