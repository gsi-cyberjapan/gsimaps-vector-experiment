GSIBV.UI.Dialog.CSVLoadDialog = class extends GSIBV.UI.Dialog.Modeless {

  constructor(fileName, options) {
    super(options);
    this._title = "CSVファイル読込" + "&nbsp;" + fileName;
    this._fileName = fileName;
    this._size.width = 350;
    this._size.height = 280;

    var windowSize = MA.getScreenSize()
    this._position = {
      left: Math.floor(windowSize.width/2 - 180),
      top: Math.floor(windowSize.height/2 - 180)
    }
    this._resizable = true;
  }

  _setFrameHeight(value) {
    if(!isNaN(parseInt(value))) {
      $(this._frame).css("height", value+'px');
    }
  }

  show(data) {
    super.show();

    console.log("show csv dialog");
    if(!data || !this.container) return;
    if(this._loader) return;

    this._data = data;
    if(!this._parse()){
      console.log("Parse csv failed!");
      return;
    }

    this._initializeTableHeader();
  }

  hide(){
    if (this._loader) {
      this._loader.cancel();
      delete this._loader;
      this._loader = null;
    }
    if ( this._imageSelector) {
      this._imageSelector.destroy();
      this._imageSelector = undefined;
    }
    super.hide();
  }

  _createHeader(headerContainer) {
    this._titleContainer = MA.DOM.create("div");
    this._titleContainer.innerHTML = this._title;
    headerContainer.appendChild(this._titleContainer);
    super._createHeader(headerContainer);
  }

  _createIconFrame() {
    var iconFrame = $("<div>").addClass("icon_frame");
    var table = $('<table>');
    var tbody = $('<tbody>');

    var iconPanel = $("<div>");
    iconPanel.addClass("icon-panel");
    this._iconImage = $("<img>");
    this._iconImage.attr("src", GSIBV.CONFIG.SAKUZU.SYMBOL.URL + GSIBV.CONFIG.SAKUZU.SYMBOL.DEFAULTICON);
    iconPanel.append(this._iconImage);

    var tr = $('<tr>');
    tr.append($('<td>').css({ 'white-space': 'nowrap' }).html('アイコン:'));
    tr.append($('<td>').append(iconPanel));
    tr.append($('<td>').css({ 'white-space': 'nowrap' }).html('&nbsp;&nbsp;拡大率:'));
    this._pointIconSizeSelect = $('<select>');
    this._pointIconSizeSelect.append($('<option>').html("0.5").val("0.5"));
    this._pointIconSizeSelect.append($('<option>').html("1.0").val("1.0"));
    this._pointIconSizeSelect.append($('<option>').html("1.5").val("1.5"));
    this._pointIconSizeSelect.append($('<option>').html("2.0").val("2.0"));
    this._pointIconSizeSelect.on('change', MA.bind(this._onPointIconSizeChange, this));
    tr.append($('<td>').append(this._pointIconSizeSelect));
    tr.append($('<td>').css({ 'white-space': 'nowrap' }).html('<a href = "https://geocode.csis.u-tokyo.ac.jp/home/simple-geocoding/" target=_blank style="padding-left:2em;">協力：東大CSIS</a>'));

    tbody.append(tr);
    table.append(tbody);
    iconFrame.append(table);

    MA.DOM.on( iconPanel.get(0), "click", MA.bind(function(){
      if ( !this._imageSelector) {
        this._imageSelector = new GSIBV.UI.Dialog.SakuzuEditInfoDialog.MarkerEditPanel.ImageSelector();
        this._imageSelector .on("select", MA.bind(function(evt) {
          this._iconImage.attr("src", evt.params.url);
        },this));
      }
      this._imageSelector.show(iconPanel.get(0));
    },this, iconPanel) );

    this._pointIconSizeSelect.val("1.0");

    return iconFrame;
  }

  _createContents(contentsContainer) {
    this.frame = $('<div>').addClass("gsi_csvdialog_content");

    // アイコン選択
    var iconFrame = this._createIconFrame();
    this.frame.append(iconFrame);

    // メッセージ
    this._messageFrame = $("<div>").addClass("message_frame");
    this.frame.append(this._messageFrame);

    // ヘッダ扱い
    this._tableMassageFrame = $("<div>").addClass("tablemessage_frame");
    this.frame.append(this._tableMassageFrame);

    // テーブル
    var tableFrame = $("<div>").addClass("table_frame");
    var table = $("<table>");
    this._tableHeader = $("<thead>");
    this._tableBody = $("<tbody>");
    table.append(this._tableHeader).append(this._tableBody);
    tableFrame.append(table);
    this.frame.append(tableFrame);

    // 開始ボタン
    var buttonFrame = $("<div>").addClass("button_frame")
    this._okButton = $("<a>").addClass("normalbutton").attr({ "href": "javascript:void(0);" }).html("上記の内容で読込開始");
    this._okButton.on("click", MA.bind(this._onLoadButtonClicked, this));
    buttonFrame.append(this._okButton);

    this.frame.append(buttonFrame);

    this.container = $(contentsContainer);
    this.container.append(this.frame);
  }

  _initMessage() {
    this._messageFrame.empty();

    var latSelect = this._tableHeader.find("select[name=lat]");
    var lngSelect = this._tableHeader.find("select[name=lng]");
    var addrSelect = this._tableHeader.find("select[name=addr]");

    this._setFrameHeight(280);
    if (addrSelect.length > 0 && latSelect.length > 0) {
      this._messageFrame.html("緯度及び経度の列を選択してください。<br>緯度及び経度の列がない場合は住所の列を選択してください。");
      this._setFrameHeight(320);
    } else if (latSelect.length > 0) {
      this._messageFrame.html("緯度及び経度の列を選択してください。");
    } else if (addrSelect.length > 0) {
      this._messageFrame.html("住所の列を選択してください。");
    }

    var err = false;
    var isSetHeader = false;
    for (var key in this._csv.headers) {
      if (this._csv.headers[key] >= 0) {
        isSetHeader = true;
        break;
      }
    }

    if (!isSetHeader) {
      err = true;
    } else {
      if (this._csv.headers["lat"] >= 0) {
        if (this._csv.headers["lng"] < 0) {
          err = true;
        }
      } else if (this._csv.headers["lng"] >= 0) {
        if (this._csv.headers["lat"] < 0) {
          err = true;
        }
      }
    }

    if (err) {
      this._okButton.addClass("disabled");
    } else {
      this._okButton.removeClass("disabled");
    }
  }

  _parse() {
    this._csv = {
      data: $.csv.toArrays(this._data),
      hasHeader: false,
      headers: {
        title: -1,
        lat: -1,
        lng: -1,
        addr: -1
      }
    };
    this._tableType = "addr";
    if (!this._csv.data || this._csv.data.length <= 0) return false;
    this._initHeader();

    return true;
  }

  _initHeader() {
    var line = this._csv.data[0];

    for (var i = 0; i < line.length; i++) {
      var title = line[i].trim();

      switch (title) {
        case "緯度":
        case "lat":
        case "latitude":
          this._csv.hasHeader = true;
          if (this._csv.headers.lat < 0) this._csv.headers.lat = i;
          break;

        case "経度":
        case "lng":
        case "lon":
        case "longitude":
          this._csv.hasHeader = true;
          if (this._csv.headers.lng < 0) this._csv.headers.lng = i;
          break;
        case "施設名":
        case "施設名称":
        case "名称":
        case "名前":
        case "title":
          this._csv.hasHeader = true;
          if (this._csv.headers.title < 0) this._csv.headers.title = i;
          break;

        case "住所":
        case "所在地":
        case "addr":
        case "address":
          this._csv.hasHeader = true;
          if (this._csv.headers.addr < 0) this._csv.headers.addr = i;
          break;
      }
    }

    if (!this._csv.hasHeader && this._csv.data.length > 0) {
      var latIndex = -1;
      var lngIndex = -1;

      for (var row = 0; row < this._csv.data.length && row < 2; row++) {

        var line = this._csv.data[row];
        for (var i = 0; i < line.length; i++) {
          var value = line[i];
          var regex = new RegExp(/^[-+]?[0-9]+(\.[0-9]+)?$/);
          if (regex.test(value)) {
            value = parseFloat(value);
            if (value >= 10 && value < 100) {
              latIndex = i;
            } else if (value >= 100 && value < 1000) {
              lngIndex = i;
            }
          }

        }
      }

      if (latIndex >= 0 && lngIndex >= 0) {
        this._csv.headers.lat = latIndex;
        this._csv.headers.lng = lngIndex;
        this._tableType = "latlngaddr";
      } else {
        var hitColArr = [];
        for (var col = 0; col < this._csv.data[0].length; col++) {
          var value = line[col];
          var hit = { num: 0 };
          hitColArr.push(hit);
          if (value == undefined) {
            continue;
          }
          for (var row = 0; row < this._csv.data.length && row < 10; row++) {

            var value = this._csv.data[row][col];
            for (var key in GSI.MUNI_ARRAY) {
              var parts = GSI.MUNI_ARRAY[key].split(",")
              if (parts.length < 4) continue;

              parts = parts[3].split(/[\s|　]/);

              if (value.indexOf(parts[0]) >= 0) {
                hit.num++;
                break;
              }
            }
          }
        }

        var maxHit = -1;

        for (var i = 0; i < hitColArr.length; i++) {
          if (maxHit < hitColArr[i].num) {
            maxHit = hitColArr[i].num;
            this._csv.headers.addr = i;
          }
        }
      }
    } else {
      if (this._csv.headers.lat >= 0 && this._csv.headers.lng >= 0) {
        //緯度経度あり（緯度経度選択）
        this._tableType = "latlng";
      } else if (this._csv.headers.addr >= 0) {
        // 住所有り（住所選択）
      } else {
        // なし（住所選択）
      }
    }

    return false;
  }

  _initializeTableHeader(){
    this._tableHeader.empty();

    function createSelect($this, name, idx) {
      var line = $this._csv.data[0];
      var select = $("<select>").attr({ "name": name });
      select.append($('<option>').html("なし").val(""));
      for (var i = 0; i < line.length; i++) {
        var title = (i + 1) + "列目";
        if ($this._csv.hasHeader) {
          title = line[i];
        }
        select.append($('<option>').html(title).val(i));
      }

      if (idx >= 0)
        select.val(idx);
      else
        select.val("");

      select.on("change", MA.bind($this._onHeaderSelectChange, $this));
      return select;
    }

    var tr = null;
    var th = null;
    switch (this._tableType) {
      case "latlng":
        tr = $("<tr>");
        th = $("<th>").html("緯度");
        tr.append(th);
        th = $("<th>").html("経度");
        tr.append(th);
        this._tableHeader.append(tr);

        tr = $("<tr>");
        th = $("<th>").append(createSelect(this, "lat", this._csv.headers.lat));
        tr.append(th);
        th = $("<th>").append(createSelect(this, "lng", this._csv.headers.lng));
        tr.append(th);
        this._tableHeader.append(tr);
        break;

      case "latlngaddr":
        tr = $("<tr>");
        th = $("<th>").html("住所");
        tr.append(th);
        th = $("<th>").html("緯度");
        tr.append(th);
        th = $("<th>").html("経度");
        tr.append(th);
        this._tableHeader.append(tr);

        tr = $("<tr>");
        th = $("<th>").append(createSelect(this, "addr", this._csv.headers.addr));
        tr.append(th);
        th = $("<th>").append(createSelect(this, "lat", this._csv.headers.lat));
        tr.append(th);
        th = $("<th>").append(createSelect(this, "lng", this._csv.headers.lng));
        tr.append(th);
        this._tableHeader.append(tr);
        break;

      default:
        tr = $("<tr>");
        th = $("<th>").html("住所");
        tr.append(th);
        this._tableHeader.append(tr);

        tr = $("<tr>");

        th = $("<th>").append(createSelect(this, "addr", this._csv.headers.addr));
        tr.append(th);
        this._tableHeader.append(tr);

        break;
    }

    this._onHeaderSelectChange();
  }

  _onHeaderSelectChange(e) {
    var latSelect = this._tableHeader.find("select[name=lat]");
    var lngSelect = this._tableHeader.find("select[name=lng]");
    var addrSelect = this._tableHeader.find("select[name=addr]");
    var startIndex = (this._csv.hasHeader ? 1 : 0);

    var displayLength = this._csv.data.length - startIndex;
    if (displayLength > 5) displayLength = 5;

    this._tableMassageFrame.html("全" + (this._csv.data.length - startIndex) + "件中" + displayLength + "件表示");
    this._tableBody.empty();

    if (latSelect.length <= 0) this._csv.headers.lat = -1;
    if (lngSelect.length <= 0) this._csv.headers.lng = -1;
    if (addrSelect.length <= 0) this._csv.headers.addr = -1;

    var titleCol = -1;
    var addrCol = -1;
    if (addrSelect.length > 0) {
      addrCol = addrSelect.val();
      if (addrCol == "") addrCol = -1;
      else addrCol = parseInt(addrCol);
      this._csv.headers.addr = addrCol;
    }

    var latCol = -1;
    var lngCol = -1;
    if (latSelect.length > 0) {
      latCol = latSelect.val();
      lngCol = lngSelect.val();
      if (latCol == "") latCol = -1;
      else latCol = parseInt(latCol);
      if (lngCol == "") lngCol = -1;
      else lngCol = parseInt(lngCol);
      this._csv.headers.lat = latCol;
      this._csv.headers.lng = lngCol;
    }

    var tr = null;
    var td = null;
    for (var i = startIndex; i < this._csv.data.length && i < 5 + startIndex; i++) {
      tr = $("<tr>");
      var line = this._csv.data[i];

      if (addrSelect.length > 0) {
        // addr
        td = $("<td>").html("&nbsp;");
        if (addrCol >= 0) {
          td.html(line[addrCol]);
        }
        tr.append(td);
      }

      if (latSelect.length > 0) {
        // lat
        td = $("<td>").html("&nbsp;");
        if (latCol >= 0) {
          td.html(line[latCol]);
        }
        tr.append(td);

        // lng
        td = $("<td>").html("&nbsp;");
        if (lngCol >= 0) {
          td.html(line[lngCol]);
        }
        tr.append(td);
      }
      this._tableBody.append(tr);
    }

    this._initMessage();

    // this.container.css({ height: "" });
    // setTimeout(MA.bind(function () {
    //   this.container.css({ height: "auto" });
    // }, this), 10);
  }

  _onPointIconSizeChange() {
  }

  _onPointIconSelect(event) {
  }

  _onCloseClick() {
    this.fire("close");
    this.hide();
  }

  _onLoadButtonClicked() {
    console.log("start to load");
    this._initMessage();
    if (this._okButton.hasClass("disabled")) return;

    this._loader = new GSI.CSVLatLngLoader(this._csv);
    this._loader.on("finish", MA.bind(this._onFinish, this));
    this._loader.load();
  }

  _onFinish(e){
    var iconInfoList = [];
    var params = e.params;
    
    var iconUrl = this._iconImage.attr("src");
    var iconScale = parseFloat(this._pointIconSizeSelect.val());
    var iconSize = [20*iconScale, 20*iconScale];

    if(params && Array.isArray(params.lines)){
      for(var i = 0; i < params.lines.length; i++) {
        var line = params.lines[i];
        if (!line.latlng || line.latlng.lat == undefined || line.latlng.lng == undefined) continue;

        var iconInfo = {
          iconUrl: iconUrl,
          iconSize: iconSize,
          bound: [line.latlng.lng, line.latlng.lat]
        };
        var properties = {};
        var fieldNo = 1;
        for (var j = 0; j < line.line.length; j++) {
          var value = line.line[j];
          if (value == "") continue;
          
          var fieldName = params.headers && params.headers.length > j ? params.headers[j]:"";
          if (fieldName == "") {
            fieldName = "属性" + fieldNo;
            fieldNo++;
          }
          properties[fieldName] = value;
        }
        iconInfo.properties = properties;
        iconInfoList.push(iconInfo);
      }
    }

    this.fire("finish", {
      fileName: this._fileName,
      iconInfoList: iconInfoList
    });

    this.hide();
  }
};


