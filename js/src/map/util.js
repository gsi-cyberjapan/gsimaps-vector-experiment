GSIBV.Map.Util = {}
GSIBV.Map.Util.reliefRound = function(val){
  var nsign = val < 0 ? -1 : 1;

  var iv = Math.floor(val);
  if (val < 0){
    iv = Math.ceil(val);
  }

  var sv = Math.round( (Math.abs(val) - Math.abs(iv)) * 10) / 10;
  var res = 0;
  if (sv < 0.3){
    res = iv;
  }
  else if (sv < 0.8){
    res = iv + ( 0.5 * nsign );
  }else{
    res =  iv + ( 1 * nsign );
  }

  return res;
};


GSIBV.Map.Util.latLngToDMS = function (latLng, useSymbol ) {

  var latLng = { lat: latLng.lat, lng: latLng.lng };
  var latMinus = (latLng.lat < 0 ? -1 : 1);
  var lngMinus = (latLng.lng < 0 ? -1 : 1);

  latLng.lat = Math.abs(latLng.lat);
  latLng.lng = Math.abs(latLng.lng);

  var latD = Math.floor(latLng.lat);
  var latM = Math.floor((latLng.lat - latD) * 60);
  var latS = (latLng.lat - latD - (latM / 60)) * 3600;

  if (latS == 60) { latS = 0; latM = latM + 1; };
  if (latM == 60) { latM = 0; latD = latD + 1; };

  var lngD = Math.floor(latLng.lng);
  var lngM = Math.floor((latLng.lng - lngD) * 60);
  var lngS = (latLng.lng - lngD - (lngM / 60)) * 3600;

  if (lngS == 60) { lngS = 0; lngM = lngM + 1; };
  if (lngM == 60) { lngM = 0; lngD = lngD + 1; };
  
  if ( useSymbol ) {
    return {
      lat: {
        d: latD, m: latM, s: latS,
        text: latD + "°" + latM + "’" + latS.toFixed(2) + "”"
      },
      lng: {
        d: lngD, m: lngM, s: lngS,
        text: lngD + "°" + lngM + "’" + lngS.toFixed(2) + "”"
      }
    };
  } else {
    return {
      lat: {
        d: latD, m: latM, s: latS,
        text: latD + "度" + latM + "分" + latS.toFixed(2) + "秒"
      },
      lng: {
        d: lngD, m: lngM, s: lngS,
        text: lngD + "度" + lngM + "分" + lngS.toFixed(2) + "秒"
      }
    };
  }
};


/************************************************************************
 Proj4js
************************************************************************/
if (Proj4js) {
  if (!Proj4js.defs["EPSG:3097"]) Proj4js.defs["EPSG:3097"] = "+proj=utm +zone=51 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";		    //UTM Zone51
  if (!Proj4js.defs["EPSG:3098"]) Proj4js.defs["EPSG:3098"] = "+proj=utm +zone=52 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";		    //UTM Zone52
  if (!Proj4js.defs["EPSG:3099"]) Proj4js.defs["EPSG:3099"] = "+proj=utm +zone=53 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";		    //UTM Zone53
  if (!Proj4js.defs["EPSG:3100"]) Proj4js.defs["EPSG:3100"] = "+proj=utm +zone=54 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";		    //UTM Zone54
  if (!Proj4js.defs["EPSG:3101"]) Proj4js.defs["EPSG:3101"] = "+proj=utm +zone=55 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";		    //UTM Zone55
  if (!Proj4js.defs["SR-ORG:1235"]) Proj4js.defs["SR-ORG:1235"] = "+proj=utm +zone=56 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";	    //UTM Zone56
  if (!Proj4js.defs["EPSG:4301"]) Proj4js.defs['EPSG:4301'] = "+proj=longlat +ellps=bessel +towgs84=-146.336,506.832,680.254,0,0,0,0 +no_defs";	//日本測地系（経緯度座標）
}


