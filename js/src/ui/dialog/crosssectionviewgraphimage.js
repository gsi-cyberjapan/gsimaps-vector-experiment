GSIBV.UI.Dialog.CrossSectionViewGraphImage = class extends MA.Class.Base {



  // 初期化
  constructor() {
    super();
    this.options = {
      base0: true,
      ratio: {
        height: 1
      }
    }
  }


  setData(data, options) {
    if (options) {
      for (var i in options) {
        this.options[i] = options[i];
      }
    }
    this._data = data;
    this.redraw();
  }

  getDrawInfo() {
    return this._drawInfo;
  }

  clear() {

    if (this._canvas) {
      $(this._canvas).remove();
      delete this._canvas;
      this._canvas = undefined;
    }

    this._drawInfo = undefined;
  }

  redraw() {

    this.clear();
    if (!this._data) return;

    this._drawInfo = new GSIBV.UI.Dialog.CrossSectionViewGraphImage.DrawInfo(
      this._data, this.options
    );

    this._canvas = document.createElement('canvas');
    this._canvas.width = this._drawInfo.getCanvasWidth();
    this._canvas.height = this._drawInfo.getCanvasHeight();
    if (this.options.ratio.height <= 0) {

      return;
    }

    this._ctx = this._canvas.getContext("2d");
    this._drawBackground();
    this._drawGraph();
    this._drawBackgroundLine();
    this._drawBackgroundFrame();
    //this._drawBackgroundNumber();
  }


  getPointData(x, y) {
    var graphArea = this._drawInfo.getGraphArea();

    if (graphArea.top > y || graphArea.bottom < y || graphArea.left > x || graphArea.right < x) return null;

    var points = this._data.points;
    var minDistance = 99999999;
    var result = null;
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p.drawPoint) continue;
      var distance = Math.abs(p.drawPoint.x - x);
      if (distance < minDistance) {
        result = p;
        minDistance = distance;
      }
    }
    return result;
  }
  getPointDataByDistance(distance) {

    var points = this._data.points;
    var minDistance = 99999999;
    var result = null;

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p.drawPoint) continue;
      var sa = Math.abs(p.distance - distance);
      if (sa < minDistance) {
        result = p;
        minDistance = sa;
      }
    }
    return result;
  }


  _drawBackground() {
    var width = this._drawInfo.getCanvasWidth();
    var height = this._drawInfo.getCanvasHeight();
    var ctx = this._ctx;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);


  }

  _drawBackgroundFrame() {

    var graphArea = this._drawInfo.getGraphArea();

    var ctx = this._ctx;




    var strokeWidth = 2;
    var iTranslate = (strokeWidth % 2) / 2;
    ctx.translate(iTranslate, iTranslate);
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = strokeWidth;

    if (ctx.setLineDash)
      ctx.setLineDash([]);
    ctx.beginPath();
    ctx.lineTo(graphArea.left, graphArea.top);
    ctx.lineTo(graphArea.left, graphArea.bottom);
    ctx.lineTo(graphArea.right, graphArea.bottom);
    ctx.lineTo(graphArea.right, graphArea.top);
    ctx.lineTo(graphArea.left - 1, graphArea.top);

    ctx.stroke();

  }
  _drawBackgroundLine() {

    var graphArea = this._drawInfo.getGraphArea();

    var ctx = this._ctx;




    var strokeWidth = 1;
    var iTranslate = (strokeWidth % 2) / 2;
    ctx.translate(iTranslate, iTranslate);
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#bbbbbb";
    ctx.lineWidth = strokeWidth;

    if (ctx.setLineDash)
      ctx.setLineDash([]);

    // 横ライン
    var graphMinElevation = this._drawInfo.getGraphMinElevation();
    var graphMaxElevation = this._drawInfo.getGraphMaxElevation();
    var stepElevation = this._drawInfo.getStepElevation();

    var vertMeterPixel = this._drawInfo.getVertMeterPixel();
    var startElevation = Math.ceil(graphMinElevation / stepElevation) * stepElevation;
    var lastY = undefined;

    for (var elevation = startElevation; elevation < graphMaxElevation; elevation += stepElevation) {
      var y = (elevation - graphMinElevation) / vertMeterPixel;

      y = graphArea.bottom - y;

      if (!lastY && graphMinElevation != elevation) {

        lastY = graphArea.bottom;
        // メートル
        ctx.textBaseline = "middle";
        ctx.textAlign = 'right';
        ctx.font = 'normal 11px sans-serif';
        ctx.fillStyle = '#000000';
        ctx.fillText(Math.floor(graphMinElevation), graphArea.left - 3, lastY);
      }

      if (lastY && lastY - y < 10) continue;


      //if ( y > graphArea.top+2 && y < graphArea.bottom - 2 ) {
      {
        ctx.beginPath();
        if (ctx.setLineDash) {
          ctx.setLineDash([2, 2]);
          ctx.moveTo(graphArea.left - 3, y);
          ctx.lineTo(graphArea.right, y);
        } else {
          GSI.Utils.dotLineTo(ctx, graphArea.left - 3, y, graphArea.right, y, [3, 3]);
        }
        ctx.stroke();
        if (ctx.setLineDash)
          ctx.setLineDash([]);

      }

      // メートル
      ctx.textBaseline = "middle";
      ctx.textAlign = 'right';
      ctx.font = 'normal 11px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(elevation, graphArea.left - 3, y);
      lastY = y;

    }
    // 単位
    ctx.textBaseline = "bottom";
    ctx.textAlign = 'left';
    ctx.font = 'normal 11px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText("(m)", graphArea.left - 3, graphArea.top - 5);


    // 縦線
    var horzMeterPixel = this._drawInfo.getHorzMeterPixel();
    var totalDistance = this._data.totalDistance;
    var lastX = undefined;
    var lastLineX = undefined;
    var unit = "(m)";
    var unitCalc = 1;
    if (totalDistance >= 10000) {
      unit = "(km)";
      unitCalc = 1000;
      stepElevation = 1000;
    }

    for (var distance = 0; distance < totalDistance; distance += stepElevation) {
      var x = distance / horzMeterPixel;
      x = graphArea.left + x;

      if (lastLineX && x - lastLineX < 10) continue;

      ctx.beginPath();
      if (ctx.setLineDash) {
        ctx.setLineDash([2, 2]);
        ctx.moveTo(x, graphArea.top);
        ctx.lineTo(x, graphArea.bottom + 3);
      } else {
        GSI.Utils.dotLineTo(ctx, x, graphArea.top, x, graphArea.bottom + 3, [3, 3]);
      }
      ctx.stroke();
      if (ctx.setLineDash)
        ctx.setLineDash([]);
      lastLineX = x;

      if (lastX && x - lastX < 30) continue;
      // メートル
      ctx.textBaseline = "top";
      ctx.textAlign = 'center';
      ctx.font = 'normal 11px sans-serif';
      ctx.fillStyle = '#000000';

      ctx.fillText(Math.floor(distance / unitCalc), x, graphArea.bottom + 3);
      lastX = x;
    }


    // 横単位
    ctx.textBaseline = "bottom";
    ctx.textAlign = 'left';
    ctx.font = 'normal 11px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.fillText(unit, graphArea.right + 2, graphArea.bottom);
  }



  _drawGraph() {
    this._drawGraphFill();
    this._drawGraphLine();
  }

  _drawGraphFill() {

    var graphArea = this._drawInfo.getGraphArea();
    var points = this._data.points;

    var ctx = this._ctx;


    var strokeWidth = 1;
    var iTranslate = (strokeWidth % 2) / 2;
    ctx.translate(iTranslate, iTranslate);
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "butt";
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#f4a460";
    ctx.lineWidth = strokeWidth;

    if (ctx.setLineDash)
      ctx.setLineDash([]);


    ctx.beginPath();

    var start = null;
    var prev = null;
    var last = null;

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p.drawPoint) {

        if (prev) {
          ctx.lineTo(
            prev.drawPoint.x,
            graphArea.bottom);
          ctx.lineTo(
            start.drawPoint.x,
            graphArea.bottom);
          ctx.closePath();
          ctx.fill();
        }
        prev = null;
        start = null;
        continue;
      }
      if (prev) {
        ctx.lineTo(p.drawPoint.x, p.drawPoint.y);

      } else {

        ctx.beginPath();
        ctx.moveTo(p.drawPoint.x, p.drawPoint.y);
        start = p;
      }
      last = p;
      prev = p;
    }

    if (start && prev) {
      ctx.lineTo(
        prev.drawPoint.x,
        graphArea.bottom);
      ctx.lineTo(
        start.drawPoint.x,
        graphArea.bottom);
      ctx.closePath();
      ctx.fill();
    }


  }

  _drawGraphLine() {
    var graphArea = this._drawInfo.getGraphArea();
    var points = this._data.points;

    var ctx = this._ctx;


    var strokeWidth = 1;
    var iTranslate = (strokeWidth % 2) / 2;
    ctx.translate(iTranslate, iTranslate);
    ctx.imageSmoothingEnabled = false;
    ctx.lineCap = "butt";
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = "#f4a460";
    ctx.lineWidth = strokeWidth;


    if (ctx.setLineDash)
      ctx.setLineDash([]);

    ctx.beginPath();

    var prev = null;
    var last = null;

    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (!p.drawPoint) {
        prev = null;
        ctx.stroke();
        continue;
      }
      if (prev) {
        ctx.lineTo(p.drawPoint.x, p.drawPoint.y);

      } else {
        var from = null;
        var to = null;
        if (last) {
          from = last;
          to = p;
        } else if (i > 0) {
          from = {
            drawPoint: {
              x: graphArea.left,
              y: p.drawPoint.y
            }
          };
          to = p;
        }

        if (from) {
          if (ctx.setLineDash) {
            ctx.setLineDash([4, 4]);
            ctx.moveTo(from.drawPoint.x, from.drawPoint.y);
            ctx.lineTo(to.drawPoint.x, to.drawPoint.y);
          } else {
            GSI.Utils.dotLineTo(ctx, from.drawPoint.x, from.drawPoint.y, to.drawPoint.x, to.drawPoint.y, [5, 5]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
        }
        ctx.moveTo(p.drawPoint.x, p.drawPoint.y);

      }
      last = p;
      prev = p;
    }

    ctx.stroke();

    if (!prev) {
      from = last;
      to = {
        drawPoint: {
          x: graphArea.right,
          y: last.drawPoint.y
        }
      };
      if (ctx.setLineDash) {
        ctx.setLineDash([4, 4]);
        ctx.moveTo(from.drawPoint.x, from.drawPoint.y);
        ctx.lineTo(to.drawPoint.x, to.drawPoint.y);
      } else {
        GSI.Utils.dotLineTo(ctx, from.drawPoint.x, from.drawPoint.y, to.drawPoint.x, to.drawPoint.y, [5, 5]);
      }
      ctx.stroke();
    }

  }


  _drawDanmen() {

  }

  getCanvas() {
    return this._canvas;
  }
}