GSI.CSVLatLngLoader = class extends MA.Class.Base {
  constructor(csv) {
    super();
    this._maxload = 40;
    this._csv = csv;
  }

  cancel() {
    this._cancel = true;
    this._queue = [];
    for (var i = 0; i < this._loadingList.length; i++) {
      this._loadingList[i].cancel();
    }
    this._loadingList = [];
  }

  load() {
    this._queue = [];
    this._loadingList = [];
    var startIdx = (this._csv.hasHeader ? 1 : 0);
    this._result = {
      lines: []
    };
    if (this._csv.hasHeader && this._csv.data.length > 0) {
      this._result.headers = [];
      for (var i = 0; i < this._csv.data[0].length; i++) {
        this._result.headers.push(this._csv.data[0][i]);
      }
    } else if (this._csv.data.length > 0) {
      this._result.headers = [];
      for (var i = 0; i < this._csv.data[0].length; i++) {
        this._result.headers.push("");
      }

      if (this._csv.headers.addr >= 0) {
        this._result.headers[this._csv.headers.addr] = "所在地";
      }
      if (this._csv.headers.lat >= 0) {
        this._result.headers[this._csv.headers.lat] = "緯度";
      }
      if (this._csv.headers.lng >= 0) {
        this._result.headers[this._csv.headers.lng] = "経度";
      }
    }

    if (this._csv.headers.title >= 0) {
      this._result.headers[this._csv.headers.title] = "name";
    }

    for (var i = startIdx; i < this._csv.data.length; i++) {
      var loader = new GSI.CSVLineLatLngLoader(
        i - startIdx, this._csv.data[i], {
        headers: this._csv.headers
      });
      loader.on("load", MA.bind(this._onLoad, this, loader));
      this._queue.push(loader);

      this._result.lines.push({
        line: this._csv.data[i]
      });
    }
    this._next();
  }

  _onLoad(loader, e) {
    if (this._cancel) return;
    var params = e.params;
    if (params.lat != undefined && params.lng != undefined) {
      this._result.lines[params.idx].latlng = {
        lat: params.lat,
        lng: params.lng
      };
    }
    var idx = this._loadingList.indexOf(loader);
    if (idx >= 0) {
      this._loadingList.splice(idx, 1);
    }
    this._next();
  }

  _next() {
    if (this._cancel) return;
    while (this._queue.length > 0 && this._loadingList.length < this._maxload) {
      var loader = this._queue.shift();
      this._loadingList.push(loader);
      loader.load();
    }
    // this.fire("progress", {
    //   max: this._result.lines.length,
    //   value: this._result.lines.length - (this._queue.length + this._loadingList.length)
    // });
    if (this._queue.length <= 0 && this._loadingList.length <= 0) {
      this.fire("finish", this._result);
    }
  }
}


