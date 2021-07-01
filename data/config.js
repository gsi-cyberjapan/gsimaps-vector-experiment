GSIBV.CONFIG = {};

// 陰影起伏図の色設定
GSIBV.CONFIG.Hillshade = {
  "hillshade-exaggeration" : 0.3, // 不透明度の代わりに使用
  "hillshade-shadow-color": "#088a08",
  "hillshade-highlight-color": "#80ff00",
  "hillshade-accent-color" : "#000000"
};


// カラーパレットの色と配置

GSIBV.CONFIG.ColorPalette = {
  "Colors" : [
    ["1","rgb(0,0,0)"],
    ["2","rgb(100,100,100)"],
    ["3","rgb(140,140,140)"],
    ["4","rgb(200,200,200)"],
    ["5","rgb(255,255,255)"],
    ["6","rgb(231,39,65)"],
    ["7","rgb(255,122,122)"],
    ["8","rgb(255,135,75)"],
    ["9","rgb(255,255,0)"],
    ["10","rgb(200,160,60)"],
    ["11","rgb(255,220,150)"],
    ["12","rgb(255,230,190)"],
    ["13","rgb(0,90,60)"],
    ["14","rgb(61,151,56)"],
    ["15","rgb(100,195,115)"],
    ["16","rgb(20,90,255)"],
    ["17","rgb(0,176,236)"],
    ["18","rgb(190,210,255)"],
    ["19","rgb(43,52,137)"],
    ["20","rgb(96,25,134)"]
  ],
  "Placement" : [
    [ "1", "2", "3", "4", "5", "6", "7", "8", "9","12"],
    ["13","14","15","18","17","16","19","20","10","11"]
  ]
};


// 編集不可フラグ
//GSIBV.CONFIG.ReadOnly = true;

// PC版URL
GSIBV.CONFIG.URL = "./";
// モバイル版URL
GSIBV.CONFIG.MOBILE_FILENAME = "index_m.html";
GSIBV.CONFIG.MOBILEURL = "./" + GSIBV.CONFIG.MOBILE_FILENAME;



// モバイルフラグ
GSIBV.CONFIG.MOBILE = false;
GSIBV.CONFIG.GPS_FLYTO_ZOOM = 14;

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
    "1" : "3m-5.5m未満",
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


//ベクトルタイルの読み込むズーム設定(※廃止)
GSIBV.CONFIG.VectorTileSourceList = [
  {"minzoom":4,"maxzoom":17} // ZL4～17までそれぞれのZLのタイル使用
];

//ベクトルタイルの読み込むズーム設定(※廃止)
GSIBV.CONFIG.VectorTileSource = {"minzoom":4,"maxzoom":17};


/*
//ZL14以降はZL14のタイルを使用する例
GSIBV.CONFIG.VectorTileSourceList = [
  {"minzoom":4,"maxzoom":14} // ZL4～14までそれぞれのZLのタイル使用、それ以降は14が使用される
];

//ZL4,8,10,14,17のタイルを使用する例
GSIBV.CONFIG.VectorTileSourceList =[
  {"minzoom":4,"maxzoom":4},
  {"minzoom":8,"maxzoom":8}, 
  {"minzoom":11,"maxzoom":11},
  {"minzoom":14,"maxzoom":14},
  {"minzoom":17,"maxzoom":17}
];
*/


