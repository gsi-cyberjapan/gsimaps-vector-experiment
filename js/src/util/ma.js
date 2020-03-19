var MA = {
  version: "0.5.0.0",
  Util: {}
};


String.prototype.toHalfWidth = function () {
  var result = this.replace(/[ー―‐]/g, '-');
  result = result.replace(/[！-～]/g,
    function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }
  );
  return result;
};

MA.isArray = function(obj) {
  return Array.isArray( obj );
};

MA.isString = function(obj) {
  return ( typeof obj == "string" );
};

/***************************************
    MA.ready
***************************************/
MA.ready = function (handler) {
  if (document.readyState !== 'loading') {
    handler();
  } else {
    document.addEventListener('DOMContentLoaded', handler);
  }
};


/***************************************
    MA.bind
***************************************/
MA.bind = function (handler, obj) {

  var args = Array.prototype.slice.call(arguments, 2);

  return function () {
    if (args.length)
      return handler.apply(obj,
        args.concat(Array.prototype.slice.call(arguments)));
    else
      return handler.apply(obj, arguments);
  };
};

/***************************************
    MA.copy
***************************************/
MA.copy = function (src) {
  var result = null;

  var typeName = Object.prototype.toString.call(src).toLowerCase();

  typeName = typeName.split(' ');
  if (typeName.length >= 2) typeName = typeName[1];
  else typeName = typeName[0];

  if (typeName.indexOf("array") >= 0) {
    result = [];
    for (var i = 0; src.length; i++) {
      result[i] = MA.copy(src[i]);
    }
  } else if (typeName.indexOf("object") >= 0) {
    result = {};
    for (var key in src) {
      result[key] = MA.copy(src[key]);
    }


  } else {
    result = src;
  }
  return result;
};



/***************************************
    MA.saveFile
***************************************/
MA.saveFile = function( fileName, mimeType, content ) {
  
  var blob = new Blob([content], {type : mimeType});

  var a = document.createElement('a');
  a.download = fileName;
  a.target   = '_blank';
  
  if (window.navigator.msSaveBlob) {
    // for IE
    window.navigator.msSaveBlob(blob, fileName)
  
  } else if (window.URL && window.URL.createObjectURL) {
    // for Firefox or safari
    if ( window.navigator.userAgent.toLowerCase().indexOf("safari")>= 0 ) {
      a.target ="";
    }
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    document.body.appendChild(a);
    
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
   
  } else if (window.webkitURL && window.webkitURL.createObject) {
    // for Chrome
    a.href = window.webkitURL.createObjectURL(blob);
    setTimeout( MA.bind(function(){
      this.click();
    },a), 1);
  
  } else {
    // for Safari
    window.open('data:' + mimeType + ';base64,' + window.Base64.encode(content), '_blank');
  }
};

/***************************************
    MA.getScreenSize
***************************************/

MA.getScreenSize = function () {
  return {
    width: window.innerWidth ? window.innerWidth : document.body.clientWidth,
    height: window.innerHeight ? window.innerHeight : document.body.clientHeight
  };
};

/***************************************
    MA.IdGenerator
***************************************/
MA.IdGenerator = class {
  constructor() {
    this._hash = {};
  }

  generate(prefix) {
    if ( !this._hash[prefix] ) {
      this._hash[prefix] = {
        inc : 0
      };
    }

    this._hash[prefix].inc++;
    return this._hash[prefix].inc;
  }
};
MA.IdGenerator.instance = new MA.IdGenerator();
MA.getId = function( prefix ) {
  return prefix + MA.IdGenerator.instance.generate( prefix );
};

MA.getTimestampText = function( prefix ) {
  var now = new Date();

  var year = now.getFullYear(); 
  var month = now.getMonth() + 1;
  var day = now.getDate();
  var hour = now.getHours();
  var min = now.getMinutes();
  var sec = now.getSeconds();
  var msec = now.getMilliseconds();
  var result =
    year + '' +
    ('00' + month).slice(-2) +
    ('00' + day).slice(-2) +
    ('00' + hour).slice(-2) +
    ('00' + min).slice(-2) +
    ('00' + sec).slice(-2) +
    msec;
  return (prefix ? prefix : "" ) +result;
};

/***************************************
    MA.Class
***************************************/
MA.Class = {}

