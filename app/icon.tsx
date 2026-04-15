/**
 * 앱 아이콘 — Next.js가 /icon 엔드포인트로 자동 서빙
 * - 브라우저 파비콘 / PWA 아이콘으로 사용됨
 * - 실제 로고 완성 시: ImageResponse 내부를 <img src="/logo.png"> 로 교체
 */
import { ImageResponse } from 'next/og';

export const size        = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '42px',
        }}
      >
        <div style={{ fontSize: 112, lineHeight: 1 }}>☕</div>
      </div>
    ),
    { width: 192, height: 192 },
  );
}
