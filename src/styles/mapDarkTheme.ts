// =====================================================================
// 다크모드 지도 스타일 설정 파일 (Dark Mode Map Theme Specification)
// 상단의 DARK_MAP_COLORS 객체에서 원하는 색상 코드만 변경하면,
// 지도 전체의 레이어에 자동으로 즉시 반영됩니다.
// =====================================================================

export const DARK_MAP_COLORS = {
      // 1. 대지 및 건물 (Land & Buildings)
      land: "#202a36",              // 기본 전체 대지/배경색
      landuseResidential: "#263240",// 주거 및 시가지 구역 대지 (반투명 오버레이)
      buildingFill: "#283341",      // 건물 면 채움색
      buildingOutline: "#1c2430",   // 건물 외곽 테두리선

      // 2. 수계 및 하천 (Water)
      water: "#33435d",             // 하천 및 바다 채움색 (네이버 한강 컬러)
      waterway: "#33435d",          // 청계천 등 실개천/수로 선
      waterLabel: "#728cb3",        // 하천 명칭 텍스트

      // 3. 녹지 및 공원 (Parks & Greenery)
      park: "#243a36",              // 공원 및 궁궐 녹지 (경복궁, 창덕궁, 탑골공원)
      parkOutline: "#1c2e2a",       // 공원 및 산림 외곽 테두리선
      woodForest: "#223833",        // 산림, 숲, 잔디 (북악산, 인왕산, 낙산 등)

      // 4. 고속도로 및 주요 도로망 (Roads)
      roadCasing: "#18202a",        // 도로 외곽 다크 테두리선
      motorway: "#8a6846",          // 고속도로 1: 도시고속/고속국도 (내부순환로, 서울문산, 강변북로, 올림픽대로 등)
      motorwayTunnel: "#8a6846",    // 고속화도로 터널 및 원거리
      nationalRoad: "#7c785b",      // 고속도로 2: 국도/주요 간선대로 (회색 톤으로 통일: 세종대로, 종로, 마포대교, 한강대교 등)
      nationalRoadSubtle: "#525762",// 원거리 국도/간선
      secondaryRoad: "#525762",     // 일반 보조 간선도로 (사직로, 창경궁로, 대학로 등)
      minorRoad: "#363d4a",         // 일반 골목길 / 이면도로
      path: "#2c3542",              // 보행로 / 산책로

      // 5. 철도 및 경계 (Railways & Boundaries)
      railway: "#333d4d",           // 지상 철도선
      railwayDash: "#455266",       // 철도 점선
      boundary: "#4a5b73",          // 행정 구역 경계선

      // 6. 비행장 (수색비행장 등 Aeroway)
      aerowayArea: "#242f3d",       // 비행장 구역
      aerowayRunway: "#2b3848",     // 활주로
      aerowayTaxiway: "#263342",    // 유도로
      aerowayCasing: "#1a222c",     // 활주로 테두리

      // 7. 텍스트 라벨 & 헤일로 (Labels & Halos)
      textCity: "#c7cbd4",          // 동/구/도시 명칭 텍스트
      textMajorRoad: "#a6b2c4",     // 대로명 텍스트
      textMinorRoad: "#7d899b",     // 골목길/소로명 텍스트
      textSecondary: "#8c97a8",     // 기타 시설물 텍스트
      textHalo: "#151c26",          // 텍스트 외곽 다크 헤일로 (가독성 확보 그림자)
};