MA.Class.Base = class {
  constructor() {

  }

  on(key, handler) {
    if (!this._eventHandlers) {
      this._eventHandlers = {};
    }

    var handlerList = this._eventHandlers[key];
    if (!handlerList) handlerList = [];

    var hitIndex = handlerList.indexOf(handler);

    if (hitIndex < 0) {
      handlerList.push(handler);
    }

    this._eventHandlers[key] = handlerList;
  }

  clearEvents() {
    this._eventHandlers = {};
  }
  off(key, handler) {
    if (!this._eventHandlers) return;

    var handlerList = this._eventHandlers[key];
    if (!handlerList) return;

    var hitIndex = handlerList.indexOf(handler);
    if (hitIndex >= 0) {
      handlerList.splice(hitIndex, 1);
    }

    this._eventHandlers[key] = handlerList;
  }

  fire(key, params) {
    if (!this._eventHandlers) return;

    var handlerList = this._eventHandlers[key];
    if (!handlerList) return;


    for (var i = 0; i < handlerList.length; i++) {
      var handler = handlerList[i];
      if (handler) handler({ from: this, type: key, params: params });
    }
  }
};


/***************************************
    MA.DOM
***************************************/
MA.DOM = function () { };


/***************************************
    MA.DOM.select
    DOMセレクター    
***************************************/
MA.DOM.select = function (selector) {
  return document.querySelectorAll(selector);
};


/***************************************
    MA.DOM.find
    DOM子要素セレクター    
***************************************/
MA.DOM.find = function (target, selector) {
  return target.querySelectorAll(selector);
};
/***************************************
    MA.DOM.findParentByTagName
    DOM親タグ検索   
***************************************/
MA.DOM.findParentByTagName = function (target, tagName) {

  while (target.parentNode) {

    if (target.parentNode.tagName.toLowerCase() == tagName.toLowerCase()) {

      return target.parentNode;
    }
    target = target.parentNode;
  }

  return null;

};
/***************************************
    MA.DOM.offset
    位置取得   
***************************************/
MA.DOM.offset = function (target, from) {
  var result = { left: 0, top: 0 };
  while (target && target != from) {

    result.left += parseFloat(target.offsetLeft);
    result.top += parseFloat(target.offsetTop);

    if (target.offsetParent && target.offsetParent.scrollTop > 0) {
      result.top -= target.offsetParent.scrollTop;
    }
    if (target.offsetParent && target.offsetParent.scrollLeft > 0) {
      result.left -= target.offsetParent.scrollLeft;
    }
    target = target.offsetParent;

  }

  return result;
};


/***************************************
    MA.DOM.size
    サイズ取得   
***************************************/
MA.DOM.size = function (target) {
  var result = {
    width: parseInt(target.offsetWidth),
    height: parseInt(target.offsetHeight)
  };

  return result;
};


/***************************************
    MA.DOM.create
    エレメント生成 
***************************************/
MA.DOM.create = function (a) {
};


/***************************************
    MA.DOM.append
    エレメント追加 
***************************************/
MA.DOM.create = function (tagName) {
  return document.createElement(tagName);
};


/***************************************
    MA.DOM.addClass
    CSSクラス追加    
***************************************/
MA.DOM.addClass = function (target, className) {
  if (target.forEach) {
    for (var i = 0; i < target.length; i++)
      target[i].classList.add(className);
  } else {
    target.classList.add(className);
  }

};


/***************************************
    MA.DOM.removeClass
    CSSクラス削除   
***************************************/
MA.DOM.removeClass = function (target, className) {
  //target.classList.remove(className);

  if (target.forEach) {
    for (var i = 0; i < target.length; i++)
      target[i].classList.remove(className);
  } else {
    target.classList.remove(className);
  }
};


/***************************************
    MA.DOM.hasClass
    CSSクラス存在確認 
***************************************/
MA.DOM.hasClass = function (target, className) {
  return target.classList.contains(className);
};

/***************************************
    MA.DOM.setHTML
    エレメントにHTML設定   
***************************************/
MA.DOM.setHTML = function (elems, html) {

  if (elems.innerHTML) elems.innerHTML = html;
  else {
    for (var i = 0; i < elems.length; i++) {
      elems[i].innerHTML = html;
    }
  }
};


/***************************************
    MA.DOM.show
    エレメント表示   
***************************************/
MA.DOM.show = function (target) {
  target.style.display = '';
};


/***************************************
    MA.DOM.hide
    エレメント非表示   
***************************************/
MA.DOM.hide = function (target) {
  target.style.display = 'none';
};


