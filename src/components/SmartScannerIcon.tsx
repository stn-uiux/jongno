import React from 'react';

export interface SmartScannerIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

/**
 * 종로구 스마트 스캐너 전용 벡터 아이콘
 * 상단 2개의 수직 안테나와 이중 라운드 사각 바디(전면 패널)로 구성된 실물 기반 디자인
 * 24x24 그리드에서 정중앙(12.0) 대칭 보정 및 정수 픽셀 정렬
 */
export const SmartScannerIcon: React.FC<SmartScannerIconProps> = ({
  size = 14,
  strokeWidth = 2.2,
  className = '',
  style,
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
      style={{ display: 'block', margin: 'auto', ...style }}
      {...props}
    >
      {/* 상단 2개의 수직 안테나 (중심 x=12.0 대칭: 8 & 16) */}
      <line x1="8" y1="2" x2="8" y2="7.5" />
      <line x1="16" y1="2" x2="16" y2="7.5" />
      {/* 외곽 둥근 사각 바디 (중심 x=12.0 대칭: x=4, width=16) */}
      <rect x="4" y="7.5" width="16" height="14" rx="3.5" />
      {/* 내부 전면 패널 / 센서 프레임 (중심 x=12.0 대칭: x=7, width=10) */}
      <rect x="7" y="10.5" width="10" height="8" rx="2" />
    </svg>
  );
};

/**
 * Leaflet DivIcon HTML 마커 내부 삽입용 SVG 문자열 생성기
 * 앞뒤 공백 및 개행 없이 정중앙에 정확히 렌더링되도록 반환
 */
export const getSmartScannerSvgString = (
  width = 14,
  height = 14,
  color = '#FFFFFF',
  strokeWidth = 2.2
): string => `<svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:auto;"><line x1="8" y1="2" x2="8" y2="7.5"/><line x1="16" y1="2" x2="16" y2="7.5"/><rect x="4" y="7.5" width="16" height="14" rx="3.5"/><rect x="7" y="10.5" width="10" height="8" rx="2"/></svg>`;

export default SmartScannerIcon;