export function createDarkMapStyle(
      origin: string = typeof window !== 'undefined' ? window.location.origin : '',
      colors: typeof DARK_MAP_COLORS = DARK_MAP_COLORS,
      options: { showRoadNumbers?: boolean } = { showRoadNumbers: true }
): any {
      const c = colors;
      return {
            version: 8,
            sources: {
                  openmaptiles: {
                        type: 'vector',
                        tiles: [`${origin}/tiles/planet/{z}/{x}/{y}.pbf`],
                        minzoom: 0,
                        maxzoom: 14,
                  },
            },
            sprite: `${origin}/sprites/ofm`,
            glyphs: `${origin}/fonts/{fontstack}/{range}.pbf`,
            layers: [
                  {
                        "id": "background",
                        "type": "background",
                        "paint": {
                              "background-color": c.land
                        }
                  },
                  {
                        "id": "park",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "park",
                        "filter": [
                              "match",
                              [
                                    "geometry-type"
                              ],
                              [
                                    "MultiPolygon",
                                    "Polygon"
                              ],
                              true,
                              false
                        ],
                        "paint": {
                              "fill-color": c.park,
                              "fill-outline-color": c.parkOutline,
                              "fill-opacity": 0.9
                        }
                  },
                  {
                        "id": "water",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "water",
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "MultiPolygon",
                                          "Polygon"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "!=",
                                    [
                                          "get",
                                          "brunnel"
                                    ],
                                    "tunnel"
                              ]
                        ],
                        "paint": {
                              "fill-antialias": true,
                              "fill-color": c.water,
                              "fill-opacity": 1
                        }
                  },
                  {
                        "id": "landcover_ice_shelf",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "landcover",
                        "maxzoom": 8,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "MultiPolygon",
                                          "Polygon"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "subclass"
                                    ],
                                    "ice_shelf"
                              ]
                        ],
                        "paint": {
                              "fill-color": "#2a3848",
                              "fill-opacity": 0.7
                        }
                  },
                  {
                        "id": "landcover_glacier",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "landcover",
                        "maxzoom": 8,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "MultiPolygon",
                                          "Polygon"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "subclass"
                                    ],
                                    "glacier"
                              ]
                        ],
                        "paint": {
                              "fill-color": "#2a3848",
                              "fill-opacity": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    0,
                                    1,
                                    8,
                                    0.5
                              ]
                        }
                  },
                  {
                        "id": "landuse_residential",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "landuse",
                        "maxzoom": 16,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "MultiPolygon",
                                          "Polygon"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "residential"
                              ]
                        ],
                        "paint": {
                              "fill-color": c.landuseResidential,
                              "fill-opacity": 0.7
                        }
                  },
                  {
                        "id": "landcover_wood",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "landcover",
                        "minzoom": 10,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "MultiPolygon",
                                          "Polygon"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "wood",
                                          "forest",
                                          "grass",
                                          "scrub"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "paint": {
                              "fill-color": c.woodForest,
                              "fill-opacity": 0.95,
                              "fill-outline-color": c.parkOutline
                        }
                  },
                  {
                        "id": "waterway",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "waterway",
                        "filter": [
                              "match",
                              [
                                    "geometry-type"
                              ],
                              [
                                    "LineString",
                                    "MultiLineString"
                              ],
                              true,
                              false
                        ],
                        "paint": {
                              "line-color": c.water,
                              "line-width": 2
                        }
                  },
                  {
                        "id": "building",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "building",
                        "minzoom": 12,
                        "paint": {
                              "fill-antialias": true,
                              "fill-color": c.buildingFill,
                              "fill-outline-color": c.buildingOutline,
                              "fill-opacity": 0.8
                        }
                  },
                  {
                        "id": "tunnel_motorway_casing",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 6,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "==",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          "tunnel"
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          [
                                                "motorway",
                                                "trunk",
                                                "trunk_construction"
                                          ],
                                          true,
                                          false
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-cap": "butt",
                              "line-join": "miter"
                        },
                        "paint": {
                              "line-color": c.roadCasing,
                              "line-opacity": 1,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.4
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    5.8,
                                    0,
                                    6,
                                    3,
                                    20,
                                    40
                              ]
                        }
                  },
                  {
                        "id": "tunnel_motorway_inner",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 6,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "==",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          "tunnel"
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          [
                                                "motorway",
                                                "trunk",
                                                "trunk_construction"
                                          ],
                                          true,
                                          false
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.motorwayTunnel,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.4
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    4,
                                    2,
                                    6,
                                    1.3,
                                    20,
                                    30
                              ]
                        }
                  },
                  {
                        "id": "aeroway-taxiway",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "aeroway",
                        "minzoom": 12,
                        "filter": [
                              "match",
                              [
                                    "get",
                                    "class"
                              ],
                              [
                                    "taxiway"
                              ],
                              true,
                              false
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.aerowayTaxiway,
                              "line-opacity": 1,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.55
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    13,
                                    1.8,
                                    20,
                                    20
                              ]
                        }
                  },
                  {
                        "id": "aeroway-runway-casing",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "aeroway",
                        "minzoom": 11,
                        "filter": [
                              "match",
                              [
                                    "get",
                                    "class"
                              ],
                              [
                                    "runway"
                              ],
                              true,
                              false
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.aerowayCasing,
                              "line-opacity": 1,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.5
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    11,
                                    6,
                                    17,
                                    55
                              ]
                        }
                  },
                  {
                        "id": "aeroway-area",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "aeroway",
                        "minzoom": 4,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "MultiPolygon",
                                          "Polygon"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "runway",
                                          "taxiway"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "paint": {
                              "fill-color": c.aerowayArea,
                              "fill-opacity": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    13,
                                    0,
                                    14,
                                    1
                              ]
                        }
                  },
                  {
                        "id": "aeroway-runway",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "aeroway",
                        "minzoom": 11,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "runway"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.aerowayRunway,
                              "line-opacity": 1,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.5
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    11,
                                    4,
                                    17,
                                    50
                              ]
                        }
                  },
                  {
                        "id": "road_area_pier",
                        "type": "fill",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "MultiPolygon",
                                          "Polygon"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "pier"
                              ]
                        ],
                        "paint": {
                              "fill-antialias": true,
                              "fill-color": c.land
                        }
                  },
                  {
                        "id": "road_pier",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "pier"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.land,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.2
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    15,
                                    1,
                                    17,
                                    4
                              ]
                        }
                  },
                  {
                        "id": "highway_path",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "path"
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.path,
                              "line-opacity": 0.9,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.2
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    13,
                                    1,
                                    20,
                                    10
                              ]
                        }
                  },
                  {
                        "id": "highway_minor",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 8,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "minor",
                                          "service",
                                          "track"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.minorRoad,
                              "line-opacity": 0.9,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.55
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    13,
                                    1.8,
                                    20,
                                    20
                              ]
                        }
                  },
                  {
                        "id": "highway_major_casing",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 11,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "primary",
                                          "secondary",
                                          "tertiary",
                                          "trunk",
                                          "trunk_construction"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "line-cap": "butt",
                              "line-join": "miter"
                        },
                        "paint": {
                              "line-color": c.roadCasing,
                              "line-dasharray": [
                                    12,
                                    0
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.3
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    10,
                                    3,
                                    20,
                                    23
                              ]
                        }
                  },
                  {
                        "id": "highway_major_inner",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 11,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "primary",
                                          "secondary",
                                          "tertiary",
                                          "trunk",
                                          "trunk_construction"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    ["trunk", "trunk_construction"],
                                    c.motorway,
                                    "primary",
                                    c.nationalRoad,
                                    c.secondaryRoad
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.3
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    10,
                                    2,
                                    20,
                                    20
                              ]
                        }
                  },
                  {
                        "id": "highway_major_subtle",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "maxzoom": 11,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "primary",
                                          "secondary",
                                          "tertiary",
                                          "trunk",
                                          "trunk_construction"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "trunk",
                                    c.motorwayTunnel,
                                    "primary",
                                    c.nationalRoadSubtle,
                                    "#3e434e"
                              ],
                              "line-width": 2
                        }
                  },
                  {
                        "id": "highway_motorway_casing",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 6,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "match",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          [
                                                "bridge",
                                                "tunnel"
                                          ],
                                          false,
                                          true
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          [
                                                "motorway",
                                                "trunk",
                                                "trunk_construction"
                                          ],
                                          true,
                                          false
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-cap": "butt",
                              "line-join": "miter"
                        },
                        "paint": {
                              "line-color": c.roadCasing,
                              "line-dasharray": [
                                    2,
                                    0
                              ],
                              "line-opacity": 1,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.4
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    5.8,
                                    0,
                                    6,
                                    3,
                                    20,
                                    40
                              ]
                        }
                  },
                  {
                        "id": "highway_motorway_inner",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 6,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "match",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          [
                                                "bridge",
                                                "tunnel"
                                          ],
                                          false,
                                          true
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          [
                                                "motorway",
                                                "trunk",
                                                "trunk_construction"
                                          ],
                                          true,
                                          false
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    5.8,
                                    "hsla(25, 45%, 35%, 0.5)",
                                    6,
                                    c.motorway
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.4
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    4,
                                    2,
                                    6,
                                    1.3,
                                    20,
                                    30
                              ]
                        }
                  },
                  {
                        "id": "highway_motorway_subtle",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "maxzoom": 6,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "motorway"
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.motorwayTunnel,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.4
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    4,
                                    2,
                                    6,
                                    1.3
                              ]
                        }
                  },
                  {
                        "id": "railway_transit",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 16,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "==",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          "transit"
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          [
                                                "tunnel"
                                          ],
                                          false,
                                          true
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.railway,
                              "line-width": 3
                        }
                  },
                  {
                        "id": "railway_transit_dashline",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 16,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "==",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          "transit"
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          [
                                                "tunnel"
                                          ],
                                          false,
                                          true
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.railwayDash,
                              "line-dasharray": [
                                    3,
                                    3
                              ],
                              "line-width": 2
                        }
                  },
                  {
                        "id": "railway_service",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 16,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "==",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          "rail"
                                    ],
                                    [
                                          "has",
                                          "service"
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.railway,
                              "line-width": 3
                        }
                  },
                  {
                        "id": "railway_service_dashline",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 16,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "rail"
                              ],
                              [
                                    "has",
                                    "service"
                              ]
                        ],
                        "layout": {
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.railwayDash,
                              "line-dasharray": [
                                    3,
                                    3
                              ],
                              "line-width": 2
                        }
                  },
                  {
                        "id": "railway",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 13,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "!",
                                          [
                                                "has",
                                                "service"
                                          ]
                                    ],
                                    [
                                          "==",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          "rail"
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.railway,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.3
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    16,
                                    3,
                                    20,
                                    7
                              ]
                        }
                  },
                  {
                        "id": "railway_dashline",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 13,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "!",
                                          [
                                                "has",
                                                "service"
                                          ]
                                    ],
                                    [
                                          "==",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          "rail"
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.railwayDash,
                              "line-dasharray": [
                                    3,
                                    3
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.3
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    16,
                                    2,
                                    20,
                                    6
                              ]
                        }
                  },
                  {
                        "id": "highway_motorway_bridge_casing",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 6,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "==",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          "bridge"
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          [
                                                "motorway",
                                                "trunk",
                                                "trunk_construction"
                                          ],
                                          true,
                                          false
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-cap": "butt",
                              "line-join": "miter"
                        },
                        "paint": {
                              "line-color": c.roadCasing,
                              "line-dasharray": [
                                    2,
                                    0
                              ],
                              "line-opacity": 1,
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.4
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    5.8,
                                    0,
                                    6,
                                    5,
                                    20,
                                    45
                              ]
                        }
                  },
                  {
                        "id": "highway_motorway_bridge_inner",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "transportation",
                        "minzoom": 6,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "all",
                                    [
                                          "==",
                                          [
                                                "get",
                                                "brunnel"
                                          ],
                                          "bridge"
                                    ],
                                    [
                                          "match",
                                          [
                                                "get",
                                                "class"
                                          ],
                                          [
                                                "motorway",
                                                "trunk",
                                                "trunk_construction"
                                          ],
                                          true,
                                          false
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    5.8,
                                    "hsla(25, 45%, 35%, 0.5)",
                                    6,
                                    c.motorway
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.4
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    4,
                                    2,
                                    6,
                                    1.3,
                                    20,
                                    30
                              ]
                        }
                  },
                  {
                        "id": "boundary_3",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "boundary",
                        "minzoom": 8,
                        "filter": [
                              "all",
                              [
                                    ">=",
                                    [
                                          "get",
                                          "admin_level"
                                    ],
                                    3
                              ],
                              [
                                    "<=",
                                    [
                                          "get",
                                          "admin_level"
                                    ],
                                    6
                              ],
                              [
                                    "!=",
                                    [
                                          "get",
                                          "maritime"
                                    ],
                                    1
                              ],
                              [
                                    "!=",
                                    [
                                          "get",
                                          "disputed"
                                    ],
                                    1
                              ],
                              [
                                    "!",
                                    [
                                          "has",
                                          "claimed_by"
                                    ]
                              ]
                        ],
                        "paint": {
                              "line-color": c.boundary,
                              "line-dasharray": [
                                    1,
                                    1
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "linear",
                                          1
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    7,
                                    1,
                                    11,
                                    2
                              ]
                        }
                  },
                  {
                        "id": "boundary_2",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "boundary",
                        "filter": [
                              "all",
                              [
                                    "==",
                                    [
                                          "get",
                                          "admin_level"
                                    ],
                                    2
                              ],
                              [
                                    "!=",
                                    [
                                          "get",
                                          "maritime"
                                    ],
                                    1
                              ],
                              [
                                    "!=",
                                    [
                                          "get",
                                          "disputed"
                                    ],
                                    1
                              ],
                              [
                                    "!",
                                    [
                                          "has",
                                          "claimed_by"
                                    ]
                              ]
                        ],
                        "layout": {
                              "line-cap": "round",
                              "line-join": "round"
                        },
                        "paint": {
                              "line-color": c.boundary,
                              "line-opacity": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    0,
                                    0.4,
                                    4,
                                    1
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    3,
                                    1,
                                    5,
                                    1.2,
                                    12,
                                    3
                              ]
                        }
                  },
                  {
                        "id": "boundary_disputed",
                        "type": "line",
                        "source": "openmaptiles",
                        "source-layer": "boundary",
                        "filter": [
                              "all",
                              [
                                    "!=",
                                    [
                                          "get",
                                          "maritime"
                                    ],
                                    1
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "disputed"
                                    ],
                                    1
                              ]
                        ],
                        "paint": {
                              "line-color": c.boundary,
                              "line-dasharray": [
                                    1,
                                    2
                              ],
                              "line-width": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    3,
                                    1,
                                    5,
                                    1.2,
                                    12,
                                    3
                              ]
                        }
                  },
                  {
                        "id": "waterway_line_label",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "waterway",
                        "minzoom": 10,
                        "filter": [
                              "match",
                              [
                                    "geometry-type"
                              ],
                              [
                                    "LineString",
                                    "MultiLineString"
                              ],
                              true,
                              false
                        ],
                        "layout": {
                              "symbol-placement": "line",
                              "symbol-spacing": 350,
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Italic"
                              ],
                              "text-letter-spacing": 0.2,
                              "text-max-width": 5,
                              "text-size": 14
                        },
                        "paint": {
                              "text-color": c.waterLabel,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 1.5
                        }
                  },
                  {
                        "id": "water_name_point_label",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "water_name",
                        "filter": [
                              "match",
                              [
                                    "geometry-type"
                              ],
                              [
                                    "MultiPoint",
                                    "Point"
                              ],
                              true,
                              false
                        ],
                        "layout": {
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Italic"
                              ],
                              "text-letter-spacing": 0.2,
                              "text-max-width": 5,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    0,
                                    10,
                                    8,
                                    14
                              ]
                        },
                        "paint": {
                              "text-color": c.waterLabel,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 1.5
                        }
                  },
                  {
                        "id": "water_name_line_label",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "water_name",
                        "filter": [
                              "match",
                              [
                                    "geometry-type"
                              ],
                              [
                                    "LineString",
                                    "MultiLineString"
                              ],
                              true,
                              false
                        ],
                        "layout": {
                              "symbol-placement": "line",
                              "symbol-spacing": 350,
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Italic"
                              ],
                              "text-letter-spacing": 0.2,
                              "text-max-width": 5,
                              "text-size": 14
                        },
                        "paint": {
                              "text-color": c.waterLabel,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 1.5
                        }
                  },
                  {
                        "id": "highway-name-path",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "transportation_name",
                        "minzoom": 15.5,
                        "filter": [
                              "==",
                              [
                                    "get",
                                    "class"
                              ],
                              "path"
                        ],
                        "layout": {
                              "symbol-placement": "line",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-rotation-alignment": "map",
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    13,
                                    12,
                                    14,
                                    13
                              ]
                        },
                        "paint": {
                              "text-color": c.textMinorRoad,
                              "text-halo-color": c.roadCasing,
                              "text-halo-width": 1.5
                        }
                  },
                  {
                        "id": "highway-name-minor",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "transportation_name",
                        "minzoom": 15,
                        "filter": [
                              "all",
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    [
                                          "minor",
                                          "service",
                                          "track"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "symbol-placement": "line",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-rotation-alignment": "map",
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    13,
                                    12,
                                    14,
                                    13
                              ]
                        },
                        "paint": {
                              "text-color": c.textMinorRoad,
                              "text-halo-blur": 0.5,
                              "text-halo-width": 1.5,
                              "text-halo-color": c.roadCasing
                        }
                  },
                  {
                        "id": "highway-name-major",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "transportation_name",
                        "minzoom": 12.2,
                        "filter": [
                              "match",
                              [
                                    "get",
                                    "class"
                              ],
                              [
                                    "primary",
                                    "secondary",
                                    "tertiary",
                                    "trunk",
                                    "trunk_construction"
                              ],
                              true,
                              false
                        ],
                        "layout": {
                              "symbol-placement": "line",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-rotation-alignment": "map",
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    13,
                                    12,
                                    14,
                                    13
                              ]
                        },
                        "paint": {
                              "text-color": c.textMajorRoad,
                              "text-halo-blur": 0.5,
                              "text-halo-width": 1.5,
                              "text-halo-color": c.roadCasing
                        }
                  },
                  {
                        "id": "highway-shield-non-us",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "transportation_name",
                        "minzoom": 11,
                        "filter": [
                              "all",
                              [
                                    "<=",
                                    [
                                          "get",
                                          "ref_length"
                                    ],
                                    6
                              ],
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "network"
                                    ],
                                    [
                                          "us-highway",
                                          "us-interstate",
                                          "us-state"
                                    ],
                                    false,
                                    true
                              ]
                        ],
                        "layout": {
                              "icon-image": [
                                    "concat",
                                    "road_",
                                    [
                                          "get",
                                          "ref_length"
                                    ]
                              ],
                              "icon-rotation-alignment": "viewport",
                              "icon-size": 1,
                              "symbol-placement": [
                                    "step",
                                    [
                                          "zoom"
                                    ],
                                    "point",
                                    11,
                                    "line"
                              ],
                              "symbol-spacing": 200,
                              "text-field": [
                                    "to-string",
                                    [
                                          "get",
                                          "ref"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-rotation-alignment": "viewport",
                              "text-size": 10
                        },
                        "paint": {}
                  },
                  {
                        "id": "highway-shield-us-interstate",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "transportation_name",
                        "minzoom": 11,
                        "filter": [
                              "all",
                              [
                                    "<=",
                                    [
                                          "get",
                                          "ref_length"
                                    ],
                                    6
                              ],
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "network"
                                    ],
                                    [
                                          "us-interstate"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "icon-image": [
                                    "concat",
                                    [
                                          "get",
                                          "network"
                                    ],
                                    "_",
                                    [
                                          "get",
                                          "ref_length"
                                    ]
                              ],
                              "icon-rotation-alignment": "viewport",
                              "icon-size": 1,
                              "symbol-placement": [
                                    "step",
                                    [
                                          "zoom"
                                    ],
                                    "point",
                                    7,
                                    "line",
                                    8,
                                    "line"
                              ],
                              "symbol-spacing": 200,
                              "text-field": [
                                    "to-string",
                                    [
                                          "get",
                                          "ref"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-rotation-alignment": "viewport",
                              "text-size": 10
                        },
                        "paint": {}
                  },
                  {
                        "id": "road_shield_us",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "transportation_name",
                        "minzoom": 12,
                        "filter": [
                              "all",
                              [
                                    "<=",
                                    [
                                          "get",
                                          "ref_length"
                                    ],
                                    6
                              ],
                              [
                                    "match",
                                    [
                                          "geometry-type"
                                    ],
                                    [
                                          "LineString",
                                          "MultiLineString"
                                    ],
                                    true,
                                    false
                              ],
                              [
                                    "match",
                                    [
                                          "get",
                                          "network"
                                    ],
                                    [
                                          "us-highway",
                                          "us-state"
                                    ],
                                    true,
                                    false
                              ]
                        ],
                        "layout": {
                              "icon-image": [
                                    "concat",
                                    [
                                          "get",
                                          "network"
                                    ],
                                    "_",
                                    [
                                          "get",
                                          "ref_length"
                                    ]
                              ],
                              "icon-rotation-alignment": "viewport",
                              "icon-size": 1,
                              "symbol-placement": [
                                    "step",
                                    [
                                          "zoom"
                                    ],
                                    "point",
                                    11,
                                    "line"
                              ],
                              "symbol-spacing": 200,
                              "text-field": [
                                    "to-string",
                                    [
                                          "get",
                                          "ref"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-rotation-alignment": "viewport",
                              "text-size": 10
                        },
                        "paint": {}
                  },
                  {
                        "id": "airport",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "aerodrome_label",
                        "minzoom": 11,
                        "filter": [
                              "all",
                              [
                                    "has",
                                    "iata"
                              ]
                        ],
                        "layout": {
                              "icon-image": "airport_11",
                              "icon-size": 1,
                              "text-anchor": "top",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-max-width": 9,
                              "text-offset": [
                                    0,
                                    0.6
                              ],
                              "text-optional": true,
                              "text-padding": 2,
                              "text-size": 12
                        },
                        "paint": {
                              "text-color": c.textSecondary,
                              "text-halo-blur": 0.5,
                              "text-halo-color": c.roadCasing,
                              "text-halo-width": 1
                        }
                  },
                  {
                        "id": "label_other",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "minzoom": 8,
                        "filter": [
                              "match",
                              [
                                    "get",
                                    "class"
                              ],
                              [
                                    "city",
                                    "continent",
                                    "country",
                                    "state",
                                    "town",
                                    "village"
                              ],
                              false,
                              true
                        ],
                        "layout": {
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Italic"
                              ],
                              "text-letter-spacing": 0.1,
                              "text-max-width": 9,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    8,
                                    9,
                                    12,
                                    10
                              ],
                              "text-transform": "uppercase"
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_village",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "minzoom": 9,
                        "filter": [
                              "==",
                              [
                                    "get",
                                    "class"
                              ],
                              "village"
                        ],
                        "layout": {
                              "icon-allow-overlap": true,
                              "icon-image": [
                                    "step",
                                    [
                                          "zoom"
                                    ],
                                    "circle_11_black",
                                    10,
                                    ""
                              ],
                              "icon-optional": false,
                              "icon-size": 0.2,
                              "text-anchor": "bottom",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-max-width": 8,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.2
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    7,
                                    10,
                                    11,
                                    12
                              ]
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_town",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "minzoom": 6,
                        "filter": [
                              "==",
                              [
                                    "get",
                                    "class"
                              ],
                              "town"
                        ],
                        "layout": {
                              "icon-allow-overlap": true,
                              "icon-image": [
                                    "step",
                                    [
                                          "zoom"
                                    ],
                                    "circle_11_black",
                                    10,
                                    ""
                              ],
                              "icon-optional": false,
                              "icon-size": 0.2,
                              "text-anchor": "bottom",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-max-width": 8,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.2
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    7,
                                    12,
                                    11,
                                    14
                              ]
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_state",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "minzoom": 5,
                        "maxzoom": 8,
                        "filter": [
                              "==",
                              [
                                    "get",
                                    "class"
                              ],
                              "state"
                        ],
                        "layout": {
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Italic"
                              ],
                              "text-letter-spacing": 0.2,
                              "text-max-width": 9,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    5,
                                    10,
                                    8,
                                    14
                              ],
                              "text-transform": "uppercase"
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_city",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "minzoom": 3,
                        "filter": [
                              "all",
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "city"
                              ],
                              [
                                    "!=",
                                    [
                                          "get",
                                          "capital"
                                    ],
                                    2
                              ]
                        ],
                        "layout": {
                              "icon-allow-overlap": true,
                              "icon-image": [
                                    "step",
                                    [
                                          "zoom"
                                    ],
                                    "circle_11_black",
                                    9,
                                    ""
                              ],
                              "icon-optional": false,
                              "icon-size": 0.4,
                              "text-anchor": "bottom",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Regular"
                              ],
                              "text-max-width": 8,
                              "text-offset": [
                                    0,
                                    -0.1
                              ],
                              "text-size": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.2
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    4,
                                    11,
                                    7,
                                    13,
                                    11,
                                    18
                              ]
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_city_capital",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "minzoom": 3,
                        "filter": [
                              "all",
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "city"
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "capital"
                                    ],
                                    2
                              ]
                        ],
                        "layout": {
                              "icon-allow-overlap": true,
                              "icon-image": [
                                    "step",
                                    [
                                          "zoom"
                                    ],
                                    "circle_11_black",
                                    9,
                                    ""
                              ],
                              "icon-optional": false,
                              "icon-size": 0.5,
                              "text-anchor": "bottom",
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Bold"
                              ],
                              "text-max-width": 8,
                              "text-offset": [
                                    0,
                                    -0.2
                              ],
                              "text-size": [
                                    "interpolate",
                                    [
                                          "exponential",
                                          1.2
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    4,
                                    12,
                                    7,
                                    14,
                                    11,
                                    20
                              ]
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_country_3",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "minzoom": 2,
                        "maxzoom": 9,
                        "filter": [
                              "all",
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "country"
                              ],
                              [
                                    ">=",
                                    [
                                          "get",
                                          "rank"
                                    ],
                                    3
                              ]
                        ],
                        "layout": {
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Bold"
                              ],
                              "text-max-width": 6.25,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    3,
                                    9,
                                    7,
                                    17
                              ]
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_country_2",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "maxzoom": 9,
                        "filter": [
                              "all",
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "country"
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "rank"
                                    ],
                                    2
                              ]
                        ],
                        "layout": {
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Bold"
                              ],
                              "text-max-width": 6.25,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    2,
                                    9,
                                    5,
                                    17
                              ]
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  },
                  {
                        "id": "label_country_1",
                        "type": "symbol",
                        "source": "openmaptiles",
                        "source-layer": "place",
                        "maxzoom": 9,
                        "filter": [
                              "all",
                              [
                                    "==",
                                    [
                                          "get",
                                          "class"
                                    ],
                                    "country"
                              ],
                              [
                                    "==",
                                    [
                                          "get",
                                          "rank"
                                    ],
                                    1
                              ]
                        ],
                        "layout": {
                              "text-field": [
                                    "coalesce",
                                    [
                                          "get",
                                          "name:ko"
                                    ],
                                    [
                                          "get",
                                          "name:nonlatin"
                                    ],
                                    [
                                          "get",
                                          "name"
                                    ],
                                    [
                                          "get",
                                          "name_en"
                                    ]
                              ],
                              "text-font": [
                                    "Noto Sans Bold"
                              ],
                              "text-max-width": 6.25,
                              "text-size": [
                                    "interpolate",
                                    [
                                          "linear"
                                    ],
                                    [
                                          "zoom"
                                    ],
                                    1,
                                    9,
                                    4,
                                    17
                              ]
                        },
                        "paint": {
                              "text-color": c.textCity,
                              "text-halo-blur": 1,
                              "text-halo-color": c.textHalo,
                              "text-halo-width": 2
                        }
                  }
            ],
      };
}