/***************************************
    MA.DOM.on
    イベント登録   
***************************************/
MA.DOM.on = function (target, eventName, handler) {
  if (target.forEach) {
    for (var i = 0; i < target.length; i++)
      target[i].addEventListener(eventName, handler);
  } else {
    target.addEventListener(eventName, handler);
  }
};


/***************************************
    MA.DOM.off
    イベント登録   
***************************************/
MA.DOM.off = function (target, eventName, handler) {
  target.removeEventListener(eventName, handler);
};


/***************************************
    MA.DOM.fadeIn
    フェードイン   
***************************************/
MA.DOM.fadeIn = function (target, ms, maxOpacity, callback) {

  target.style.opacity = 0;
  target.style.display = '';
  setTimeout(function () {
    target.style.transition = "opacity " + ms + "ms";
    var handler = function (e) {
      target.removeEventListener('transitionend', handler);
      target.style.display = '';
      if ( callback ) callback();

    };
    target.addEventListener('transitionend', handler);
    target.style.opacity = (maxOpacity ? maxOpacity : 1.0);
  }, 1);
};

/***************************************
    MA.DOM.zoomFadeIn
    zoomとフェードイン   
***************************************/
MA.DOM.zoomFadeIn = function (target, ms, maxOpacity, callback) {
  target.style.opacity = 0;
  target.style.transform = "scale(0.7)";
  target.style.display = '';
  setTimeout(function () {
    target.style.transition = "opacity " + ms + "ms, transform " + ms +"ms";
    var handler = function (e) {
      target.removeEventListener('transitionend', handler);
      target.style.display = '';
      if ( callback ) callback();

    };
    target.addEventListener('transitionend', handler);
    target.style.opacity = (maxOpacity ? maxOpacity : 1.0);
    target.style.transform = "scale(1)";
  }, 1);
};



/***************************************
    MA.DOM.fadeOut
    フェードアウト  
***************************************/
MA.DOM.fadeOut = function (target, ms, callback) {

  setTimeout(function () {
    target.style.transition = "opacity " + ms + "ms";
    var handler = function (e) {
      target.removeEventListener('transitionend', handler);
      target.style.display = 'none';
      //target.style.opacity = 1;
      if ( callback ) callback();
    };
    target.addEventListener('transitionend', handler);
    target.style.opacity = 0.0;
  }, 1);
};


/***************************************
    MA.DOM.zoomFadeOut
    フェードアウト  
***************************************/
MA.DOM.zoomFadeOut = function (target, ms, callback) {

  setTimeout(function () {
    target.style.transition = "opacity " + ms + "ms, transform " + ms +"ms";
    //target.style.transition = "opacity " + ms + "ms";
    var handler = function (e) {
      target.removeEventListener('transitionend', handler);
      target.style.display = 'none';
      //target.style.opacity = 1;
      if ( callback ) callback();
    };
    target.addEventListener('transitionend', handler);
    target.style.opacity = 0.0;
    target.style.transform = "scale(0.7)";
  }, 1);
};


/***************************************
    MA.DOM.isChild
    エレメントを含むかどうか 
***************************************/
MA.DOM.isChild = function (parent, target) {
  if (!target) return false;

  target = target.parentElement;

  while (target) {
    if (parent == target) return true;
    target = target.parentElement;
  }

  return false;

};



MA.lineIntersects = function(ax, ay, bx, by, cx, cy, dx, dy) {
    var ta = (cx - dx) * (ay - cy) + (cy - dy) * (cx - ax);
    var tb = (cx - dx) * (by - cy) + (cy - dy) * (cx - bx);
    var tc = (ax - bx) * (cy - ay) + (ay - by) * (ax - cx);
    var td = (ax - bx) * (dy - ay) + (ay - by) * (ax - dx);
  
    return tc * td < 0 && ta * tb < 0;
    //return tc * td <= 0 && ta * tb <= 0; // 端点を含む場合
};


MA.isPointInPolygon = function (point, polygon) {
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

};


MA.isPolygonInPolygon = function (inner,outer) {
  
  for (var i = 0; i < inner.length; i++) {
    if( !MA.isPointInPolygon( inner[i],outer )) {
      return false;
    }

  }

  return true;

};


