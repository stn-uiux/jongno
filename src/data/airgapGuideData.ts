export interface GuideSection {
  id: string;
  title: string;
  badge?: string;
  summary: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
    description: string;
  };
}

export const AIRGAP_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'osm-source',
    title: '1. 종로구 OSM 원본 데이터 확보 및 라이선스',
    summary: '인터넷 환경에서 원본 데이터를 확보하여 폐쇄망으로 반입하기 위한 다운로드 절차 및 법적 라이선스 규정',
    content: `OpenStreetMap(OSM) 데이터는 전 세계 기여자들이 구축한 지리정보로, **ODbL (Open Database License v1.0)** 하에 배포됩니다.
상업적 및 정부·공공기관 폐쇄망 내부 시스템에서 자유롭게 사용, 수정, 호스팅할 수 있습니다. (출처 표시: "© OpenStreetMap contributors" 필요)

### 다운로드 공식 채널
- **Geofabrik 다운로드 서버 (대한민국 전체 PBF)**:
  URL: \`https://download.geofabrik.de/asia/south-korea-latest.osm.pbf\`
- **BBBike 도시별 추출 서비스 (서울 권역 맞춤 PBF)**:
  URL: \`https://extract.bbbike.org/\` (Seoul 선택 시 경량 PBF 바로 생성 가능)
- **Overpass API (종로구 행정구역 경계 바운딩 박스)**:
  OSM Relation ID: 2311218 (서울특별시 종로구 행정구역 경계)`,
    codeSnippet: {
      language: 'bash',
      description: '인터넷 연결 환경에서 대한민국 원본 OSM PBF 다운로드',
      code: `# 1. 작업 디렉토리 생성
mkdir -p ~/jongno-map-build && cd ~/jongno-map-build

# 2. 대한민국 최신 OSM 데이터 다운로드 (약 120MB ~ 160MB)
wget https://download.geofabrik.de/asia/south-korea-latest.osm.pbf

# 3. 무결성 해시 검증
md5sum south-korea-latest.osm.pbf`,
    },
  },
  {
    id: 'osmium-extract',
    title: '2. Osmium을 활용한 종로구 영역 추출',
    summary: '전체 대한민국 PBF에서 종로구 관제 범위(BBox)만 고속으로 잘라내어 경량화하는 방법',
    content: `대한민국 전체 PBF에는 전국 도로망과 건물 정보가 포함되어 있어 불필요하게 큽니다.
고성능 C++ 오픈소스인 **osmium-tool**을 사용하면 종로구 일대 바운딩 박스(Bounding Box: 최소경도, 최소위도, 최대경도, 최대위도) 영역만 수 초 만에 추출할 수 있습니다.

### 종로구 기준 BBox 좌표
- **최소 경도 (West)**: 126.9450
- **최소 위도 (South)**: 37.5600
- **최대 경도 (East)**: 127.0250
- **최대 위도 (North)**: 37.6250`,
    codeSnippet: {
      language: 'bash',
      description: 'osmium-tool 설치 및 종로구 구역 PBF 추출 명령',
      code: `# Ubuntu / Debian 계열 osmium-tool 설치
sudo apt-get update && sudo apt-get install -y osmium-tool

# 종로구 영역 정밀 바운딩 박스로 추출 (bbox: min_lon,min_lat,max_lon,max_lat)
osmium extract \\
  --bbox 126.9450,37.5600,127.0250,37.6250 \\
  --strategy=complete_ways \\
  south-korea-latest.osm.pbf \\
  -o jongno-extracted.osm.pbf

# 추출된 결과 확인 (용량: 약 12~18MB로 대폭 축소)
ls -lh jongno-extracted.osm.pbf`,
    },
  },
  {
    id: 'mbtiles-generation',
    title: '3. PBF 데이터를 MBTiles로 변환 (Tilemaker / Planetiler)',
    summary: 'PostgreSQL/PostGIS 데이터베이스 없이 단일 파일 MBTiles로 고속 벡터 타일을 빌드하는 방법',
    content: `MBTiles는 수만 개의 타일을 단일 SQLite 파일(.mbtiles)로 패키징한 표준 포맷입니다.
폐쇄망에서는 대규모 DBMS(PostGIS)를 운영하는 대신, 경량 오픈소스인 **tilemaker** 또는 Java 기반의 **planetiler**를 사용하여 독립형 MBTiles를 생성하는 것이 유지보수와 안정성 면에서 가장 권장됩니다.`,
    codeSnippet: {
      language: 'bash',
      description: 'Docker 기반 Tilemaker로 종로구 MBTiles 벡터 타일 빌드',
      code: `# Tilemaker 공식 컨테이너를 사용하여 변환 실행
docker run --rm -v $(pwd):/srv \\
  systemed/tilemaker \\
  --input=/srv/jongno-extracted.osm.pbf \\
  --output=/srv/jongno.mbtiles \\
  --process=/resources/process-openmaptiles.lua \\
  --config=/resources/config-openmaptiles.json

# 생성된 MBTiles 확인
ls -lh jongno.mbtiles
# 종로구 단일 지역 MBTiles 예상 크기: 약 35MB ~ 50MB (Zoom 0~15 포함)`,
    },
  },
  {
    id: 'tileserver-setup',
    title: '4. TileServer GL 설정 및 Docker 구성',
    summary: '외부 인터넷 없이 내부 네트워크에서 래스터/벡터 타일을 고속 서비스하는 TileServer GL 구성',
    content: `**TileServer GL**은 MapLibre / Mapbox 호환 오픈소스 타일 서빙 엔진입니다.
- \`.mbtiles\` 파일로부터 실시간 래스터 PNG 타일 (\`/{z}/{x}/{y}.png\`) 및 벡터 PBF 타일을 생성합니다.
- 자체 내장 폰트(glyphs)와 지도 스타일(OSM-Bright, Klokantech Basic 등)을 완전히 로컬에서 제공하므로 외부 폰트나 CSS 다운로드가 일체 발생하지 않습니다.`,
    codeSnippet: {
      language: 'json',
      description: 'TileServer GL config.json 설정 파일',
      code: `{
  "options": {
    "paths": {
      "root": "/data",
      "fonts": "fonts",
      "styles": "styles",
      "mbtiles": ""
    },
    "domains": ["*"],
    "formatQuality": { "jpeg": 85, "webp": 85, "png": 9 }
  },
  "styles": {
    "osm-bright": {
      "style": "styles/osm-bright/style.json",
      "serve_rendered": true,
      "serve_data": true
    },
    "dark-matter": {
      "style": "styles/dark-matter/style.json",
      "serve_rendered": true,
      "serve_data": true
    }
  },
  "data": {
    "jongno-data": {
      "mbtiles": "jongno.mbtiles"
    }
  }
}`,
    },
  },
  {
    id: 'docker-compose',
    title: '5. Docker Compose 구성 파일 (폐쇄망 내부 서버용)',
    summary: '단 한 줄의 명령어로 내부 지도 서버를 기동하는 docker-compose 정의',
    content: `내부 서버의 \`/opt/map-server\` 디렉토리에 데이터와 설정을 배치한 후 \`docker compose up -d\`를 실행하여 서비스합니다.`,
    codeSnippet: {
      language: 'yaml',
      description: 'docker-compose.yml',
      code: `version: '3.8'

services:
  tileserver-gl:
    image: maptiler/tileserver-gl:latest
    container_name: jongno_tileserver
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      - PORT=8080
    command: ["-c", "/data/config.json", "--verbose"]
    # 폐쇄망 격리: 외부 egress 네트워크 차단
    networks:
      - internal_gis_net

networks:
  internal_gis_net:
    internal: true # 외부 인터넷 트래픽 차단 모드`,
    },
  },
  {
    id: 'airgap-transfer',
    title: '6. 인터넷 단절 환경으로 이미지 및 데이터 반입 절차',
    summary: '보안 USB 또는 데이터 반입 매체를 활용한 Docker 이미지와 타일 아카이브 반입 가이드',
    content: `인터넷이 연결된 외부 작업 PC에서 모든 구성요소를 하나의 패키지로 묶어 암호화 매체로 반입합니다.

### 4단계 반입 워크플로우:
1. **외부 PC**: Docker 이미지 저장 (\`docker save -o tileserver-gl.tar maptiler/tileserver-gl:latest\`)
2. **외부 PC**: SHA-256 해시 생성 (\`sha256sum tileserver-gl.tar jongno.mbtiles > checksums.txt\`)
3. **보안 인가**: 보안 부서 승인 후 반입용 전용 USB 또는 단방향 광케이블(Data Diode)을 통해 폐쇄망 망분리 서버로 복사
4. **폐쇄망 서버**: 해시 일치 검증 후 \`docker load -i tileserver-gl.tar\` 로 이미지 적재`,
    codeSnippet: {
      language: 'bash',
      description: '폐쇄망 내부 서버에서의 이미지 로드 및 검증 스크립트',
      code: `# 1. 반입 파일 체크섬 검증
sha256sum -c checksums.txt

# 2. 도커 이미지 로드 (인터넷 불필요)
docker load -i tileserver-gl.tar

# 3. 데이터 디렉토리 확인
mkdir -p /opt/map-server/data
cp jongno.mbtiles /opt/map-server/data/
cp config.json /opt/map-server/data/

# 4. 서비스 기동
cd /opt/map-server && docker compose up -d

# 5. 로컬 헬스체크
curl -I http://localhost:8080/health`,
    },
  },
  {
    id: 'leaflet-client-config',
    title: '7. Leaflet 프론트엔드 연동 및 타일 URL 설정',
    summary: 'Leaflet L.tileLayer에서 내부 로컬 타일 서버를 호출하는 프로덕션 코드',
    content: `Leaflet은 표준 래스터 타일 (\`{z}/{x}/{y}.png\`) 규격을 따릅니다.
본 관제 시스템의 환경설정 모달 또는 환경변수(\`VITE_MAP_TILE_URL\`)를 통해 내부 서버 주소로 즉시 전환할 수 있습니다.`,
    codeSnippet: {
      language: 'typescript',
      description: 'Leaflet 내부 타일 레이어 호출 구현 코드',
      code: `// Leaflet 내부 폐쇄망 타일 레이어 등록
const internalTileLayer = L.tileLayer(
  'http://192.168.10.50:8080/styles/osm-bright/{z}/{x}/{y}.png',
  {
    minZoom: 10,
    maxZoom: 18,
    attribution: '서울특별시 종로구 내부 관제 지도',
    crossOrigin: true
  }
);

map.addLayer(internalTileLayer);`,
    },
  },
  {
    id: 'verification-offline',
    title: '8. 외부 네트워크 요청 차단 검증 (Zero Egress)',
    summary: '브라우저 및 서버 계층에서 1바이트의 외부 통신도 발생하지 않는지 감증하는 절차',
    content: `관제 시스템이 진정한 폐쇄망 호환성을 갖추었는지 감사(Audit)하기 위한 3단계 점검 절차입니다.

1. **브라우저 개발자 도구 (F12) 네트워크 탭 검증**:
   - \`Offline\` 모드 또는 비행기 모드로 전환 후 새로고침
   - 외부 도메인(\`fonts.googleapis.com\`, \`cdnjs.cloudflare.com\`, \`tile.openstreetmap.org\`)으로의 DNS/HTTP 요청이 0건인지 확인
2. **리눅스 서버 계층 통신 검증**:
   - \`tcpdump -i any not net 192.168.0.0/16 -n\` 실행 시 패킷 발생 전무 확인
3. **로컬 에셋 번들링 확인**:
   - Leaflet CSS, Lucide 아이콘, 웹폰트가 모두 로컬 빌드 번들(\`/assets/*.js\`, \`/assets/*.css\`) 내에 인라인/패키징되어 있는지 확인`,
    codeSnippet: {
      language: 'bash',
      description: '서버 단 외부 유출 통신 모니터링 명령어',
      code: `# 외부 인터넷으로 나가는 트래픽 감시 (감사 로그용)
sudo tcpdump -i eth0 -nn "dst not net 192.168.0.0/16 and dst not net 10.0.0.0/8 and dst not net 127.0.0.1"`,
    },
  },
  {
    id: 'data-update-pipeline',
    title: '9. 정기 지도 데이터 갱신 파이프라인',
    summary: '새로운 도로나 건물이 변경되었을 때 폐쇄망 지도를 안전하게 업데이트하는 절차',
    content: `지리 데이터는 도로 공사, 건물 신축 등에 따라 주기적(예: 분기 1회 또는 반기 1회)으로 갱신이 필요합니다.
- **다운타임 없는 무중단 교체**:
  1. 신규 \`jongno_2026Q4.mbtiles\` 파일을 \`/data/\` 디렉토리에 복사
  2. \`config.json\`의 파일명을 신규 파일로 변경하거나 심볼릭 링크(\`ln -sfn jongno_2026Q4.mbtiles jongno_current.mbtiles\`) 갱신
  3. TileServer GL 컨테이너 재시작 (\`docker restart jongno_tileserver\`) - 2초 미만 소요`,
    codeSnippet: {
      language: 'bash',
      description: '심볼릭 링크를 활용한 0초 다운타임 MBTiles 갱신',
      code: `# 심볼릭 링크 갱신
ln -sfn /data/jongno_2026_q4.mbtiles /data/jongno.mbtiles
docker restart jongno_tileserver`,
    },
  },
  {
    id: 'security-hardening',
    title: '10. 폐쇄망 관제 서버 보안 강화 규정',
    summary: '내부 망 침투 및 보안 사고를 방지하기 위한 서버 인프라 하드닝 가이드',
    content: `1. **비루트(Rootless) 컨테이너 실행**: \`user: "1001:1001"\`을 지정하여 호스트 권한 탈취 원천 차단
2. **읽기 전용 마운트**: MBTiles 데이터 디렉토리를 \`:ro\`(Read-Only)로 마운트하여 파일 위변조 방지
3. **포트 바인딩 제한**: 0.0.0.0 대신 인가된 내부 관리망 IP(예: \`192.168.10.20:8080:8080\`)에만 바인딩
4. **리버스 프록시(Nginx) 구성**: TLS 암호화(내부 사설 CA 인증서) 및 관제망 클라이언트 IP 화이트리스트 적용`,
    codeSnippet: {
      language: 'nginx',
      description: '내부 Nginx 리버스 프록시 보안 설정 예시',
      code: `server {
    listen 443 ssl http2;
    server_name gis-jongno.internal.local;

    ssl_certificate /etc/ssl/internal_gis.crt;
    ssl_certificate_key /etc/ssl/internal_gis.key;

    # 내부 관제단말 대역만 허용
    allow 192.168.10.0/24;
    deny all;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        add_header X-Content-Type-Options nosniff;
    }
}`,
    },
  },
];

