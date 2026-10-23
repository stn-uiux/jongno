import React from 'react';

export interface SmartScannerIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

/**
 * 종로구 스마트 스캐너 전용 벡터 아이콘
 * 상단 2개의 수직 안테나와 이중 라운드 사각 바디(전면 패널)로 구성된 실물 기반 디자인
 */
export const SmartScannerIcon: React.FC<SmartScannerIconProps> = ({
  size = 16,
  strokeWidth = 2.2,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* 상단 2개의 수직 안테나 */}
      <line x1="8.5" y1="2" x2="8.5" y2="7.5" />
      <line x1="15.5" y1="2" x2="15.5" y2="7.5" />
      {/* 외곽 둥근 사각 바디 */}
      <rect x="4.5" y="7.5" width="15" height="14.5" rx="3.5" />
      {/* 내부 전면 패널 / 센서 프레임 */}
      <rect x="7.5" y="10.5" width="9" height="8.5" rx="2" />
    </svg>
  );
};

/**
 * Leaflet DivIcon HTML 마커 내부 삽입용 SVG 문자열 생성기
 */
export const getSmartScannerSvgString = (
  width = 15,
  height = 15,
  color = '#FFFFFF',
  strokeWidth = 2.2
): string => `
  <svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <line x1="8.5" y1="2" x2="8.5" y2="7.5" />
    <line x1="15.5" y1="2" x2="15.5" y2="7.5" />
    <rect x="4.5" y="7.5" width="15" height="14.5" rx="3.5" />
    <rect x="7.5" y="10.5" width="9" height="8.5" rx="2" />
  </svg>
`;

export default SmartScannerIcon;