/************************************************************************
 GSIBV.Map.Util.UTM
************************************************************************/
GSIBV.Map.Util.UTM = {

  PROJ_WORLD: new Proj4js.Proj('EPSG:4326'),
  lng2Zone: function (lng) {
    return Math.floor(lng / 6) + 31;
  },
  zone2Lng: function (zone) {
    return (zone - 31) * 6;
  },
  getUTMDefName: function (zone) {
    var defName = '';

    if (!zone) return defName;
    switch (zone + '') {
      case '51':
        defName = 'EPSG:3097';
        break;
      case '52':
        defName = 'EPSG:3098';
        break;
      case '53':
        defName = 'EPSG:3099';
        break;
      case '54':
        defName = 'EPSG:3100';
        break;
      case '55':
        defName = 'EPSG:3101';
        break;
      case '56':
        defName = 'SR-ORG:1235';
        break;
    }
    return defName;
  },
  getUTMMark: function (lat) {
    var mark = '';
    if (lat >= 16 && lat < 24) {
      mark = "Q";
    } else if (lat >= 24 && lat < 32) {
      mark = "R";
    } else if (lat >= 32 && lat < 40) {
      mark = "S";
    } else if (lat >= 40 && lat < 48) {
      mark = "T";
    } else if (lat >= 48 && lat < 56) {
      mark = "U";
    }
    return mark;
  },
  _parseUSNGText: function (s) {
    var result = {};
    var j = 0;
    var k;
    var usngStr = [];
    var usngStr_temp = []

    usngStr_temp = s.toUpperCase()

    var regexp = /%20/g
    usngStr = usngStr_temp.replace(regexp, "")
    regexp = / /g
    usngStr = usngStr_temp.replace(regexp, "")

    if (usngStr.length < 7) {
      return null;
    }

    result.zone = usngStr.charAt(j++) * 10 + usngStr.charAt(j++) * 1;
    result.mylet = usngStr.charAt(j++)
    result.sq1 = usngStr.charAt(j++)
    result.sq2 = usngStr.charAt(j++)

    result.precision = (usngStr.length - j) / 2;
    result.east = '';
    result.north = '';
    for (var k = 0; k < result.precision; k++) {
      result.east += usngStr.charAt(j++)
    }

    if (usngStr[j] == " ") { j++ }
    for (var k = 0; k < result.precision; k++) {
      result.north += usngStr.charAt(j++)
    }

    return result;
  },
  _USNGtoUTM: function (zone, mylet, sq1, sq2, east, north) {
    var result = {};

    //Starts (southern edge) of N-S zones in millons of meters
    var zoneBase = [1.1, 2.0, 2.9, 3.8, 4.7, 5.6, 6.5, 7.3, 8.2, 9.1, 0, 0.8, 1.7, 2.6, 3.5, 4.4, 5.3, 6.2, 7.0, 7.9];

    var segBase = [0, 2, 2, 2, 4, 4, 6, 6, 8, 8, 0, 0, 0, 2, 2, 4, 4, 6, 6, 6];  //Starts of 2 million meter segments, indexed by zone 

    // convert easting to UTM
    var eSqrs = "ABCDEFGHJKLMNPQRSTUVWXYZ".indexOf(sq1);
    var appxEast = 1 + eSqrs % 8;

    // convert northing to UTM
    var letNorth = "CDEFGHJKLMNPQRSTUVWX".indexOf(mylet);
    if (zone % 2)  //odd number zone
      var nSqrs = "ABCDEFGHJKLMNPQRSTUV".indexOf(sq2)
    else        // even number zone
      var nSqrs = "FGHJKLMNPQRSTUVABCDE".indexOf(sq2);

    var zoneStart = zoneBase[letNorth];
    var appxNorth = Number(segBase[letNorth]) + nSqrs / 10;
    if (appxNorth < zoneStart)
      appxNorth += 2;

    result.N = appxNorth * 1000000 + Number(north) * Math.pow(10, 5 - north.length);
    result.E = appxEast * 100000 + Number(east) * Math.pow(10, 5 - east.length)
    result.zone = zone;
    result.letter = mylet;

    return result;
  },
  _UTMtoLL: function (UTMNorthing, UTMEasting, UTMZoneNumber, ret) {
    var EASTING_OFFSET = 500000.0;   // (meters)
    var NORTHING_OFFSET = 10000000.0; // (meters)
    var k0 = 0.9996;
    var EQUATORIAL_RADIUS = 6378137.0; // GRS80 ellipsoid (meters)
    var ECC_SQUARED = 0.006694380023;
    var ECC_PRIME_SQUARED = ECC_SQUARED / (1 - ECC_SQUARED);
    var E1 = (1 - Math.sqrt(1 - ECC_SQUARED)) / (1 + Math.sqrt(1 - ECC_SQUARED));
    var RAD_2_DEG = 180.0 / Math.PI;

    // remove 500,000 meter offset for longitude
    var xUTM = parseFloat(UTMEasting) - EASTING_OFFSET;
    var yUTM = parseFloat(UTMNorthing);
    var zoneNumber = parseInt(UTMZoneNumber);

    // origin longitude for the zone (+3 puts origin in zone center) 
    var lonOrigin = (zoneNumber - 1) * 6 - 180 + 3;

    // M is the "true distance along the central meridian from the Equator to phi
    // (latitude)
    var M = yUTM / k0;
    var mu = M / (EQUATORIAL_RADIUS * (1 - ECC_SQUARED / 4 - 3 * ECC_SQUARED *
      ECC_SQUARED / 64 - 5 * ECC_SQUARED * ECC_SQUARED * ECC_SQUARED / 256));

    // phi1 is the "footprint latitude" or the latitude at the central meridian which
    // has the same y coordinate as that of the point (phi (lat), lambda (lon) ).
    var phi1Rad = mu + (3 * E1 / 2 - 27 * E1 * E1 * E1 / 32) * Math.sin(2 * mu)
      + (21 * E1 * E1 / 16 - 55 * E1 * E1 * E1 * E1 / 32) * Math.sin(4 * mu)
      + (151 * E1 * E1 * E1 / 96) * Math.sin(6 * mu);
    var phi1 = phi1Rad * RAD_2_DEG;

    // Terms used in the conversion equations
    var N1 = EQUATORIAL_RADIUS / Math.sqrt(1 - ECC_SQUARED * Math.sin(phi1Rad) *
      Math.sin(phi1Rad));
    var T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
    var C1 = ECC_PRIME_SQUARED * Math.cos(phi1Rad) * Math.cos(phi1Rad);
    var R1 = EQUATORIAL_RADIUS * (1 - ECC_SQUARED) / Math.pow(1 - ECC_SQUARED *
      Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
    var D = xUTM / (N1 * k0);

    // Calculate latitude, in decimal degrees
    var lat = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (D * D / 2 - (5 + 3 * T1 + 10
      * C1 - 4 * C1 * C1 - 9 * ECC_PRIME_SQUARED) * D * D * D * D / 24 + (61 + 90 *
        T1 + 298 * C1 + 45 * T1 * T1 - 252 * ECC_PRIME_SQUARED - 3 * C1 * C1) * D * D *
      D * D * D * D / 720);
    lat = lat * RAD_2_DEG;

    // Calculate longitude, in decimal degrees
    var lng = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 *
      C1 * C1 + 8 * ECC_PRIME_SQUARED + 24 * T1 * T1) * D * D * D * D * D / 120) /
      Math.cos(phi1Rad);

    lng = lonOrigin + lng * RAD_2_DEG;
    return { lat: lat, lng: lng };
  },
  point2LatLng: function (s) {
    var latLng = null;
    try {
      var usngp = this._parseUSNGText(s, usngp);
      if (!usngp) return null;
      var coords = this._USNGtoUTM(usngp.zone, usngp.mylet, usngp.sq1, usngp.sq2, usngp.east, usngp.north)

      if (usngp.mylet < 'N') {
        coords.N -= NORTHING_OFFSET
      }

      latLng = this._UTMtoLL(coords.N, coords.E, usngp.zone)
    }
    catch (e) {
      latLng = null;
    }
    return latLng;
  },
  latlng2PointName: function (lat, lng) {
    var zone = GSIBV.Map.Util.UTM.lng2Zone(lng);
    var defName = GSIBV.Map.Util.UTM.getUTMDefName(zone);

    if (defName == '') return '';

    var projUTM = new Proj4js.Proj(defName);
    var latLngPoint = new Proj4js.Point(lng, lat);
    var utmPoint = Proj4js.transform(GSIBV.Map.Util.UTM.PROJ_WORLD, projUTM, latLngPoint);

    return GSIBV.Map.Util.UTM.getUTMPointName(
      zone,
      GSIBV.Map.Util.UTM.getUTMMark(lat),
      utmPoint.x,
      utmPoint.y,
      4
    );
  },
  getUTMPointName: function (zone, mark, x, y, num, hideNumber) {

    var x10mNumber = '';
    var y10mNumber = '';
    if (!hideNumber && x && y) {
      var zero = '';
      for (var i = 0; i < num; i++) {
        zero += '0';
      }

      x10mNumber = zero + Math.floor(x / 10);
      x10mNumber = x10mNumber.substr(x10mNumber.length - num, num);
      y10mNumber = zero + Math.floor(y / 10);
      y10mNumber = y10mNumber.substr(y10mNumber.length - num, num);
    }

    var letters = GSIBV.Map.Util.UTM.findGridLetters(zone, Math.floor(y / 10) * 10, Math.floor(x / 10) * 10);
    return zone + mark + letters + x10mNumber + y10mNumber;
  },
  findSet: function (zoneNum) {
    zoneNum = parseInt(zoneNum);
    zoneNum = zoneNum % 6;
    switch (zoneNum) {

      case 0:
        return 6;
        break;

      case 1:
        return 1;
        break;

      case 2:
        return 2;
        break;

      case 3:
        return 3;
        break;

      case 4:
        return 4;
        break;

      case 5:
        return 5;
        break;

      default:
        return -1;
        break;
    }
  },
  BLOCK_SIZE: 100000,
  GRIDSQUARE_SET_ROW_SIZE: 20,
  GRIDSQUARE_SET_COL_SIZE: 8,

  findGridLetters: function (zoneNum, northing, easting) {
    zoneNum = parseInt(zoneNum);
    northing = parseFloat(northing);
    easting = parseFloat(easting);
    row = 1;

    // northing coordinate to single-meter precision
    north_1m = Math.round(northing);

    // Get the row position for the square identifier that contains the point
    while (north_1m >= GSIBV.Map.Util.UTM.BLOCK_SIZE) {
      north_1m = north_1m - GSIBV.Map.Util.UTM.BLOCK_SIZE;
      row++;
    }

    // cycle repeats (wraps) after 20 rows
    row = row % GSIBV.Map.Util.UTM.GRIDSQUARE_SET_ROW_SIZE;
    col = 0;

    // easting coordinate to single-meter precision
    east_1m = Math.round(easting);

    // Get the column position for the square identifier that contains the point
    while (east_1m >= GSIBV.Map.Util.UTM.BLOCK_SIZE) {
      east_1m = east_1m - GSIBV.Map.Util.UTM.BLOCK_SIZE;
      col++;
    }

    // cycle repeats (wraps) after 8 columns
    col = col % GSIBV.Map.Util.UTM.GRIDSQUARE_SET_COL_SIZE;

    return GSIBV.Map.Util.UTM.lettersHelper(GSIBV.Map.Util.UTM.findSet(zoneNum), row, col);
  },
  lettersHelper: function (set, row, col) {
    // handle case of last row
    if (row == 0) {
      row = GSIBV.Map.Util.UTM.GRIDSQUARE_SET_ROW_SIZE - 1;
    }
    else {
      row--;
    }

    if (col == 0) {
      col = GSIBV.Map.Util.UTM.GRIDSQUARE_SET_COL_SIZE - 1;
    }
    else {
      col--;
    }

    switch (set) {

      case 1:
        l1 = "ABCDEFGH";              // column ids
        l2 = "ABCDEFGHJKLMNPQRSTUV";  // row ids
        return l1.charAt(col) + l2.charAt(row);
        break;

      case 2:
        l1 = "JKLMNPQR";
        l2 = "FGHJKLMNPQRSTUVABCDE";
        return l1.charAt(col) + l2.charAt(row);
        break;

      case 3:
        l1 = "STUVWXYZ";
        l2 = "ABCDEFGHJKLMNPQRSTUV";
        return l1.charAt(col) + l2.charAt(row);
        break;

      case 4:
        l1 = "ABCDEFGH";
        l2 = "FGHJKLMNPQRSTUVABCDE";
        return l1.charAt(col) + l2.charAt(row);
        break;

      case 5:
        l1 = "JKLMNPQR";
        l2 = "ABCDEFGHJKLMNPQRSTUV";
        return l1.charAt(col) + l2.charAt(row);
        break;

      case 6:
        l1 = "STUVWXYZ";
        l2 = "FGHJKLMNPQRSTUVABCDE";
        return l1.charAt(col) + l2.charAt(row);
        break;
    }
  }
};