MA.polygonIntersects = function(poly1, poly2 ) {
  for (var i = 0; i < poly1.length-1; i++) {
    
    for (var j = 0; j < poly2.length-1; j++) {
      if ( MA.lineIntersects(
        poly1[i][0], poly1[i][1],
        poly1[i+1][0], poly1[i+1][1],
        poly2[j][0], poly2[j][1],
        poly2[j+1][0], poly2[j+1][1],
      ) ) {
        return true;
      }
    }
  }

  return false;
}

/***************************************
    MA.Color
***************************************/
MA.Color = class extends MA.Class.Base {
  constructor(color) {
    super();
    this._hsv = null;
    this.copyFrom(color);
  }

  copyFrom(src) {
    if (src) {
      if (src instanceof MA.Color) {
        if (src.isEmpty()) {
          this._hsv = null;
        } else {
          if (!src._hsv.a && src._hsv.a != 0) src._hsv.a = 1;
          this._hsv = { h: src._hsv.h, s: src._hsv.s, v: src._hsv.v, a: src._hsv.a };
        }
      } else {
        if (src.r || src.r == 0) { this._hsv = MA.Color.rgb2hsv(src); }
        else if (src.v || src.v == 0) {
          if (!src.a && src.a != 0) src.a = 1;
          this._hsv = { h: src.h, s: src.s, v: src.v, a: src.a };
        }
        else if (src.l || src.l == 0) { this._hsv = MA.Color.hsl2hsv(src); }
      }
    }
    else {
      this._hsv = null;
    }
  }

  clone() {
    return new MA.Color(this);
  }

  isEmpty() {
    return (!this._hsv ? true : false);
  }

  getHSV() {
    return this._hsv;
  }

  getRGB() {
    return (this._hsv ? MA.Color.hsv2rgb(this._hsv) : null);
  }

  getHSL() {
    return (this._hsv ? MA.Color.hsv2hsl(this._hsv) : null);
  }

  static parse(txt) {
    if ( txt == undefined) return undefined;
    var m = null;
    m = txt.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*([,]*(\d+(\.\d+)?))*\)/);
    if (m) {
      var result = {
        r: parseInt(m[1]),
        g: parseInt(m[2]),
        b: parseInt(m[3]),
        a: (m[5] == undefined ? 1 : parseFloat(m[5]))
      };

      if (result.a < 0) result.a = 0;
      if (result.a > 1) result.a = 1;
      return result;
    }
    m = txt.match(/^#([a-fA-F0-9]{6})/);
    if (m) {
      return {
        r: parseInt(m[1].substring(0, 2), 16),
        g: parseInt(m[1].substring(2, 4), 16),
        b: parseInt(m[1].substring(4, 6), 16),
        a: 1
      };
    } else {
      m = txt.match(/^#([a-fA-F0-9]{3})/);
      if (m) {
        return {
          r: parseInt(m[1].substring(0, 1), 16),
          g: parseInt(m[1].substring(1, 2), 16),
          b: parseInt(m[1].substring(2, 3), 16),
          a: 1
        };
      }
    }

  }

  /***************************************
      MA.Color.hsv2rgb
  ***************************************/
  static hsv2rgb(hsv) {
    var c = hsv.v * hsv.s;
    var hp = hsv.h / 60;
    var x = c * (1 - Math.abs(hp % 2 - 1));

    var r, g, b;

    if (0 <= hp && hp < 1) { r = c; g = x; b = 0; };//{[r,g,b]=[c,x,0]};
    if (1 <= hp && hp < 2) { r = x; g = c; b = 0; };//{[r,g,b]=[x,c,0]};
    if (2 <= hp && hp < 3) { r = 0; g = c; b = x; };//{[r,g,b]=[0,c,x]};
    if (3 <= hp && hp < 4) { r = 0; g = x; b = c; };//{[r,g,b]=[0,x,c]};
    if (4 <= hp && hp < 5) { r = x; g = 0; b = c; };//{[r,g,b]=[x,0,c]};
    if (5 <= hp && hp <= 6) { r = c; g = 0; b = x; };//{[r,g,b]=[c,0,x]};

    var m = hsv.v - c;
    //[r, g, b] = [r+m, g+m, b+m];
    r = r + m; g = g + m; b = b + m;

    r = r * 255; //Math.round(r * 255);
    g = g * 255; //Math.round(g * 255);
    b = b * 255; //Math.round(b * 255);

    var a = 1;
    if (hsv.a || hsv.a == 0) a = hsv.a;
    return { r: r, g: g, b: b, a: a };
  }


  /***************************************
      MA.Color.rgb2hsv
  ***************************************/
  static rgb2hsv(rgb) {
    var max = Math.max(rgb.r, rgb.g, rgb.b);
    var min = Math.min(rgb.r, rgb.g, rgb.b);
    var diff = max - min;

    var result = { h: 0 };

    switch (min) {
      case max:
        result.h = 0;
        break;
      case rgb.r:
        result.h = (60 * ((rgb.b - rgb.g) / diff)) + 180;
        break;
      case rgb.g:
        result.h = (60 * ((rgb.r - rgb.b) / diff)) + 300;
        break;
      case rgb.b:
        result.h = (60 * ((rgb.g - rgb.r) / diff)) + 60;
        break;
    }

    result.s = max == 0 ? 0 : diff / max;
    result.v = max / 255;


    var a = 1;
    if (rgb.a || rgb.a == 0) a = rgb.a;

    result.a = a;

    return result;
  }

  /***************************************
      MA.Color.hsl2rgb
  ***************************************/
  static hsl2rgb(hsl) {
    var h = hsl.h;
    var s = hsl.s;
    var l = hsl.l;

    var max = l + (s * (1 - Math.abs((2 * l) - 1)) / 2);
    var min = l - (s * (1 - Math.abs((2 * l) - 1)) / 2);

    var rgb;
    var i = parseInt(h / 60);

    switch (i) {
      case 0:
      case 6:
        rgb = [max, min + (max - min) * (h / 60), min];
        break;
      case 1:
        rgb = [min + (max - min) * (120 - h / 60), max, min];
        break;
      case 2:
        rgb = [min, max, min + (max - min) * (h - 120 / 60)];
        break;
      case 3:
        rgb = [min, min + (max - min) * (240 - h / 60), max];
        break;
      case 4:
        rgb = [min + (max - min) * (h - 240 / 60), min, max];
        break;
      case 5:
        rgb = [max, min, min + (max - min) * (360 - h / 60)];
        break;
    }

    var a = 1;
    if (hsl.a || hsl.a == 0) a = hsl.a;

    return { r: rgb[0] * 255, g: rgb[1] * 255, b: rgb[2] * 255, a: a };
  }

  /***************************************
  MA.Color.rgb2hsl
  ***************************************/
  static rgb2hsl(rgb) {
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var diff = max - min;

    var h = 0;
    var l = (max + min) / 2;
    var s = diff / (1 - (Math.abs(max + min - 1)));
    if (isNaN(s)) s = 0;

    switch (min) {
      case max:
        h = 0;
        break;
      case r:
        h = (60 * ((b - g) / diff)) + 180;
        break;
      case g:
        h = (60 * ((r - b) / diff)) + 300;
        break;
      case b:
        h = (60 * ((g - r) / diff)) + 60;
        break;
    }

    var a = 1;
    if (rgb.a || rgb.a == 0) a = rgb.a;

    result.a = a;

    return { h: h, s: s, l: l, a: a };
  }

  /***************************************
      MA.Color.hsv2hsl
  ***************************************/
  static hsv2hsl(hsv) {
    var result = MA.Color.rgb2hsl(MA.Color.hsv2rgb(hsv));
    result.h = hsv.h;

    return result;
  }

  /***************************************
      MA.Color.hsl2hsv
  ***************************************/
  static hsl2hsv(hsl) {
    var result = MA.Color.rgb2hsv(MA.Color.hsl2rgb(hsl));
    result.h = hsl.h;
    return result;
  }

  /***************************************
      MA.Color.fix
  ***************************************/
  static fix(color) {
    var result = {};
    if (color.h || color.h == 0) result.h = Math.round(color.h);
    if (color.s || color.s == 0) result.s = Math.round(color.s * 100) / 100;
    if (color.v || color.v == 0) result.v = Math.round(color.v * 100) / 100;
    if (color.l || color.l == 0) result.l = Math.round(color.l * 100) / 100;
    if (color.r || color.r == 0) result.r = Math.round(color.r);
    if (color.g || color.g == 0) result.g = Math.round(color.g);
    if (color.b || color.b == 0) result.b = Math.round(color.b);
    if (color.a || color.a == 0) result.a = Math.round(color.a * 100) / 100;

    return result;
  }


  /***************************************
      MA.Color.toHex
  ***************************************/
  static toHex(color) {
    if (!color) return '';

    if (color.getRGB) color = color.getRGB();
    else {
      if (color.v) {
        color = MA.Color.hsv2rgb(color);
      } else if (color.l) {
        color = MA.Color.hsl2rgb(color);
      }
    }
    if (!color) return;

    if ((color.r || color.r == 0) && (color.g || color.g == 0) && (color.b || color.b == 0)) {

      return ("0" + color.r.toString(16)).slice(-2) +
        ("0" + color.g.toString(16)).slice(-2) +
        ("0" + color.b.toString(16)).slice(-2)
        ;

    } else return '';
  }

  /***************************************
      MA.Color.toHTMLHex
  ***************************************/
  static toHTMLHex(color) {
    var result = MA.Color.toHex(color);
    return (result == '' ? '' : '#' + result);
  }

  /***************************************
      MA.Color.toString
  ***************************************/
  static toString(color) {
    var result = "";
    color = MA.Color.fix( color );
    if ( color.r != undefined) {
      if ( color.a || color.a == 0 )
        result = "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")"; 
      else
        result = "rgb(" + color.r + "," + color.g + "," + color.b +")"; 
    }
    return result;
  }
}