export interface StorageEstimateItem {
  category: string;
  item: string;
  jongnoEstimatedSize: string;
  seoulEstimatedSize: string;
  notes: string;
}

export const STORAGE_ESTIMATES: StorageEstimateItem[] = [
  {
    category: '원본 지리 데이터',
    item: 'OSM 원본 PBF 데이터',
    jongnoEstimatedSize: '약 15 MB (추정치)',
    seoulEstimatedSize: '약 160 MB (추정치)',
    notes: '전국 pbf 중 종로구/서울 영역 추출본',
  },
  {
    category: '변환 타일 데이터',
    item: 'MBTiles 지도 타일 (Zoom 0~17)',
    jongnoEstimatedSize: '약 45 MB (추정치)',
    seoulEstimatedSize: '약 380 MB (추정치)',
    notes: '건물, 도로망, 하천, POI 포함 단일 파일',
  },
  {
    category: '렌더링 에셋',
    item: '지도 스타일(JSON) 및 글리프(폰트)',
    jongnoEstimatedSize: '약 75 MB (추정치)',
    seoulEstimatedSize: '약 75 MB (추정치)',
    notes: 'Noto Sans CKR 로컬 폰트 글리프 포함',
  },
  {
    category: '컨테이너 엔진',
    item: 'TileServer GL Docker 이미지',
    jongnoEstimatedSize: '약 340 MB (추정치)',
    seoulEstimatedSize: '약 340 MB (추정치)',
    notes: 'Node.js/MapLibre 네이티브 렌더러 베이스',
  },
  {
    category: '런타임 캐시',
    item: '서버 메모리 캐시 및 임시 파일',
    jongnoEstimatedSize: '약 100 MB (추정치)',
    seoulEstimatedSize: '약 300 MB (추정치)',
    notes: '인메모리 타일 캐시 풀 할당량',
  },
  {
    category: '전체 합계',
    item: '전체 예상 필요 저장 공간',
    jongnoEstimatedSize: '약 575 MB (추정치)',
    seoulEstimatedSize: '약 1.25 GB (추정치)',
    notes: '※ 1GB USB 매체 하나로 종로구 전체 관제망 완벽 반입 가능',
  },
];

export const SERVER_HARDWARE_SPECS = {
  minimum: {
    cpu: '2 Core (x86_64 또는 ARM64)',
    ram: '2 GB RAM',
    disk: '10 GB SSD (OS 포함)',
    os: 'Ubuntu 22.04 LTS / Rocky Linux 9 / RHEL 8+',
    network: '1 Gbps 내부 이더넷 (외부 인터넷 차단)',
  },
  recommended: {
    cpu: '4 Core 이상',
    ram: '4 GB ~ 8 GB RAM',
    disk: '50 GB NVMe SSD (캐시 및 정기 백업본 보관)',
    os: 'Ubuntu 24.04 LTS / RHEL 9',
    network: '1 Gbps ~ 10 Gbps 고속 내부 관제 백본망',
  },
};
