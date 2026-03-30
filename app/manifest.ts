/**
 * Web App Manifest — Android "홈 화면 추가" / PWA 설치 시 사용
 * Next.js가 /manifest.webmanifest 엔드포인트로 자동 서빙
 */
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'MoaCoffee',
    short_name:       'MoaCoffee',
    description:      '팀원들과 함께하는 커피 주문 앱',
    start_url:        '/',
    display:          'standalone',
    background_color: '#fefdfb',   // 크림 화이트 (로딩 스플래시 배경)
    theme_color:      '#92400e',   // 앰버 브라운 (상단 상태바 색상)
    orientation:      'portrait',
    icons: [
      {
        src:     '/icon',          // app/icon.tsx → Next.js가 서빙
        sizes:   '192x192',
        type:    'image/png',
        purpose: 'any',
      },
      {
        src:     '/icon',
        sizes:   '512x512',
        type:    'image/png',
        purpose: 'maskable',       // Android 적응형 아이콘 (배경색 적용)
      },
    ],
  };
}