GSIBV.CONFIG.RECOMMEND = [

  {
    "id": "vstd",
    "type": "binaryvector",
    "title": "標準地図",
    "thumbnail": "./image/thumb/std.png",
    "url": "./data/std.json",
    "html": "基本となる地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "description": "標準地図",
    "maxNativeZoom" : 16
  },
  /*
  {
    "id": "vpale_test",
    "type": "binaryvector",
    "title": "淡色テスト",
    "thumbnail": "./image/thumb/pale.png",
    "url": "./data/pale_test.json",
    "html": "淡い配色の地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "description": "淡色テスト",
    "maxNativeZoom" : 16
  },
  */
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
    "html": "淡い配色の地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "description": "淡色地図",
    "maxNativeZoom" : 16
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
    "id": "vblank",
    "type": "binaryvector",
    "title": "白地図",
    "thumbnail": "./image/thumb/blank.png",
    "url": "./data/blank.json",
    "html": "白黒の地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "description": "白地図",
    "maxNativeZoom" : 16
  },
  
  {
    "id": "photo",
    "type": "raster",
    "title": "写真",
    "description": "写真",
    "thumbnail": "./image/thumb/ort.png",
    "url": "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    "html": "<div class=\"gsi_layerinfo_subtitle\">ズームレベル2～8:「世界衛星モザイク画像」<br>ズームレベル9～13:「全国ランドサットモザイク画像」<br>ズームレベル14～18:「シームレス空中写真」<br>シームレス空中写真は、国土地理院が保有する複数種別の空中写真から、各地区における最新の写真を抽出・組み合わせて作成した写真レイヤです。</div><a target=\"_blank\" href=\"https://cyberjapandata.gsi.go.jp/legend/seamlessphoto.pdf\">（詳細解説）</a><div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
  },  
  {
    "id": "photolabel",
    "type": "layerset",
    "title": "写真+注記",
    "description": "写真+注記",
    "thumbnail": "./image/thumb/ort_label.png",
    "url": "",
    "layers": [
      {
        "id": "photo2",
        "type": "raster",
        "title" : "写真",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
        "html": "<div class=\"gsi_layerinfo_subtitle\">ズームレベル2～8:「世界衛星モザイク画像」<br>ズームレベル9～13:「全国ランドサットモザイク画像」<br>ズームレベル14～18:「シームレス空中写真」<br>シームレス空中写真は、国土地理院が保有する複数種別の空中写真から、各地区における最新の写真を抽出・組み合わせて作成した写真レイヤです。</div><a target=\"_blank\" href=\"https://cyberjapandata.gsi.go.jp/legend/seamlessphoto.pdf\">（詳細解説）</a><div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
      },
      {
        "id": "vlabel",
        "type": "binaryvector",
        "title" : "注記",
        "url": "./data/label.json",
        "html" : "標準地図から注記だけ抜き出したもの</a><div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
        "maxNativeZoom" : 16
      }
    ]
  },
  {
    "id": "lvlabel",
    "type": "binaryvector",
    "title": "大きい文字",
    "description": "標準地図（大きい文字）",
    "thumbnail": "./image/thumb/l_label.png",
    "url": "./data/llabel.json",
    "html": "標準地図の文字を大きくしたもの<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "maxNativeZoom" : 16
  },
  /*
  {
    "id": "v2std",
    "type": "binaryvector",
    "title": "標準地図②",
    "description": "標準地図（立体交差あり）",
    "thumbnail": "./image/thumb/std2.png",
    "url": "./data/std2.json",
    "html": "基本となる地図（立体交差あり）<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "maxNativeZoom" : 16
  },
  {
    "id": "v2pale",
    "type": "binaryvector",
    "title": "淡色地図②",
    "description": "淡色地図（立体交差あり）",
    "thumbnail": "./image/thumb/pale2.png",
    "url": "./data/pale2.json",
    "html": "淡い配色の地図（立体交差あり）<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "maxNativeZoom" : 16
  },
  {
    "id": "v2blank",
    "type": "binaryvector",
    "title": "白地図②",
    "description": "白地図（立体交差あり）",
    "thumbnail": "./image/thumb/blank2.png",
    "url": "./data/blank2.json",
    "html": "白黒の地図（立体交差あり）<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
    "maxNativeZoom" : 16
  }
 
 {
  "id": "mapboxstyle-sample",
  "type": "mapboxstyle",
  "title": "mapbox1",
  "thumbnail": "./image/thumb/pale.png",
  "url": "./data/mapbox/std.json",
  "html": "mapbox Style<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
  "description": "mapboxのスタイルファイル"
},

{
  "id": "mapboxstyle-sample2",
  "type": "mapboxstyle",
  "title": "mapbox2",
  "thumbnail": "./image/thumb/pale.png",
  "url": "./data/mapbox/pale.json",
  "html": "mapbox Style<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
  "description": "mapboxのスタイルファイル"
},

{
  "id": "mapboxstyle-sample3",
  "type": "mapboxstyle",
  "title": "mapbox3",
  "thumbnail": "./image/thumb/pale.png",
  "url": "./data/mapbox/blank.json",
  "html": "mapbox Style<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
  "description": "mapboxのスタイルファイル"
},
  */

