GSIBV.CONFIG = {};

// 編集不可フラグ
//GSIBV.CONFIG.ReadOnly = true;


// 画面操作不可時には追加を多くし、操作可能になったら休みを多くする
GSIBV.CONFIG.LayerAppend = {
  "count" : 200, // 【操作不可時】一回の処理で追加するレイヤ数（デフォルト200）
  "interval" : 0, // 【操作不可時】読み込み中システムに処理をさせる時間(ミリ秒)（デフォルト10）
  "count2" : 50, // 一回の処理で追加するレイヤ数（デフォルト50）
  "interval2" : 0, // 読み込み中システムに処理をさせる時間(ミリ秒)（デフォルト200）
};

GSIBV.CONFIG.EditRefreshInterval = 1500; // 編集されたスタイルを地図に反映する間隔


// バイナリタイル読込状態の表示設定
// full-righttop: 画面を覆った後右上に表示
// full: ずっと画面を覆う
// righttop: 右上のみ
// none: 表示なし
GSIBV.CONFIG.ProgressMode = 'righttop';


// コンテキストメニュー右に表示されるプロパティの表示項目を指定する
// この指定がない場合、全てが表示される
GSIBV.CONFIG.ComtextMenuProps = [
  "ftCode",
  "annoCtg",
  "annoChar", 
  "knj",
  "kana",
  "motorway",
  "rdCtg",    
  "tollSect",
  "medSect",
  "rnkWidth",
  "snglDbl",
  "railState",
  "railTunnel",
  "nRNo",
  "uRNo",
  "alti",
  "depth",
  "altiDpth",
  "name"
];

// コンテキストメニュー右に表示されるプロパティの表示項目の値を変換する
// この指定がない場合、元の値がそのまま表示される

GSIBV.CONFIG.ComtextMenuValues = {
  "motorway" : {
    "0" : "高速道路以外",
    "1" : "高速道路",
    "9" : "不明"
  },
  "rdCtg" : {
    "0" : "国道",
    "1" : "都道府県道",
    "2" : "市区町村道",
    "3" : "高速自動車国道等",
    "5" : "その他",
    "6" : "不明"
  },
  "tollSect" : {
    "0" : "無料",
    "1" : "有料",
    "2" : "暫定無料",
    "9" : "不明"
  },
  "medSect" : {
    "0" : "無",
    "1" : "有"
  },
  "rnkWidth" : {
    "0" : "3m未満",
    "1" : "3m-5:5m未満",
    "2" : "5.5m-13m未満",
    "3" : "13m-19.5m未満",
    "4" : "19.5m以上",
    "6" : "不明"
  },
  "snglDbl" : {
    "0" : "非表示",
    "1" : "単線",
    "2" : "複線以上",
    "3" : "側線",
    "4" : "駅部分"
  },
  "railState" : {
    "0" : "通常部",
    "1" : "橋・高架",
    "2" : "トンネル",
    "3" : "地下",
    "4" : "雪覆い",
    "5" : "運休中",
    "6" : "その他"
  },
  "railTunnel" : {
    "0" : "地上",
    "100" : "トンネル",
    "200" : "雪覆い",
    "300" : "地下",
    "400" : "路面",
    "500" : "坑口無しトンネル"
  }
};


GSIBV.CONFIG.Sprite = {
  "defaultGroup": "std",
  "list": [
    {
      "id": "std",
      "title": "標準地図",
      "url": "./sprite/std"
    },
    {
      "id": "pale",
      "title": "淡色地図",
      "url": "./sprite/pale"
    }
  ]
};


