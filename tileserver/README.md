# 종로구 인파 관제 시스템 - 폐쇄망(Air-Gapped) 타일 서버 구축 패키지

본 디렉토리는 **외부 인터넷 연결이 완전히 차단된 사내 폐쇄망 환경**에서 **상업시설(식당, 카페, 상점)과 버스정류장 아이콘이 100% 제거된 고해상도 OSM 다크 관제 지도**를 자체 서비스하기 위한 패키지입니다.

---

## 📁 디렉토리 구조

```text
tileserver/
├── docker-compose.yml              # TileServer GL 컨테이너 정의 (포트 8080)
├── download-mbtiles.bat            # 외부망 PC용 MBTiles 다운로드 배치 스크립트
├── README.md                       # 폐쇄망 반입 및 구동 가이드
└── data/
    ├── config.json                 # TileServer GL 서버 설정 파일
    ├── jongno.mbtiles              # 종로구/서울 OSM 벡터 지도 데이터 (.mbtiles)
    └── styles/
        └── jongno-dark/
            └── style.json          # 상업 POI 제거 + 톤다운 옐로우 도로 커스텀 스타일
```

---

## 🚀 3단계 구동 절차

### 1단계: 외부 인터넷 PC에서 준비
1. Docker 이미지 저장:
   ```bash
   docker pull maptiler/tileserver-gl:latest
   docker save -o tileserver-gl.tar maptiler/tileserver-gl:latest
   ```
2. 종로구/서울 MBTiles 지도 파일 다운로드:
   * `download-mbtiles.bat` 실행 또는 [OpenMapTiles 대한민국 데이터](https://data.maptiler.com/downloads/tileset/osm/asia/south-korea/) 다운로드
   * 다운로드한 파일 이름을 `tileserver/data/jongno.mbtiles`로 저장

### 2단계: 폐쇄망 서버로 파일 반입 (USB / 망연계 전송)
* `tileserver-gl.tar` (Docker 이미지)
* `tileserver/` 폴더 전체 (설정 파일 + `jongno.mbtiles`)

### 3단계: 폐쇄망 서버에서 즉시 기동
```bash
# 1. Docker 이미지 적재
docker load -i tileserver-gl.tar

# 2. tileserver 디렉토리 이동 후 백그라운드 서비스 시작
cd tileserver
docker compose up -d

# 3. 서비스 정상 가동 확인
curl http://localhost:8080/health
# 브라우저 확인: http://localhost:8080/styles/jongno-dark/
```

---

## 🎨 커스텀 스타일 특징 (`jongno-dark`)
* **상업시설 POI 100% 숨김**: 음식점(`restaurant`), 카페(`cafe`), 상점(`shop`), 마트, 주점 레이어 원천 비활성화 (`visibility: "none"`).
* **대중교통 정류소 숨김**: 시야를 가리는 버스정류소 마커 비활성화. (지하철역 텍스트만 깔끔하게 유지)
* **도로망 색상**: 붉은 기 없는 차분한 톤다운 옐로우/골드 (`#c49d48`) 및 다크 차콜 이면도로 (`#2d3340`).
* **지형 및 수계 보존**: 북악산/인왕산/공원 녹지 에메랄드 그린 (`#183624`), 청계천 수계 딥 네이비 (`#132842`).
* **고배율 확대**: Zoom 15 ~ 19까지 골목길과 건물 외곽선이 깨짐 없이 초고속 렌더링.
