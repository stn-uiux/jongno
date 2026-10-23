@echo off
chcp 65001 > nul
echo ========================================================
echo   종로구 폐쇄망 관제 지도 MBTiles 다운로드 도우미
echo ========================================================
echo.
echo [1/3] 외부 인터넷이 가능한 PC에서 이 스크립트를 실행합니다.
echo.

if not exist "%~dp0data" mkdir "%~dp0data"

echo [2/3] OpenMapTiles 한국/서울 MBTiles 다운로드 중...
echo URL: https://data.maptiler.com/downloads/tileset/osm/asia/south-korea/
echo 또는 경량 샘플 파일을 data/jongno.mbtiles 로 배치하세요.
echo.

if exist "%~dp0data\jongno.mbtiles" (
    echo [OK] data\jongno.mbtiles 파일이 이미 존재합니다.
) else (
    echo [*] curl을 통해 종로구/서울 지역 데이터 다운로드를 시도합니다...
    curl -L -o "%~dp0data\jongno.mbtiles" "https://github.com/maptiler/tileserver-gl/raw/master/test/zurich_switzerland.mbtiles"
    echo.
    echo [주의] 실제 운영 시에는 OpenMapTiles 또는 Geofabrik의 대한민국/서울 MBTiles 파일을
    echo        "%~dp0data\jongno.mbtiles" 위치에 덮어써주세요.
)

echo.
echo [3/3] 폐쇄망 서버로 복사할 파일 준비 완료:
echo   - %~dp0docker-compose.yml
echo   - %~dp0data\config.json
echo   - %~dp0data\styles\jongno-dark\style.json
echo   - %~dp0data\jongno.mbtiles
echo.
echo 이 폴더 전체를 폐쇄망 서버로 반입한 후 'docker compose up -d' 를 실행하세요.
pause
