
GSIBV.UI.SearchPanel = class extends GSIBV.UI.Base {

  constructor(options) {
    super(options);
    this._options = options;

  }

  set map(map) {
    this._map = map;
  }

  initialize() {

    if (typeof this._options.form == "string") {
      this._form = MA.DOM.select(this._options.form)[0];
    } else {
      this._form = this._options.form;
    }

    this._queryInput = MA.DOM.find(this._form, "input[name=q]")[0];
    MA.DOM.on(this._queryInput, "focus", MA.bind(this._onQueryInputFocus, this));

    MA.DOM.on(this._form, "submit", MA.bind(this._onQuerySubmit, this));

    if (typeof this._options.searchresult == "string") {
      this._searchResultFrame = MA.DOM.select(this._options.searchresult)[0];
    } else {
      this._searchResultFrame = this._options.searchresult;
    }

    this._closeButton = MA.DOM.find(this._searchResultFrame, "a.close-button")[0];
    MA.DOM.on(this._closeButton, "click", MA.bind(this._onCloseButtonClick, this));

    this._resultRowTemplate = MA.DOM.find(this._searchResultFrame, ".result ul li")[0].cloneNode(true);
    MA.DOM.find(this._searchResultFrame, ".result ul")[0].innerHTML = '';

    this._searchResultFrame.style.display = 'none';

    this._prefList = [];
    var prefHash = {};
    for (var key in GSI.MUNI_ARRAY) {
      var parts = GSI.MUNI_ARRAY[key].split(',');

      var pref = prefHash[parts[0]];

      if (!pref) {
        pref = {
          "code": parts[0],
          "title": parts[1],
          "city": []
        }
        this._prefList.push(pref);
        prefHash[pref.code] = pref;
      }
      pref.city.push({
        "code": parts[2],
        "title": parts[3]
      })

    }

    this._prefSelect = MA.DOM.find(this._searchResultFrame, "select[name=pref]")[0];
    this._prefSelect.innerHTML = "";

    var option = MA.DOM.create("option");
    option.setAttribute("value", "");
    option.appendChild(document.createTextNode("都道府県"));
    this._prefSelect.appendChild(option);


    for (var i = 0; i < this._prefList.length; i++) {
      var pref = this._prefList[i];
      option = MA.DOM.create("option");

      option.setAttribute("value", pref.id);
      option.appendChild(document.createTextNode(pref.title));
      option._pref = pref;
      this._prefSelect.appendChild(option);


    }


    this._citySelect = MA.DOM.find(this._searchResultFrame, "select[name=city]")[0];

    MA.DOM.on(this._prefSelect, "change", MA.bind(this._onPrefChange, this));
    MA.DOM.on(this._citySelect, "change", MA.bind(this._onCityChange, this));
    this._onPrefChange();

  }
  _onQueryInputFocus() {

    var q = this._queryInput.value;
    if (this._addressSearcher && this._addressSearcher.query == q) {
      var list = this._addressSearcher.resultList;
      if (list) {
        this._showResultPanel(list);
      }
    }

    this._queryInput.select();
  }

  _onCloseButtonClick() {
    this.hideResult();
  }

  hideResult() {
    if (this._documentClickHandler) {
      MA.DOM.off(document.body, "mousedown", this._documentClickHandler);
      this._documentClickHandler = null;
    }
    this._map.searchResultLayer.setData([]);
    //this._searchResultFrame.style.display= 'none';

    MA.DOM.fadeOut(this._searchResultFrame, 200);
  }


  _onPrefChange() {

    this._citySelect.innerHTML = "";

    var option = MA.DOM.create("option");
    option.setAttribute("value", "");
    option.appendChild(document.createTextNode("市区町村"));
    this._citySelect.appendChild(option);


    var idx = this._prefSelect.selectedIndex;
    if (idx < 0) {
      return;
    }

    var prefOption = this._prefSelect.options[idx];
    var pref = prefOption._pref;
    if (!pref) return;

    for (var i = 0; i < pref.city.length; i++) {
      var city = pref.city[i];
      option = MA.DOM.create("option");

      option.setAttribute("value", city.id);
      option.appendChild(document.createTextNode(city.title));
      option._pref = pref;
      option._city = city;
      this._citySelect.appendChild(option);


    }
    this._onCityChange();

  }

  _onCityChange() {
    this._showResultPanel(this._searchResultList);
  }

  _onQuerySubmit() {
    var q = this._queryInput.value;

    var m = null;
    var result = null;

    // 緯度経度(lat lng z|lat,lng,z)
    m = q.trim().match(/^([-+]?[0-9]+(\.[0-9]+)?)([\s,]+)([-+]?[0-9]+(\.[0-9]+)?)(([\s,]+)([0-9]+(\.[0-9]+)?))?$/);
    if (m) {
      result = {
        lat: parseFloat(m[1]),
        lng: parseFloat(m[4]),
        z: parseFloat(m[8])
      };
    }
    // 緯度経度(#z/lat/lng)
    m = q.trim().match(/^[#]?([0-9]+(\.[0-9]+)?)([\/]+)([-+]?[0-9]+(\.[0-9]+)?)([\/]+)([-+]?[0-9]+(\.[0-9]+)?)$/);
    if (m) {
      result = {
        lat: parseFloat(m[4]),
        lng: parseFloat(m[7]),
        z: parseFloat(m[1])
      };
    }

    // 緯度経度度分秒
    m = q.trim().match(/^([+,-]?[0-9]+)度([0-9]+)分([0-9]+(\.[0-9]+)?)秒([\s]+)([+,-]?[0-9]+)度([0-9]+)分([0-9]+(\.[0-9]+)?)秒$/);
    if (m) {
      var minus = (parseFloat(m[1]) < 0);
      var lat = Math.abs(parseFloat(m[1])) +
        (parseFloat(m[2]) / 60) +
        (parseFloat(m[3]) / 3600);
      if (minus) lat *= -1;

      minus = (parseFloat(m[6]) < 0);
      var lng = Math.abs(parseFloat(m[6])) +
        (parseFloat(m[7]) / 60) +
        (parseFloat(m[8]) / 3600);
      if (minus) lng *= -1;

      result = {
        lat: lat,
        lng: lng
      };
    }

    // UTMポイント
    m = q.trim().match(/^[0-9]{2}[A-Za-z]{3}[0-9]{8}$/);
    if (m) {
      var latLng = GSIBV.Map.Util.UTM.point2LatLng(q);
      result = {
        lat: latLng.lat,
        lng: latLng.lng
      };
    }

    if (result) {
      this.fire("request", { "type": "position", "data": result });
      return;
    } else {
      this._search(q);
    }


  }

  _search(q) {
    if (!this._addressSearcher) {
      this._addressSearcher = new MA.Util.AddressSearcher();
      this._addressSearcher.on("searchstart", MA.bind(this._onSearchStart, this));
      this._addressSearcher.on("search", MA.bind(this._onSearch, this));
    }
    if (q == "") {


      this.hideResult();
    } else {
      this._addressSearcher.search(q);
    }
  }

  _onSearchStart() {
    this._showResultPanel();
  }
  _resultToView(list) {
    this._searchViewList = []

    if (!list) {
      MA.DOM.find(this._searchResultFrame, ".title .message")[0].innerHTML = '検索中';
      this._map.searchResultLayer.clear();

      return;
    }

    var ul = MA.DOM.find(this._searchResultFrame, ".result ul")[0];

    var pref = null;
    var city = null;
    if (this._citySelect.selectedIndex >= 0) {
      var cityOption = this._citySelect.options[this._citySelect.selectedIndex];
      pref = cityOption._pref;
      city = cityOption._city;
    }

    if (!pref && this._prefSelect.selectedIndex >= 0) {
      var prefOption = this._prefSelect.options[this._prefSelect.selectedIndex];
      pref = prefOption._pref;
    }


    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (pref) {
        if (!item.properties["pref"]) continue;
        if (pref.code == item.properties["pref"].code) {
          if (!city) {
            this._searchViewList.push(item);
          } else {
            if (!item.properties["city"]) continue;
            if (city.code == item.properties["city"].code) {
              this._searchViewList.push(item);
            }
          }
        }
      } else {
        this._searchViewList.push(item);
      }
    }
    for (var i = 0; i < this._searchViewList.length; i++) {
      var row = this._createResultRow(this._searchViewList[i]);
      ul.appendChild(row);
    }


    MA.DOM.find(this._searchResultFrame, ".title .message")[0].innerHTML
      = '検索結果:' + this._searchViewList.length + "件";


    this._map.searchResultLayer.setData(this._searchViewList);

  }
  _showResultPanel(list) {
    var ul = MA.DOM.find(this._searchResultFrame, ".result ul")[0];
    ul.innerHTML = '';

    this._resultToView(list);

    MA.DOM.fadeIn(this._searchResultFrame, 200);

    //this._searchResultFrame.style.display = '';

    if (this._documentClickHandler) {
      MA.DOM.off(document.body, "mousedown", this._documentClickHandler);
    }

    this._documentClickHandler = MA.bind(function (e) {
      if (e.target == this._queryInput) return;

      var target = e.target;
      while (target) {
        if (target == this._searchResultFrame) return;
        target = target.parentNode;
      }

      this.hideResult();

    }, this);


    MA.DOM.on(document.body, "mousedown", this._documentClickHandler);
  }
  _createResultRow(item) {
    var row = this._resultRowTemplate.cloneNode(true);

    var addr = "";
    if (item.properties["pref"]) addr += item.properties["pref"]["title"];
    if (item.properties["city"]) addr += item.properties["city"]["title"];
    MA.DOM.find(row, ".title")[0].innerHTML = item.properties["title"];
    MA.DOM.find(row, ".addr")[0].innerHTML = addr;

    var a = MA.DOM.find(row, "a")[0];
    MA.DOM.on(row, "mouseenter", MA.bind(function (row, item) {

      this._map.searchResultLayer.setActive(item);

    }, this, row, item));

    MA.DOM.on(row, "click", MA.bind(function (row, item) {

      this._map.map.setCenter(item.geometry.coordinates);
      this._map.map.setZoom(15);
    }, this, row, item));
    return row;
  }

  _onSearch(e) {
    this._searchResultList = e.params.result;
    this._showResultPanel(this._searchResultList);

  }

}
