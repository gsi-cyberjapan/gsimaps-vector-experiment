MA.Util.AddressSearcher = class extends MA.Class.Base {

  constructor() {
    super();
    this._addressSearchUrl = 'https://msearch.gsi.go.jp/address-search/AddressSearch';
    this._getAddressUrl = 'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress';
  }

  get resultList() { return this._list; }
  get query() { return this._query; }
  search(q) {
    this._query = q;
    this._clear();

    this.fire("searchstart", { "q": q });

    this._addressSearchRequest = new MA.HTTPRequest({
      "type": "json",
      "url": this._addressSearchUrl,
      "data": { "q": q }
    });

    this._addressSearchRequest.on("load", MA.bind(this._onSearch, this));
    this._addressSearchRequest.on("error", MA.bind(this._onSearchError, this));

    this._addressSearchRequest.load();

  }
  clear() {
    this._clear();
  }
  _clear() {
    if (this._requestList) {
      for (var i = 0; i < this._requestList.length; i++) {
        if (this._requestList[i].req)
          this._requestList[i].req.abort();
      }
    }

    this._requestList = [];

    if (this._addressSearchRequest) {
      this._addressSearchRequest.abort();
      this._addressSearchRequest = null;
    }

  }

  _onSearch(e) {
    var list = e.params.response;
    this._requestList = [];

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var addressCode = item.properties["addressCode"];
      var addr = GSI.MUNI_ARRAY[addressCode];

      if (addr) {
        var addr = addr.split(',');
        item.properties["pref"] = { "code": addr[0], "title": addr[1] };
        item.properties["city"] = { "code": addr[2], "title": addr[3] };
      } else {
        this._getAddr(item);
      }
    }
    this._list = list;
    this._checkLoaded();
  }

  _checkLoaded() {

    if (!this._requestList || this._requestList.length <= 0) {
      //loaded

      return;
    }

    for (var i = 0; i < this._requestList.length; i++) {
      if (!this._requestList[i].finished) return;
    }

    this._requestList = [];

    this.fire("search", { "result": this._list });
  }
  _getAddr(item) {

    var req = new MA.HTTPRequest({
      "type": "json",
      "url": this._getAddressUrl,
      "data": { "lon": item.geometry.coordinates[0], "lat": item.geometry.coordinates[1] }
    });
    var data = { "req": req, "item": item };
    req.on("load", MA.bind(function (data, e) {
      try {
        var addressCode = parseInt(e.params.response.results["muniCd"]);
        var addr = GSI.MUNI_ARRAY[addressCode];
        if (addr) {
          var addr = addr.split(',');
          data.item.properties["pref"] = { "code": addr[0], "title": addr[1] };
          data.item.properties["city"] = { "code": addr[2], "title": addr[3] };
        }
      } catch (ex) { }
    }, this, data));

    req.on("finish", MA.bind(function (e) {
      data.finished = true;
      this._checkLoaded();
    }, this, data));

    this._requestList.push(data);
    req.load();
  }

  _onSearchError(e) {

    this.fire("search", { "result": undefined });
  }
}