GSI.CSVLineLatLngLoader = class extends MA.Class.Base{
  constructor(idx, line, options) {
    super();
    this._line = line;
    this._idx = idx;
    this._options = options;
  }

  _fireLoad(lat, lng){
    this.fire("load", { idx: this._idx, lat: lat, lng: lng });
  }

  cancel(){
    this._queue = [];
    if (this._request) {
      this._request.abort();
      this._request = null;
    }
  }

  load() {
    try {
      if (this._options.headers.lat >= 0 && this._options.headers.lng >= 0) {
        var lat = this._line[this._options.headers.lat];
        var lng = this._line[this._options.headers.lng];
        if (lat.match(/^[+,-]?([1-9]\d*|0)(\.\d+)?$/)
          && lng.match(/^[+,-]?([1-9]\d*|0)(\.\d+)?$/)) {
          lat = parseFloat(lat);
          lng = parseFloat(lng);
          setTimeout(MA.bind(function (lat, lng) {
            this._fireLoad(lat, lng);
          }, this, lat, lng), 0);
          return
        }
      }
    } catch (e) { console.log(e); }

    // load
    //https://msearch.gsi.go.jp/address-search/AddressSearch?q=%E4%B8%89%E5%8E%9F%E5%B8%82

    this._queue = [];
    if (this._options.headers.addr >= 0 || this._options.headers.title >= 0) {
      if (this._options.headers.addr >= 0)
        this._queue.push(this._line[this._options.headers.addr]);
      if (this._options.headers.title >= 0)
        this._queue.push(this._line[this._options.headers.title]);
      this._next();
    } else {
      setTimeout(MA.bind(function () {
        this._fireLoad();
      }, this), 0);
    }
  }

  _next() {
    if (this._queue.length <= 0) {

      this._fireLoad();
      return;
    }

    var q = this._queue.shift();
    if (q == undefined) this._next();
    q = q.trim();

    if (q == "") {
      setTimeout(MA.bind(function () {
        this._next();
      }, this), 0);
    }

    this._request = $.ajax({
      type: "GET",
      dataType: "JSON",
      "url": "https://msearch.gsi.go.jp/address-search/AddressSearch",
      "data": { "q": q }
    }).done(MA.bind(this._onLoad, this, q))
      .fail(MA.bind(this._onLoadError, this));
  }

  _onLoad(q, e){
    var item = (e && e.length > 0 ? e[0] : null);
    if (item && item.geometry) {
      this._fireLoad(item.geometry.coordinates[1], item.geometry.coordinates[0]);
    } else {
      // ヒットしない
      console.log(q);
      this._next();
    }
  }

  _onLoadError(e) {
    console.log("load line failed! error: " + e);
    this._next();
  }
}