{
  "id": "vstd-hillshade",
  "type": "layerset",
  "title": "標準+陰影",
  "thumbnail": "./image/thumb/h_std.png",
  "url" : "",
  "html": "陰影付標準<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
  "description": "陰影+標準地図",
  "layers": [

    {
      "id": "hillshade1",
      "type": "hillshade",
      "title" : "陰影起伏図",
      "url": "",
      "html": "陰影起伏図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
    },
    
    {
      "id": "vstd2",
      "type": "binaryvector",
      "title": "標準地図",
      "thumbnail": "./image/thumb/std.png",
      "url": "./data/std.json",
      "html": "基本となる地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
      "description": "標準地図",
      "maxNativeZoom" : 16
    }
  ]
},


{
  "id": "vpale-hillshade",
  "type": "layerset",
  "title": "淡色+陰影",
  "thumbnail": "./image/thumb/h_pale.png",
  "url" : "",
  "html": "陰影付淡色<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
  "description": "陰影+淡色地図",
  "layers": [

    {
      "id": "hillshade1",
      "type": "hillshade",
      "title" : "陰影起伏図",
      "url": "",
      "html": "陰影起伏図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
    },
    
    {
      "id": "vpale2",
      "type": "binaryvector",
      "title": "淡色地図",
      "thumbnail": "./image/thumb/pale.png",
      "url": "./data/pale.json",
      "html": "淡い配色の地図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
      "description": "淡色地図",
      "maxNativeZoom" : 16
    }
  ]
},


{
  "id": "lvlabel-hillshade",
  "type": "layerset",
  "title": "大文字+陰影",
  "thumbnail": "./image/thumb/h_l_label.png",
  "url" : "",
  "html": "陰影付注記<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
  "description": "陰影+標準地図（大きい文字）",
  "layers": [

    {
      "id": "hillshade1",
      "type": "hillshade",
      "title" : "陰影起伏図",
      "url": "",
      "html": "陰影起伏図<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>"
    },
    {
      "id": "lvlabel2",
      "type": "binaryvector",
      "title": "大きい文字",
      "description": "標準地図（大きい文字）",
      "thumbnail": "./image/thumb/l_label.png",
      "url": "./data/llabel.json",
      "html": "標準地図の文字を大きくしたもの<div class=\"gsi_layerinfo_copy\">(c)国土地理院</div>",
      "maxNativeZoom" : 16
    }
  ]
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
    "type":"check",
  	"title":"中心十字線"
  },
  {
    "id":"draw",
  	"title":"作図"
  },
  {
    "id":"print",
  	"title":"印刷"
  },
  {
    "id":"saveimage",
  	"title":"画像として保存"
  },
  {
    "id":"compass",
    "type":"check",
  	"title":"方位記号"
  },
  {
    "id":"to-mobile",
    "title": "モバイル版で表示"
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
    "url": 'https://maps.gsi.go.jp/layers_txt/layers5.txt'
  },
  {
    "url": 'https://maps.gsi.go.jp/layers_txt/layers6.txt'
  },
  {
    "url": 'https://maps.gsi.go.jp/layers_txt/layers7.txt'
  }
];