/***************************************
    MA.HTTPRequest
***************************************/
MA.HTTPRequest = class extends MA.Class.Base {

  constructor(params) {
    super();
    this._url = params.url;
    this._method = params.method;
    this._data = params.data;
    this._type = params.type;
    this._header = params.header;
    this._noCache = params.noCache;

    this._method = (this._method == 'POST' ? 'POST' : 'GET');

  }

  _encode(s) {
    if (!s) return s;
    return encodeURIComponent(s);
  }


  load() {

    this.abort();

    this._request = new XMLHttpRequest();

    if (this._type) this._request.responseType = this._type;

    var url = this._url;

    var queryString = '';
    var postData = null;

    if (this._data) {
      for (var key in this._data) {
        if (queryString != '') queryString += '&';
        queryString += this._encode(key) + '=' + this._encode(this._data[key]);
      }
    }

    if (this._method == 'POST' && queryString) {
      postData = queryString;
      queryString = '';
    }

    if (queryString != '') {
      if (url.indexOf('?') >= 0) url += '&';
      else url += '?';

      url += queryString;
    }

    if (this._noCache) {
      if (url.indexOf('?') >= 0) url += '&';
      else url += '?';

      url += "_=" + (new Date()).getTime();
    }

    this._request.open(this._method,
      url,
      true);
    if (this._method == 'POST')
      this._request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');


    this._request.addEventListener('load', MA.bind(this._onLoad, this));
    this._request.addEventListener("error", MA.bind(this._onError, this));
    this._request.send(postData);

  }

  abort() {
    //this.clearEvents();
    if (this._request) {
      try {
        this._request.abort();
      } catch (e) {

      }
    }

    this._request = null;
  }

  _onLoad(e) {
    if (this._request.readyState === 4) {
      if (this._request.status === 200) {
        var response = {
          "request": this._request,
          "status": this._request.status,
          "response": this._request.response
        };

        this.fire("load", response);
        this.fire("finish", response);
      } else {
        this._onError(e);
      }
    }
  }

  _onError(e) {
    var response = {
      "request": this._request,
      "url": this._url,
      "status": this._request.status,
      "response": this._request.response
    };

    this.fire("error", response);
    this.fire("finish", response);
  }

}


/***************************************
  CSVパース
***************************************/
MA.Util.parseCSV = function( str, delimiter ){
	var rows = [], row = [], i, len, v, s = "", q, c;
    for(i=0,len=str.length; i<len; i++) {
        v = str.charAt(i);
        if (q) {
            if (v === '"') {
                if (str.charAt(i+1) === '"') {
                    i++;
                    s += v;
                } else { 
                    q = false;
                }
            } else { 
                s += v;
            }
        } else {
            if (v === '"' && !s) { 
                q = true;
            } else if (v === delimiter) {
                row.push(s); s = "";
            } else if (v === '\r' || v === '\n') {
                row.push(s); s = "";
                rows.push(row); row = [];
                if (v === '\r' && str.charAt(i+1) === '\n') {i++;}
            } else {
                s += v;
            }
        }
    }
    if (s || v === ',' || !s && v === '"') {row.push(s);}
    if (row.length) {rows.push(row);}
    if (!s && (v === '\r' || v === '\n')) {rows.push([]);}
    return rows;
};
