GSIBV.Map.Draw.Tooltip = class extends MA.Class.Base {

  constructor(map) {
    super();
    this._map = map;
    this._create();
  }

  clear() {
    this._message = "";
    this._errorMessage = "";
    this.hide();
  }

  set message( value ) {
    if ( value && value != "" ) {
      this._message = value;
    } else {
      this._message = "";
    }
    
    if (
      ( this._errorMessage && this._errorMessage  != "" ) ||
      ( this._message && this._message  != "" ) ) {
        this.show();
    } else {
      this.hide();
    }
  }
  
  set errorMessage( value ) {
    this._errorMessage = value;
    if ( value && value != "" ) {
      this._errorMessage = value;
    } else {
      this._errorMessage = "";
    }

    if (
      ( this._errorMessage && this._errorMessage  != "" ) ||
      ( this._message && this._message  != "" ) ) {
        this.show();
    } else {
      this.hide();
    }

  }

  _create() {
    
    if ( this._container ) return;
    this._container = MA.DOM.create("div");
    MA.DOM.addClass(this._container,"-sakuz-draw-tooltip")
    this._messageContainer = MA.DOM.create("p");
    this._container.appendChild( this._messageContainer );
    this._messageContainer.innerHTML = "";
    this._map.map.getCanvasContainer().appendChild( this._container);
    this._container.style.display = "none";
    this.hide();
  }

  destroy() {
    this._clearTimer();
    this._message = "";
    this._errorMessage = "";
    this._dms = undefined;
    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler);
      this._mouseMoveHandler = undefined;
    }
    if ( !this._container) return;

    if ( this._container.parentNode ) {
      this._container.parentNode.removeChild( this._container);
    }

    this._container = undefined;
    this._messageContainer = undefined;

    
  }

  _clearTimer() {
    if ( this._timerId) {
      clearTimeout(this._timerId);
      this._timerId = undefined;
    }
  }

  _startTimer() {
    this._clearTimer();
    return;
    
    this._timerId = setTimeout(MA.bind(function(){
      this.hide();
    },this), 30000);
  }

  _update() {

    var isError = this._errorMessage && this._errorMessage != "";

    var message = ( isError ? this._errorMessage :this._message );
    if ( this._dms) {
      var dms = this._dms ;
      message += "<div>" + dms.lat.text + "," + dms.lng.text + "</div>";
    }

    if ( isError ) {
      MA.DOM.addClass( this._container, "error" );
    } else {
      MA.DOM.removeClass( this._container, "error" );
    }

    // 計測結果表示用------------------------------
    /*
    if ( this._distance !=undefined) {
      
      var distanceStr = '';

      if (this._distance > 1000) {
        distanceStr = (this._distance  / 1000).toFixed(2) + ' km';
      } else {
        distanceStr = Math.ceil(this._distance ) + ' m';
      }
      message = '<div class="distance">' + distanceStr + "</div>"  + message;
    } else if ( this._area != undefined ) {
      var areaStr = '';
      if (this._area >= 1000000) {
        areaStr = (this._area / 1000000).toFixed(3) + ' km&sup2;';
      } else {
        areaStr = Math.ceil(this._area) + ' m&sup2;';
      }
      message = '<div class="distance">' + areaStr + "</div>"  + message;
    }
    */
    //------------------------------

    this._messageContainer.innerHTML = message;
  }

  show() {
    this._startTimer();
    this._update();

    if ( !this._mouseMoveHandler ) {
      this._mouseMoveHandler = MA.bind( this._onMouseMove, this );
      MA.DOM.on( document.body, "mousemove", this._mouseMoveHandler);
    }
  }

  hide() {
    this._clearTimer();
    this._messageContainer.innerHTML = "";
    this._container.style.display = "none";
    this._tooltipDMS = undefined;
    if ( this._mouseMoveHandler ) {
      MA.DOM.off( document.body, "mousemove", this._mouseMoveHandler);
      this._mouseMoveHandler = undefined;
    }
  }

  _onMouseMove(evt) {
    var pos = this._pagePosToCanvasPos(evt);

    var latlng = this._map.map.unproject( pos );
    
    //計測用------------------------------
    this._distance = undefined;
    this._area = undefined;
    try {
      if ( this.distanceCalculator ) {
        var distance = this.distanceCalculator(latlng);
        if ( distance ) {
          if ( distance["type"] == "distance" ) {
            this._distance = distance.distance;
          } else {
            this._area = distance.distance;
          }
        }
      }
    }catch(ex) {}
    //------------------------------

    var dms = GSIBV.Map.Util.latLngToDMS(latlng );
    this._dms = dms;
    this._container.style.display = "block";
    this._container.style.top = (pos.y - 12 ) + "px";
    this._container.style.left = ( pos.x + 20 ) + "px";
    this._update();

  }

  
  
  _pagePosToCanvasPos(evt) {

    var pos = {
      x : evt.pageX,
      y : evt.pageY
    };
    var canvasContainer = this._map.map.getCanvasContainer();
    var offset = MA.DOM.offset(canvasContainer);
    pos.x -= offset.left;
    pos.y -= offset.top;

    return pos;
  }


};