//ベクトルタイルの読み込むズーム設定
GSIBV.CONFIG.VectorTileSourceList = [
  {"minzoom":5,"maxzoom":18} // ZL5～18までそれぞれのZLのタイル使用
];
/*
//ZL15以降はZL15のタイルを使用する例
GSIBV.CONFIG.VectorTileSourceList = [
  {"minzoom":5,"maxzoom":15} // ZL5～15までそれぞれのZLのタイル使用、それ以降は15が使用される
];

//ZL5,9,12,15,18のタイルを使用する例
GSIBV.CONFIG.VectorTileSourceList =[
  {"minzoom":5,"maxzoom":5},
  {"minzoom":9,"maxzoom":9}, 
  {"minzoom":12,"maxzoom":12},
  {"minzoom":15,"maxzoom":15},
  {"minzoom":18,"maxzoom":18}
];
*/


GSIBV.CONFIG.RECOMMEND = [

  {
    "id": "vstd",
    "type": "binaryvector",
    "title": "標準地図",
    "thumbnail": "./image/thumb/std.png",
    "url": "./data/std.json",
    "html": "標準地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },
  /*
  {
    "id": "std",
    "type": "raster",
    "title": "標準地図",
    "thumbnail": "./image/thumb/std.png",
    "url": "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
    "legendUrl": "https://maps.gsi.go.jp/development/ichiran.html#std"
  },
  {
      "id" : "seamlessphoto",
      "type" : "raster",
      "title" : "シームレス",
      "thumbnail" : "./image/thumb/ort.png" ,
      "url" : "https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg",
      "html": "<div class=\"gsi_layerinfo_subtitle\">ズームレベル2～8:「世界衛星モザイク画像」<br>ズームレベル9～13:「全国ランドサットモザイク画像」<br>ズームレベル14～18:「シームレス空中写真」<br>シームレス空中写真は、国土地理院が保有する複数種別の空中写真から、各地区における最新の写真を抽出・組み合わせて作成した写真レイヤです。</div><a target=\"_blank\" href=\"https://cyberjapandata.gsi.go.jp/legend/seamlessphoto.pdf\">（詳細解説）</a><div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },
  {
      "id" : "sample03",
      "type" : "binaryvector",
      "title" : "描画テスト",
      "thumbnail" : "./image/thumb/sample03.png" ,
      "url" : "./data/current2.json"
  },
  
  {
    "id": "pale",
    "type": "raster",
    "title": "淡色地図",
    "thumbnail": "./image/thumb/pale.png",
    "url": "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png",
    "legendUrl": "https://maps.gsi.go.jp/development/ichiran.html#pale"
  },
*/
  {
    "id": "vpale",
    "type": "binaryvector",
    "title": "淡色地図",
    "thumbnail": "./image/thumb/pale.png",
    "url": "./data/pale.json",
    "html": "淡色地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },

  {
    "id": "vblank",
    "type": "binaryvector",
    "title": "白地図",
    "thumbnail": "./image/thumb/blank.png",
    "url": "./data/blank.json",
    "html": "白地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },

  /*
  {
    "id": "blank",
    "type": "raster",
    "title": "白地図",
    "thumbnail": "./image/thumb/blank.png",
    "url": "https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png",
    "legendUrl": "https://maps.gsi.go.jp/development/ichiran.html#blank"
  },
  */
  
  {
    "id": "photo",
    "type": "raster",
    "title": "写真",
    "thumbnail": "./image/thumb/ort.png",
    "url": "https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg",
    "html": "<div class=\"gsi_layerinfo_subtitle\">ズームレベル2～8:「世界衛星モザイク画像」<br>ズームレベル9～13:「全国ランドサットモザイク画像」<br>ズームレベル14～18:「シームレス空中写真」<br>シームレス空中写真は、国土地理院が保有する複数種別の空中写真から、各地区における最新の写真を抽出・組み合わせて作成した写真レイヤです。</div><a target=\"_blank\" href=\"https://cyberjapandata.gsi.go.jp/legend/seamlessphoto.pdf\">（詳細解説）</a><div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },  
  {
    "id": "photolabel",
    "type": "layerset",
    "title": "写真＋注記",
    "thumbnail": "./image/thumb/photo_label.png",
    "url": "",
    "layers": [
      {
        "id": "photo2",
        "type": "raster",
        "title" : "写真",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg",
        "html": "<div class=\"gsi_layerinfo_subtitle\">ズームレベル2～8:「世界衛星モザイク画像」<br>ズームレベル9～13:「全国ランドサットモザイク画像」<br>ズームレベル14～18:「シームレス空中写真」<br>シームレス空中写真は、国土地理院が保有する複数種別の空中写真から、各地区における最新の写真を抽出・組み合わせて作成した写真レイヤです。</div><a target=\"_blank\" href=\"https://cyberjapandata.gsi.go.jp/legend/seamlessphoto.pdf\">（詳細解説）</a><div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
      },
      {
        "id": "vlabel",
        "type": "binaryvector",
        "title" : "注記",
        "url": "./data/label.json"
      }
    ]
  },
  {
    "id": "lvlabel",
    "type": "binaryvector",
    "title": "大きい文字",
    "thumbnail": "./image/thumb/l_label.png",
    "url": "./data/llabel.json",
    "html": "標準地図（大きい文字）<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },
  {
    "id": "v2std",
    "type": "binaryvector",
    "title": "標準地図②",
    "thumbnail": "./image/thumb/std.png",
    "url": "./data/std2.json",
    "html": "標準地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },
  {
    "id": "v2pale",
    "type": "binaryvector",
    "title": "淡色地図②",
    "thumbnail": "./image/thumb/pale.png",
    "url": "./data/pale2.json",
    "html": "淡色地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },
  {
    "id": "v2blank",
    "type": "binaryvector",
    "title": "白地図②",
    "thumbnail": "./image/thumb/blank.png",
    "url": "./data/blank2.json",
    "html": "白地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  }

  /*
  {
      "id" : "sample02",
      "type" : "binaryvector",
      "title" : "ベクトルタイル[標準地図]",
      "thumbnail" : "./image/thumb/sample02.png" ,
      "url" : "./data/current.json",
      "html" : "【バイナリベクトルタイル】標準地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },
  {
      "id" : "sample04",
      "type" : "binaryvector",
      "title" : "ベクトルタイル[シンプル]",
      "thumbnail" : "./image/thumb/sample04.png" ,
      "url" : "./data/current-simple.json",
      "html" : "【バイナリベクトルタイル】シンプルな地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  }
  */
];

// トップ階層の順序
GSIBV.CONFIG.TOPORDER = [
  "注記",
  "記号",
  "境界",
  "道路",
  "鉄道",
  "航路",
  "建物",
  "交通構造物",
  "構造物",
  "海岸線",
  "河川",
  "湖池",
  "水域",
  "標高",
  "等高線等深線",
  "地形"
];

GSIBV.CONFIG.STYLETEMPLATE = [
  {
    "id": "std",
    "title": "標準地図",
    "url": "./data/std.json"
  },{
    "id": "pale",
    "title": "淡色地図",
    "url": "./data/pale.json"
  },{
    "id": "blank",
    "title": "白地図",
    "url": "./data/blank.json"
  },
  {
    "id": "label",
    "title": "注記のみ",
    "url": "./data/label.json"
  }
];

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
  	"title":"中心十字線"
  }

];


GSIBV.CONFIG.GSIMAPLAYERS = [

  {
    "url": 'https://maps.gsi.go.jp/layers_txt/layers1.txt'
  },
  {
    "url": 'https://maps.gsi.go.jp/layers_txt/layers2.txt'
  },
  {
    "url": 'https://maps.gsi.go.jp/layers_txt/layers3.txt'
  },
  {
    "url": 'https://maps.gsi.go.jp/layers_txt/layers4.txt'
  },
  {
    "url": 'https://maps.gsi.go.jp/layers_txt/layers_topic_chirikyoiku.txt'
  }
];
