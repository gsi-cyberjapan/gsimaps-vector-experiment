
GSIBV.UI.Dialog.CrossSectionViewGraph = class extends MA.Class.Base {
  constructor() {
    super();
    this.options = {
      width: 400,
      height: 200,
      scale: 1,
      ratio: {
      }
    };
    this.options.minMode = GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_LOW;
    this._graphImage = new GSIBV.UI.Dialog.CrossSectionViewGraphImage();
  }

  // 最低値モード
  getMinMode() {
    return this.options.minMode;
  }
  // 最低値モード
  setMinMode(minMode) {
    this.options.minMode = minMode;
    this.create(this._data);
  }
  // 縦横比
  setRatio(ratio) {
    if (this.options.ratio.vert != ratio.vert || this.options.ratio.horz != ratio.horz) {
      this.options.ratio = ratio;
      this.create(this._data);
    }
  }
  // 縦横比
  getRatio() {
    return this.options.ratio;

  }

  getDefaultRatio() {
    return this._graphImage.getDrawInfo().getDefaultRatio();

  }

  reset() {
    this.options.ratio = {};
    this.options.scale = 1;
    this.options.minMode = GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_LOW;
    this.create(this._data);
  }
  // スケール取得
  getScale() {
    return this.options.scale;
  }

  // スケール設定
  setScale(scale) {
    this.options.scale = scale;
    this.create(this._data);
  }

  // CSV生成
  getTextData() {
    if (!this._data) return "";


    var fix = function (val) {
      if (!val) return 0;

      return (Math.round(val * 1000000) / 1000000).toFixed(6);
    };
    var result = 'lat,lng,elevation,distance' + "\n";
    for (var i = 0; i < this._data.points.length; i++) {
      var p = this._data.points[i];
      if (p.h || p.h == 0)
        result += fix(p.latlng.lat) + "," + fix(p.latlng.lng) + "," + Math.round(p.h * 100) / 100 + ',' +
          (p.distance || p.distance == 0 ? Math.floor(p.distance) : "")
          + "\n";
    }
    return result;

  }

  // 破棄
  destroy() {

    if (this._canvasFrame)
      this._canvasFrame.remove();
    this.options.ratio = {};

    this._mousePontData = null;
    this._distanceLineDistance = null;
    this._data = null;
    this._canvasFrame = null;
    this._canvas = null;
    this._displayCanvas = null;


  }

  // 断面図が描画されたCanvas取得
  getGraphElement() {
    return this._displayCanvas;
  }

  // 断面図生成
  create(data) {

    this._data = data;
    if (!this._data) return;

    this._graphImage.setData(data, {
      base0: this.options.minMode == GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_0,
      ratio: {
        vert: this.options.ratio.vert,
        horz: this.options.ratio.horz,
        height: this.options.scale
      }
    });

    var ratio = this._graphImage.getDrawInfo().getRatio();

    this.options.ratio.vert = ratio.vert;
    this.options.ratio.horz = ratio.horz;


    if (this._canvas)
      $(this._canvas).remove();
    this._canvas = null;

    if (!this._canvas) {
      this._canvas = this._graphImage.getCanvas();

      if (!this._displayCanvas) {
        this._displayCanvas = document.createElement('canvas');

        $(this._displayCanvas).on("mousemove", MA.bind(this._onCanvasMouseMove, this));
        $(this._displayCanvas).on("mouseout", MA.bind(this._onCanvasMouseOut, this));
      }

    }
    this._displayCanvas.width = this._canvas.width;
    this._displayCanvas.height = this._canvas.height;

    this._backgroundCanvasToFront();

  }

  setDistanceLine(distance) {
    this._distanceLineDistance = distance;
    try {
      //this._backgroundCanvasToFront();

      this._onCanvasMouseMove({
        _distance: distance
      });
    }
    catch (e) {
      console.log(e);
    }
  }

  removeDistanceLine(latlng) {
    this._distanceLineDistance = null;
    try {
      //this._backgroundCanvasToFront();
      this._onCanvasMouseOut();

    }
    catch (e) { }
  }

  // 背景を表示用Canvasに転送
  _backgroundCanvasToFront() {
    if (!this._displayCanvas) return;

    var srcCtx = this._canvas.getContext('2d');
    var destCtx = this._displayCanvas.getContext('2d');

    var image = srcCtx.getImageData(0, 0, this._canvas.width, this._canvas.height);
    destCtx.putImageData(image, 0, 0);

    if (!this._mousePontData) return;
    var area = this._graphImage.getDrawInfo().getGraphArea();

    var x = this._mousePontData.drawPoint.x;

    var ctx = destCtx;
    var strokeColor = "#0000FF";
    var strokeWidth = 1;
    var iTranslate = (strokeWidth % 2) / 2;
    ctx.translate(iTranslate, iTranslate);

    ctx.globalAlpha = 0.8;
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();

    ctx.moveTo(x, this._mousePontData.drawPoint.y);
    ctx.lineTo(x, area.bottom);

    ctx.stroke();
    ctx.translate(-iTranslate, -iTranslate);

    this._drawPopupBaloon(ctx, this._mousePontData);
    return;
    if (this._mousePontData) {

      var p = $.extend(true, {}, this._mousePontData.point);

      var ctx = destCtx;

      ctx.beginPath();
      ctx.fillStyle = "#f4a460";
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2, false);
      ctx.fill();


      p.y -= 5;
      ctx.beginPath();
      var strokeWidth = 1;
      var iTranslate = (strokeWidth % 2) / 4;
      ctx.translate(iTranslate, iTranslate);
      ctx.imageSmoothingEnabled = false;
      ctx.lineCap = "butt";
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = "#333333";
      ctx.fillStyle = "#ffffff";
      ctx.lineWidth = strokeWidth;

      var radius = 6;

      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - 3, p.y - 6);

      ctx.lineTo(p.x - 3 - 30, p.y - 6);
      ctx.lineTo(p.x - 3 - 30, p.y - 6 - 16);
      ctx.lineTo(p.x + 3 + 30, p.y - 6 - 16);
      ctx.lineTo(p.x + 3 + 30, p.y - 6);

      ctx.lineTo(p.x + 3, p.y - 6);
      ctx.lineTo(p.x, p.y);

      ctx.closePath();

      ctx.globalAlpha = 0.5;
      ctx.fill();

      ctx.globalAlpha = 0.8;
      ctx.stroke();


      var h = this._data.points[this._mousePontData.idx].h;
      var info = this._data.points[this._mousePontData.idx].info;

      if (this._graph.max - this._graph.min < 1) {
        h = Math.round(h * 100) / 100;
      } else {
        h = Math.round(h * 10) / 10;
      }

      ctx.globalAlpha = 0.8;
      ctx.textBaseline = "middle";
      ctx.textAlign = 'center';
      ctx.font = 'normal 12px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(h + "m", p.x, p.y - 6 - 8);
      ctx.font = 'normal 10px sans-serif';

      if (p.x < 300) {
        ctx.textAlign = "left";
        ctx.fillText(info.id + "(" + info.zoom + ")", p.x + 10, p.y + 4);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(info.id + "(" + info.zoom + ")", p.x - 10, p.y + 4);
      }




      ctx.translate(-iTranslate, -iTranslate);


    }
  }

  // 標高表示用ポップアップ描画
  _drawPopupBaloon(ctx, p) {

    var h = p.h;
    h = Math.round(h * 100) / 100;
    var info = p.info
    if (!h && h != 0) return;

    ctx.globalAlpha = 0.8;
    ctx.textBaseline = "middle";
    ctx.textAlign = 'center';
    ctx.font = 'normal 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    var text = h + "m";
    var w1 = ctx.measureText(text);

    var text2 = info.id + "(" + info.zoom + ")";
    ctx.font = 'normal 10px sans-serif';

    var w2 = ctx.measureText(text2);

    var width = (w1.width > w2.width ? w1.width : w2.width) + 4;
    var height = 30;

    var rect = {
      left: 0,
      top: 0,
      bottom: 0,
      right: 0
    };

    var drawPoint = {
      x: p.drawPoint.x,
      y: p.drawPoint.y - 5
    };
    rect.left = drawPoint.x - (width / 2);
    rect.right = drawPoint.x + (width / 2);
    rect.top = drawPoint.y - height;
    rect.bottom = drawPoint.y;
    rect.center = rect.left + ((rect.right - rect.left) / 2);
    var strokeWidth = 0;
    ctx.globalAlpha = 0.5;
    var iTranslate = (strokeWidth % 2) / 2;
    ctx.translate(iTranslate, iTranslate);
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = strokeWidth;

    ctx.beginPath();
    ctx.moveTo(rect.left, rect.top);
    ctx.lineTo(rect.left, rect.bottom);

    // △
    ctx.lineTo(rect.center - 3, rect.bottom);
    ctx.lineTo(rect.center, p.drawPoint.y);
    ctx.lineTo(rect.center + 3, rect.bottom);



    ctx.lineTo(rect.right, rect.bottom);
    ctx.lineTo(rect.right, rect.top);
    ctx.lineTo(rect.left, rect.top);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();




    ctx.globalAlpha = 1;
    ctx.font = 'normal 12px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(text, drawPoint.x, drawPoint.y - 20);


    ctx.font = 'normal 10px sans-serif';
    ctx.fillText(text2, drawPoint.x, drawPoint.y - 8);



  }

  // Canvasからマウスが出た
  _onCanvasMouseOut() {
    //if ( this._balloon ) this._balloon.fadeOut(200);
    if (this._mousePontData) {
      this._mousePontData = null;
      this._backgroundCanvasToFront();
      this.fire("mousepointchange", {
        point: null
      });
    }
  }

  // Canvas上をマウスが動いた時標高をポップアップ
  _onCanvasMouseMove(e) {
    if (!this._graphImage) return;
    var data = null;
    if (e._distance) {
      data = this._graphImage.getPointDataByDistance(e._distance);
    } else {
      data = this._graphImage.getPointData(e.offsetX, e.offsetY);
    }

    if (data != this._mousePontData) {
      this._mousePontData = data;
      this._backgroundCanvasToFront();
      if (!e._distance) {
        this.fire("mousepointchange", {
          point: data
        });
      }
    }
  }

};

GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_0 = 0;
GSIBV.UI.Dialog.CrossSectionViewGraph.MINMODE_LOW = 1;
