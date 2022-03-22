// モバイルフラグ
GSIBV.CONFIG.MOBILE = true;


GSIBV.CONFIG.MENU = [
/*  {
    "id": "eng",
    "title": "English"
  },*/
  {
    "id": "help",
    "title": "ヘルプ"
  },
  {
    "id": "gsimaps",
    "title": "地理院地図で表示"
  },
  {
    "id":"centercross",
    "type":"check",
    "title":"中心十字線"
  },
  {
    "id":"zoomguide",
    "type":"check",
  	"title":"表示ズームの案内"
  },
  {
    "id":"draw",
  	"title":"作図"
  },
  {
    "id":"measure",
  	"title":"計測"
  },
  {
    "id":"danmen",
  	"title":"断面図"
  },
  {
    "id":"to-pc",
    "title": "PC版で表示"
  }
];

GSIBV.CONFIG.TOOLTIP = {};
// 断面図のツールチップ
GSIBV.CONFIG.TOOLTIP.DANMEN = {
  "FLAT" : "縦横比が1：1になります",
  "BASE_0" : "縦軸の下限値を0mにします",
  "BASE_LO" : "縦軸の下限値を指定した経路の最低標高にします",
  "RESET" : "縦横比、縦軸メモリを初期状態に戻します",
  "SAVE_IMAGE" : "グラフを画像として保存します",
  "SAVE_CSV" : "指定した経路を300等分した点の緯度、経度、標高、始点からの距離をCSV形式で保存します",
  "SAVE_GEOJSON" : "指定した経路をGeoJSON形式で保存します",
  "SAVE_KML" : "指定した経路をKML形式で保存します"
};