// 確認表示が必要なレイヤー
GSIBV.CONFIG.CONFIRM_LAYERS = {
  "kokuarea" : { // このグループの一意のID
    "title" : "留意事項", // 確認ダイアログに表示するタイトル

    // 表示するメッセージ
    "message" : "航空法第132条で規定する無人航空機の飛行禁止空域のうち、航空法施行規則第236条第1号から第3号までに掲げる空域（空港等の周辺空域）を表示します。緑色の面は、上空での飛行が禁止される制限表面を表します。紫色の面は、上空及びその下の空域での飛行が禁止される進入表面及び転移表面並びに上空の空域で飛行が禁止される空港等の敷地を表します。<br>" +
                "なお、この情報には誤差が含まれている場合があります。また空港等の敷地については工事等により変更がある場合がありますので、境界付近等正確な空域については空港等の管理者に確認願います。<br>" +
                  "詳細については、<a target='_blank' href='http://www.mlit.go.jp/koku/koku_tk10_000003.html'>国土交通省ホームページ</a>で確認してください。",
    "withBlend" : false, // 合成するかどうか
    "layers" : [ // レイヤーのIDを配列で指定
      "kokuarea"
    ]
  },
  "red" : {
    "title" : "ご利用上の注意", 
    "message" : "赤色立体地図及びオルソ立体地図はアジア航測株式会社の特許（第3670274号等）を使用して作成したものです。" + 
                "赤色立体地図及びオルソ立体地図を利用される場合は、<a target='_blank' href='http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html'>国土地理院コンテンツ利用規約</a>に記載のとおり、" + 
                "<a target='_blank' href='https://www.rrim.jp/researcher/'>アジア航測株式会社の許諾条件</a>を確認してご利用下さい。",
    "withBlend" : true,
    "layers" : [
      "red",
      "20190121_sekisyokurittai_kusatsushiranesan",
      "20190121_olsorittai_kusatsushiranesan",
      "oosimared",
      "miyakejimared",
      "20180906hokkaido_atsuma_sekishoku",
      "tarumaered",
      "20180130_kusatsushiranesan_sekishokurittai",
      "20180309_sekisyokurittai_kirishima",
      "kuchinoerabured",
      "2018_sekisyokurittai_azumayama",
      "20190807asama_sekisyoku"
    ]
  }
};


// 指定緊急場所表示中メッセージ
GSIBV.CONFIG.SKHBMESSAGE = 
'<div class="evac_dialog_content">最新の状況などは当該市町村にご確認ください。<br>' 
 + '<a href="http://www.gsi.go.jp/bousaichiri/hinanbasho.html" target="blank">「指定緊急避難場所」について</a>'
 + '　<a href="https://hinan.gsi.go.jp/hinanjocjp/hinanbasho/koukaidate.html" target="blank">市町村別公開日・更新日一覧</a>'
  + '</div>';


GSIBV.CONFIG.PAPERSIZE = {
  "A4_portrait": { w: 650, h: 900 },  //A4縦
  "A4_landscape": { w: 950, h: 550 }, //A4横

  "A3_portrait": { w: 950, h: 1350 },  //A3縦
  "A3_landscape": { w: 1400, h: 900 },  //A3横

  "A2_portrait": { w: 1400, h: 2000, large:true },  //A2縦
  "A2_landscape": { w: 2050, h: 1350, large:true },  //A2横

  "A1_portrait": { w: 2050, h: 2950, large:true },  //A1縦
  "A1_landscape": { w: 3000, h: 2000, large:true },  //A1横

  "A0_portrait": { w: 3000, h: 4270, large:true },  //A0縦
  "A0_landscape": { w: 4320, h: 2950, large:true }  //A0横
};