/************************************************************************
 GSIBV.Map.Util.ElevationLoader
************************************************************************/
GSIBV.Map.Util.ElevationLoader = class extends MA.Class.Base {

  constructor(options) {
    super();

    this._demUrlList = [
      {
        "title": "DEM5A",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png",
        "minzoom": 9,
        "maxzoom": 15,
        "fixed": 1
      },
      {
        "title": "DEM5B",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/dem5b_png/{z}/{x}/{y}.png",
        "minzoom": 9,
        "maxzoom": 15,
        "fixed": 1
      },
      {
        "title": "DEM5C",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/dem5c_png/{z}/{x}/{y}.png",
        "minzoom": 9,
        "maxzoom": 15,
        "fixed": 1
      },
      {
        "title": "DEM10B",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png",
        "minzoom": 9,
        "maxzoom": 14,
        "fixed": 0
      },
      {
        "title": "DEMGM",
        "url": "https://cyberjapandata.gsi.go.jp/xyz/demgm_png/{z}/{x}/{y}.png",
        "minzoom": 8,
        "maxzoom": 8,
        "fixed": 0
      }
    ];

    this.pow2_8 = Math.pow(2, 8);
    this.pow2_16 = Math.pow(2, 16);
    this.pow2_23 = Math.pow(2, 23);
    this.pow2_24 = Math.pow(2, 24);

  }

  load(map, pos) {
    this._map = map;

    this.fire("start");
    this._destroyImage();
    if (!this._map) return;
    this._current = {
      pos: pos,
      urlList: this._makeUrlList()
    }

    this._load(this._current);
  }
  start(map) {
    this.fire("start");
    this._map = map;
    if (!this._mapMoveHandler) {
      this._mapMoveHandler = MA.bind(this._onMapMove, this);
      this._map.on("moveend", this._mapMoveHandler);
      this._mapMoveStartHandler = MA.bind(this._onMapMoveStart, this);
      this._map.on("movestart", this._mapMoveStartHandler);
    }
    this._onMapMove();
  }

  stop() {

    if (this._mapMoveHandler) {
      this._map.off("moveend", this._mapMoveHandler);
      this._map.off("moveend", this._mapMoveStartHandler);
      this._mapMoveHandler = null;
      this._mapMoveStartHandler = null;
    }

    this._map = null;
  }

  destroy() {
    this.clearEvents();
    this.stop();
  }

  _onMapMoveStart(eventData) {
    if (eventData && eventData["exec"] == "resetpitch" || eventData && eventData["exec"] == "resetrotate") {
      return;
    }
    this._current = null;
    this._destroyImage();
    this.fire("start");
  }
  _onMapMove(eventData) {
    if (eventData && eventData["exec"] == "resetpitch" || eventData && eventData["exec"] == "resetrotate") {
      return;
    }
    this._current = null;
    this._destroyImage();
    if (!this._map) return;
    var center = this._map.getCenter();
    this._lastCenter = {
      lat: center.lat,
      lng: center.lng
    };
    this._current = {
      pos: center,
      urlList: this._makeUrlList()
    }

    this._load(this._current);
  }
  _makeUrlList() {

    var list = [];
    var buffList =[];
    for( var i=0; i<=15; i++) {
      buffList.push([]);
    }
    for (var i = 0; i < this._demUrlList.length; i++) {
      var demUrl = this._demUrlList[i];
      if (demUrl.maxzoom < demUrl.minzoom) {
        var buff = demUrl.maxzoom;
        demUrl.maxzoom = demUrl.minzoom;
        demUrl.minzoom = buff;
      }
      var minzoom = demUrl.minzoom;
      for (var z = demUrl.maxzoom; z >= minzoom; z--) {
        buffList[z].push({
          "title": demUrl.title,
          "zoom": z,
          "url": demUrl.url,
          "fixed": demUrl.fixed
        });
      }
    }

    for( var i=buffList.length-1; i>=0; i-- ) {
      for( var j = 0; j<buffList[i].length; j++) {
        list.push(buffList[i][j]);
      }
    }
    /*
    var list = [];
    for (var i = 0; i < this._demUrlList.length; i++) {
      var demUrl = this._demUrlList[i];
      if (demUrl.maxzoom < demUrl.minzoom) {
        var buff = demUrl.maxzoom;
        demUrl.maxzoom = demUrl.minzoom;
        demUrl.minzoom = buff;
      }
      for (var z = demUrl.maxzoom; z >= demUrl.minzoom; z--) {
        list.push({
          "title": demUrl.title,
          "zoom": z,
          "url": demUrl.url
        });
      }
    }
    */
    return list;
  }

  _destroyImage() {
    if (this._img) {
      MA.DOM.off(this._img, "load", this._imgLoadHandler);
      MA.DOM.off(this._img, "error", this._imgLoadErrorHandler);
      this._imgLoadHandler = null;
      this._imgLoadErrorHandler = null;
      delete this._img;
      this._img = null;
    }
  }
  _load(current, valueError) {
    this._destroyImage();

    if (this._current != current) return;

    if (!this._current.urlList || this._current.urlList.length <= 0) {
      // not found
      this.fire("finish", {
        h: undefined,
        pos: current.pos
      })
      return;
    }

    var url = this._current.urlList.shift();
    
    if ( valueError && url.title=="DEMGM") {
      this.fire("finish", {
        h: undefined,
        pos: current.pos
      });
      return;
    }

    var tileInfo = this._getTileInfo(this._current.pos.lat, this._current.pos.lng, url.zoom);

    this._img = document.createElement("img");
    this._img.setAttribute("crossorigin", "anonymous");

    this._imgLoadHandler = MA.bind(this._onImgLoad, this, url, current, tileInfo, this._img);
    this._imgLoadErrorHandler = MA.bind(this._onImgLoadError, this, url, current, tileInfo, this._img);

    MA.DOM.on(this._img, "load", this._imgLoadHandler);
    MA.DOM.on(this._img, "error", this._imgLoadErrorHandler);

    function makeUrl(url, tileInfo) {
      var result = url.url.replace("{x}", tileInfo.x);
      result = result.replace("{y}", tileInfo.y);
      result = result.replace("{z}", url.zoom);
      return result;
    }

    this._img.src = makeUrl(url, tileInfo);

  }
  _onImgLoad(url, current, tileInfo, img) {

    if (current != this._current) return;

    if (!this._canvas) {
      this._canvas = document.createElement("canvas");
      this._canvas.width = 256;
      this._canvas.height = 256;
    }
    var ctx = this._canvas.getContext("2d");

    ctx.drawImage(img, 0, 0);

    var imgData = ctx.getImageData(0, 0, 256, 256);
    var idx = (tileInfo.pY * 256 * 4) + (tileInfo.pX * 4);
    var r = imgData.data[idx + 0];
    var g = imgData.data[idx + 1];
    var b = imgData.data[idx + 2];
    var h = 0;

    if (r != 128 || g != 0 || b != 0) {
      var d = r * this.pow2_16 + g * this.pow2_8 + b;
      h = (d < this.pow2_23) ? d : d - this.pow2_24;
      if (h == -this.pow2_23) h = 0;
      else h *= 0.01;
      this._destroyImage();

      this.fire("finish", {
        h: h,
        title: url.title,
        pos: current.pos
      })
    }
    else {
      //this._onImgLoadError(url, current, tileInfo, img);
      this._load(current, true);
    }
  }

  _onImgLoadError(url, current, tileInfo, img) {
    if (current != this._current) return;
    this._load(current);
  }



  _getTileInfo(lat, lng, z) {
    var lng_rad = lng * Math.PI / 180;
    var R = 128 / Math.PI;
    var worldCoordX = R * (lng_rad + Math.PI);
    var pixelCoordX = worldCoordX * Math.pow(2, z);
    var tileCoordX = Math.floor(pixelCoordX / 256);

    var lat_rad = lat * Math.PI / 180;
    var worldCoordY = - R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
    var pixelCoordY = worldCoordY * Math.pow(2, z);
    var tileCoordY = Math.floor(pixelCoordY / 256);

    return {
      x: tileCoordX,
      y: tileCoordY,
      pX: Math.floor(pixelCoordX - tileCoordX * 256),
      pY: Math.floor(pixelCoordY - tileCoordY * 256)
    };

  }
}