GSIBV.UI.Dialog.CrossSectionViewGraphImage.DrawInfo = class extends MA.Class.Base {

  

  constructor(data, options) {
    super();
    this.options = {
      base0: true,
      ratio: {
        vert: 1,
        horz: 1,
        height: 1
      },
      margin: {
        left: 8,
        top: 20,
        right: 30,
        bottom: 8
      },
      width: 400
    }
    
    if (options) {
      for (var i in options) {
        this.options[i] = options[i];
      }
    }
    this._data = data;
    this._initialize();
  }

  getDefaultRatio() {
    return this._defaultRatio;
  }

  _initialize() {

    var points = this._data.points;
    this._minElevation = undefined;
    this._maxElevation = undefined;
    this._elevationDifference = undefined;

    for (var i = 0; i < points.length; i++) {
      var p = this._data.points[i];
      if (!p.h && p.h != 0) continue;

      if (this._minElevation == undefined || this._minElevation > p.h) {
        this._minElevation = p.h;
      };
      if (this._maxElevation == undefined || this._maxElevation < p.h) {
        this._maxElevation = p.h;
      }
    }

    if (this.options.base0) {
      this._graphMinElevation = 0;
    } else {
      this._graphMinElevation = this._minElevation; // ( this._minElevation >= 0 ? this._minElevation : 0 );
      if (this._graphMinElevation < 0) {
        this._graphMinElevation = Math.floor(this._graphMinElevation);

      } else if (this._graphMinElevation < 100) {
        this._graphMinElevation = Math.floor(this._graphMinElevation / 10) * 10;
      } else if (this._graphMinElevation < 1000) {
        this._graphMinElevation = Math.floor(this._graphMinElevation / 100) * 100;
      } else {
        this._graphMinElevation = Math.floor(this._graphMinElevation / 1000) * 1000;
      }
    }
    this._elevationDifference = this._maxElevation - this._graphMinElevation;

    // 横幅
    this._graphWidth = this.options.width;

    this._leftNumberSize = 35;
    this._canvasWidth =
      this.options.margin.left + // 左余白
      this._leftNumberSize + // 左数字領域
      this._graphWidth +
      this.options.margin.right // 右余白
      ;


    this._horzMeterPixel = this._data.totalDistance / this._graphWidth; // 1ピクセル当たりのメートル


    var getHorzVert = function (graphHeight, elevationDifference, horzMeterPixel) {
      var vertMeterPixel = elevationDifference / (graphHeight - 10);
      var horz = 1;
      var vert = horzMeterPixel / vertMeterPixel;

      horz = Math.round(horz * 10);
      vert = Math.round(vert * 10);

      var tmp;
      var x = horz;
      var y = vert;

      while ((tmp = x % y) != 0) {
        x = y;
        y = tmp;
      }
      horz /= y;
      vert /= y;

      if (horz > 1) {
        vert = Math.round(vert / horz);
        if (vert < 1) vert = 1;

        horz = 1;
      }

      return {
        vertMeterPixel: vert,
        horz: horz,
        vert: vert
      }

    };

    // 縦幅
    this._bottomNumberSize = 20;
    if (!this.options.ratio.horz && this.options.ratio.horz != 0) {
      this._graphHeight = 210;
      //this._vertMeterPixel = this._elevationDifference / (this._graphHeight-10);
      var ret = getHorzVert(210, this._elevationDifference, this._horzMeterPixel);
      this._vertMeterPixel = ret.vertMeterPixel;
      this._graphMaxElevation = this._graphHeight * this._vertMeterPixel + this._graphMinElevation;


      this.options.ratio.horz = ret.horz;
      this.options.ratio.vert = ret.vert;
      this._defaultRatio = {
        horz: ret.horz,
        vert: ret.vert
      };

    } else {
      var ret = getHorzVert(210, this._elevationDifference, this._horzMeterPixel);
      this._defaultRatio = {
        horz: ret.horz,
        vert: ret.vert
      };

    }


    this._vertMeterPixel = this._horzMeterPixel * (
      (this.options.ratio.horz / this.options.ratio.vert) / this.options.ratio.height);


    this._graphHeight = this._elevationDifference / this._vertMeterPixel + 10;
    if (this._graphHeight < 100) {
      this._graphHeight = 100;
    }
    this._graphHeight = Math.floor(this._graphHeight);
    this._graphMaxElevation = this._graphHeight * this._vertMeterPixel + this._graphMinElevation;



    this._canvasHeight =
      this.options.margin.top + // 上余白
      this._graphHeight +
      this._bottomNumberSize +  // 下数字領域
      this.options.margin.bottom// 下余白
      ;

    var bottom = this._canvasHeight - this._bottomNumberSize - this.options.margin.bottom;
    var left = this.options.margin.left + this._leftNumberSize;

    for (var i = 0; i < points.length; i++) {
      var p = this._data.points[i];
      if (!p.h && p.h != 0) continue;

      if (this.options.base0 && p.h < 0) {

        p.drawPoint = {
          x: left + (i * (this._graphWidth / (points.length - 1))),
          y: bottom - ((0 - this._graphMinElevation) / this._vertMeterPixel)
        };
        continue;
      }
      p.drawPoint = {
        x: left + (i * (this._graphWidth / (points.length - 1))),
        y: bottom - ((p.h - this._graphMinElevation) / this._vertMeterPixel)
      };
    }


    var sa = this._graphMaxElevation - this._graphMinElevation;
    this._stepElevation = 10;

    if (sa <= 100) {
      this._stepElevation = 10;
    } else if (sa <= 500) {
      this._stepElevation = 50;
    } else if (sa <= 1000) {
      this._stepElevation = 100;
    } else if (sa <= 2000) {
      this._stepElevation = 200;
    } else {
      this._stepElevation = 500;
    }


  }

  getRatio() {
    return this.options.ratio;
  }

  getStepElevation() {
    return this._stepElevation;
  }

  getGraphMinElevation() {
    return this._graphMinElevation;
  }


  getGraphMaxElevation() {
    return this._graphMaxElevation;
  }


  getHorzMeterPixel() {
    return this._horzMeterPixel;
  }


  getVertMeterPixel() {
    return this._vertMeterPixel;
  }


  getGraphArea() {
    var result = {
      left: this.options.margin.left + this._leftNumberSize,
      top: this.options.margin.top
    };

    result.right = this._canvasWidth - this.options.margin.right;
    result.bottom = this._canvasHeight - this._bottomNumberSize - this.options.margin.bottom;

    result.width = result.right - result.left;
    result.height = result.bottom - result.top;
    return result;
  }

  getCanvasWidth() {
    return this._canvasWidth;
  }


  getCanvasHeight() {
    return this._canvasHeight;
  }
}