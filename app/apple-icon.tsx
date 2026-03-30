/**
 * Apple Touch Icon — iOS "홈 화면에 추가" 시 표시되는 아이콘
 * Next.js가 /apple-icon 엔드포인트로 자동 서빙하고
 * <head>에 <link rel="apple-touch-icon"> 를 자동으로 삽입함
 *
 * - 실제 로고 완성 시: 내부를 <img src="/logo.png"> 로 교체
 */
import { ImageResponse } from 'next/og';

export const size        = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          borderRadius: '38px',
        }}
      >
        <div style={{ fontSize: 105, lineHeight: 1 }}>☕</div>
      </div>
    ),
    { width: 180, height: 180 },
  );
}