GSIBV.CONFIG.HANREILIST = {
  "gsjGeomap_seamless200k_v2": {
    "url": "https://gbank.gsj.jp/seamless/v2/api/1.2.1/legend.json",
    "layer": {
      "url": "https://gbank.gsj.jp/seamless/v2/api/1.2/tiles/{z}/{y}/{x}.png",
      "minZoom": 3,
      "maxZoom": 13
    }
  },
  "vlcd_meakan": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_meakan/vlcd_meakan.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_meakan/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_tokachi": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_tokachi/vlcd_tokachi.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_tokachi/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_tarumae": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_tarumae/vlcd_tarumae.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_tarumae/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_usu": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_usu/vlcd_usu.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_usu/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_hokoma": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_hokoma/vlcd_hokoma.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_hokoma/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_iwate": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_iwate/vlcd_iwate.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_iwate/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_akitakoma": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_akitakoma/vlcd_akitakoma.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_akitakoma/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_kurikoma": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_kurikoma/vlcd_kurikoma.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_kurikoma/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_adatara": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_adatara/vlcd_adatara.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_adatara/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_bandai": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_bandai/vlcd_bandai.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_bandai/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_kusatsu": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_kusatsu/vlcd_kusatsu.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_kusatsu/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_niigatayake": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_niigatayake/vlcd_niigatayake.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_niigatayake/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_ontake": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_ontake/vlcd_ontake.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_ontake/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_fuji": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_fuji/vlcd_fuji.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_fuji/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_hakone": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_hakone/vlcd_hakone.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_hakone/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_izuo": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_izuo/vlcd_izuo.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_izuo/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_miyake": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_miyake/vlcd_miyake.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_miyake/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_kuju": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_kuju/vlcd_kuju.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_kuju/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_aso": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_aso/vlcd_aso.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_aso/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_unzen": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_unzen/vlcd_unzen.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_unzen/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_kiri": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_kiri/vlcd_kiri.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_kiri/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_sakura": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_sakura/vlcd_sakura.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_sakura/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_satumaio": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_satumaio/vlcd_satumaio.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_satsumaio/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_satsumatake": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_satsumatake/vlcd_satsumatake.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_satsumatake/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "vlcd_akitayake": {
    "url": "https://maps.gsi.go.jp/xyz/vlcd_akitayake/vlcd_akitayake.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/vlcd_akitayake/{z}/{x}/{y}.png",
      "minZoom": 10,
      "maxZoom": 16
    }
  },
  "swale": {
    "url": "https://maps.gsi.go.jp/xyz/swale/swale.csv",
    "layer": {
      "url": "https://maps.gsi.go.jp/xyz/swale/{z}/{x}/{y}.png",
      "minZoom": 5,
      "maxZoom": 16
    }
  }
};

GSIBV.CONFIG.FREERELIEF_AUTOLOWCOLOR = "#0000FF";

GSIBV.CONFIG.FREERELIEF_COLORPATTERNS = [
  {
    "title" : "デフォルト",
    "colors" : [
      "#0000FF",
      "#0095FF",
      "#00EEFF",
      "#91FF00",
      "#FFFF00",
      "#FF8C00",
      "#FF4400"
    ]
  },
  {
    "title" : "黒→白",
    "colors" : [
      {"r":70,"g":70,"b":70},
      {"r":101,"g":101,"b":101},
      {"r":132,"g":132,"b":132},
      {"r":163,"g":163,"b":163},
      {"r":193,"g":193,"b":193},
      {"r":224,"g":224,"b":224},
      {"r":255,"g":255,"b":255}]
  },
  {
    "title" : "青→白",
    "colors" : [
      {"r":0,"g":0,"b":255},
      {"r":43,"g":43,"b":255},
      {"r":85,"g":85,"b":255},
      {"r":128,"g":128,"b":255},
      {"r":170,"g":170,"b":255},
      {"r":213,"g":213,"b":255},
      {"r":255,"g":255,"b":255}]
  },
  {
    "title" : "赤→白",
    "colors" : [
      {"r":255,"g":0,"b":0},
      {"r":255,"g":43,"b":43},
      {"r":255,"g":85,"b":85},
      {"r":255,"g":128,"b":128},
      {"r":255,"g":170,"b":170},
      {"r":255,"g":213,"b":213},
      {"r":255,"g":255,"b":255}
    ]
  }
];

