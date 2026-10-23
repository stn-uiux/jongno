# 서울 종로구 및 연계 지하철 노선/역 공간정보 데이터 (GeoJSON)

본 디렉터리의 데이터는 인터넷이 차단된 **폐쇄망(Air-Gapped) 관제 환경**에서도 서울 종로구 관내 및 주요 환승 연계 지하철 노선과 역 정보를 정확하게 표출할 수 있도록 사전 추출 및 정제된 실제 공간정보 데이터셋입니다.

---

## 1. 데이터 파일 구성

| 파일명 | 형식 | 설명 | 주요 속성 |
| :--- | :--- | :--- | :--- |
| `subway-lines.geojson` | GeoJSON (MultiLineString) | 실제 지하철 선로 궤적 | `id`, `line`, `name`, `color`, `textColor`, `source` |
| `subway-stations.geojson` | GeoJSON (Point) | 실제 지하철역 중심 좌표 | `id`, `name`, `cleanName`, `lines`, `isTransfer`, `primaryColor`, `lineColors`, `inJongno` |

---

## 2. 수집 및 정제 정보

- **데이터 출처**: [OpenStreetMap (OSM)](https://www.openstreetmap.org/) via [Overpass API](https://overpass-api.de/)
- **라이선스**: [Open Database License (ODbL) 1.0](https://opendatacommons.org/licenses/odbl/)
- **수집 일시**: 2026년 10월 21일
- **좌표계**: WGS84 (EPSG:4326), `[경도(Longitude), 위도(Latitude)]`
- **수집 및 검증 스크립트**:
  - 데이터 추출: `scripts/fetch-subway-raw.mjs`
  - GeoJSON 변환 및 통합: `scripts/build-subway-geojson.mjs`
  - 데이터 무결성 검증: `scripts/validate-subway.mjs`

---

## 3. 수집 대상 노선 및 역 현황

### 지하철 노선 (7개 노선)
1. **수도권 전철 1호선** (`#0052A4`): 종각 - 종로3가 - 종로5가 - 동대문 - 동묘앞 - 신설동
2. **서울 지하철 2호선** (`#00A84D`): 시청 - 을지로입구 - 을지로3가 - 을지로4가 - DDP, 성수지선(신설동)
3. **수도권 전철 3호선** (`#EF7C1C`): 무악재 - 독립문 - 경복궁 - 안국 - 종로3가 - 을지로3가
4. **수도권 전철 4호선** (`#00A5DE`): 한성대입구 - 혜화 - 동대문 - 동대문역사문화공원
5. **수도권 전철 5호선** (`#996CAC`): 서대문 - 광화문 - 종로3가 - 을지로4가 - DDP
6. **서울 지하철 6호선** (`#CD7C2F`): 창신 - 동묘앞 - 신당 - 청구 - 약수
7. **우이신설선** (`#B0CE1A`): 북한산보국문 - 정릉 - 성신여대입구 - 보문 - 신설동

### 주요 종로구 관내 역 (12개 역)
- 광화문역(5호선), 종각역(1호선), 종로3가역(1/3/5호선), 종로5가역(1호선)
- 경복궁역(3호선), 안국역(3호선), 혜화역(4호선), 동대문역(1/4호선)
- 동묘앞역(1/6호선), 창신역(6호선), 독립문역(3호선), 서대문역(5호선)

---

## 4. 폐쇄망 운영 가이드

- 본 GeoJSON 파일은 웹 애플리케이션 번들 내부에 정적 리소스(`public/geojson/` 및 `src/data/`)로 완전 탑재되어 있으므로, **외부 인터넷 망이나 외부 CDN 호출이 0%**인 순수 내부망에서도 100% 정상 작동합니다.