/************************************************************************
 GSIBV.Map.Util.AddrLoader
************************************************************************/
GSIBV.Map.Util.AddrLoader = class extends MA.Class.Base {


  constructor() {
    super();
    this._url = 'https://cyberjapandata.gsi.go.jp/xyz/lv01_plg/14/{x}/{y}.geojson';
  }

  abort() {
    if (this._request) {
      this._request.abort();
      this._request = null;
    }
  }

  destroy() {
    this.clearEvents();
    this.abort();
  }

  load(pos) {
    this.abort();

    var tileInfo = this._getTileInfo(pos.lat, pos.lng, 14);

    var url = this._url;
    url = url.replace("{x}", tileInfo.x).replace("{y}", tileInfo.y)

    this._request = new MA.HTTPRequest({
      "type": "json",
      "url": url
    });

    this._request.on("load", MA.bind(this._onLoad, this, url, pos, tileInfo));
    this._request.on("error", MA.bind(this._onLoadError, this, pos, tileInfo));
    this._request.load();
  }

  _onLoad(url, pos, tileInfo, e) {
    this._request = null;

    var data = e.params.response;

    var hitFeature = null;
    if (data && data.features) {
      var targetPos = [pos.lng, pos.lat];
      for (var i = 0; i < data.features.length; i++) {
        var feature = data.features[i];
        if (!feature.geometry || !feature.geometry.coordinates) continue;

        var coords = feature.geometry.coordinates;
        if (feature.geometry.type != "MultiPolygon") {
          coords = [coords];
        }

        for (var j = 0; j < coords.length; j++) {
          var ret = null;

          ret = this._isPointInPolygon(targetPos, coords[j][0]);
          if (ret) {
            for (var k = 1; k < coords[j].length; k++) {
              // くりぬきポリゴン内なら×
              var ret2 = this._isPointInPolygon(targetPos, coords[j][k]);
              if (ret2) {
                ret = false;
                break;
              }
            }
            if (ret) {
              hitFeature = feature;
              break;
            }
          }
        }
        if (hitFeature) break;
      }


    }

    var title = null;
    var titleEng = null;
    if (hitFeature) {
      var properties = hitFeature.properties;
      try {
        var code = parseInt(properties["行政コード"]);
        var muni = GSI.MUNI_ARRAY[""+code];
        if ( muni ) {
          if ( title == null ) title = "";
          var muniParts = muni.split( ",");
          if ( muniParts.length >= 2) title += muniParts[1].trim();
          if ( muniParts.length >= 4) title += muniParts[3].trim();
          title += (properties["LV01"] ? properties["LV01"] : "")
        }
      } catch(ex) {
        console.log(ex);
      }
      /*
      var code = properties["行政コード"];
      //var muni = GSIBV.MUNI_ARRAY[code];
      title = properties["PREF"] + properties["MUNI"];
      //if ( muni ) {
      //  var muniParts = muni.split( ",");
      //  if ( muniParts.length >= 2) title += muniParts[1];
      //  if ( muniParts.length >= 4) title += muniParts[3];
      //}

      title += (properties["LV01"] ? properties["LV01"] : "");
      if( properties["eng"] && properties["MUNI_YOMI_"] && properties["PREF_YOMI_"] ) {
        titleEng = (properties["eng"] ? properties["eng"] + ", " : "")
          + (properties["MUNI_YOMI_"] ? properties["MUNI_YOMI_"] + ", " : "")
          + (properties["PREF_YOMI_"] ? properties["PREF_YOMI_"] + ", " : "");
      } else titleEng = title;
      */

    }
    this.fire("load", { "feature": hitFeature, "title": title, "titleEng": titleEng });
  }
  _isPointInPolygon(point, polygon) {
    var wn = 0;

    for (var i = 0; i < polygon.length - 1; i++) {
      if ((polygon[i][1] <= point[1]) && (polygon[i + 1][1] > point[1])) {
        var vt = (point[1] - polygon[i][1]) / (polygon[i + 1][1] - polygon[i][1]);
        if (point[0] < (polygon[i][0] + (vt * (polygon[i + 1][0] - polygon[i][0])))) {

          ++wn;

        }
      }
      else if ((polygon[i][1] > point[1]) && (polygon[i + 1][1] <= point[1])) {
        var vt = (point[1] - polygon[i][1]) / (polygon[i + 1][1] - polygon[i][1]);
        if (point[0] < (polygon[i][0] + (vt * (polygon[i + 1][0] - polygon[i][0])))) {

          --wn;

        }
      }
    }
    return (wn != 0);

  }

  _onLoadError(tileInfo, e) {
    this.fire("load", {});
  }

  _getTileInfo(lat, lng, z) {
    var lng_rad = lng * Math.PI / 180;
    var R = 128 / Math.PI;
    var worldCoordX = R * (lng_rad + Math.PI);
    var pixelCoordX = worldCoordX * Math.pow(2, z);
    var tileCoordX = Math.floor(pixelCoordX / 256);

    var lat_rad = lat * Math.PI / 180;
    var worldCoordY = - R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
    var pixelCoordY = worldCoordY * Math.pow(2, z);
    var tileCoordY = Math.floor(pixelCoordY / 256);

    return {
      x: tileCoordX,
      y: tileCoordY,
      pX: Math.floor(pixelCoordX - tileCoordX * 256),
      pY: Math.floor(pixelCoordY - tileCoordY * 256)
    };

  }

}