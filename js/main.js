var sidebar = new ol.control.Sidebar({ element: 'sidebar', position: 'right' });
var jsonFiles, filesLength, fileKey = 0;

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}

var cityList = {};
var filterCity = '', filterTown = '';
var filterExtent = false;
function pointStyleFunction(f) {
  var p = f.getProperties(), color, stroke, radius;
  if (f === currentFeature) {
    stroke = new ol.style.Stroke({
      color: '#0ff',
      width: 5
    });
    radius = 25;
  } else {
    stroke = new ol.style.Stroke({
      color: '#fff',
      width: 2
    });
    radius = 20;
  }
  color = '#31ad31';
  let pointStyle = new ol.style.Style({
    image: new ol.style.RegularShape({
      radius: radius,
      points: 5,
      fill: new ol.style.Fill({
        color: color
      }),
      stroke: stroke
    }),
    text: new ol.style.Text({
      font: '14px "Open Sans", "Arial Unicode MS", "sans-serif"',
      fill: new ol.style.Fill({
        color: '#0521f7'
      })
    })
  });
  pointStyle.getText().setText(p.name);
  return pointStyle;
}
var sidebarTitle = document.getElementById('sidebarTitle');
var content = document.getElementById('sidebarContent');

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.221507, 23.000694]),
  zoom: 14
});

var vectorSource = new ol.source.Vector({
  url: 'https://kiang.github.io/tnma.tainan.gov.tw/points.json',
  format: new ol.format.GeoJSON({
    featureProjection: appView.getProjection()
  })
});

var vectorPoints = new ol.layer.Vector({
  source: vectorSource,
  style: pointStyleFunction
});

var baseLayer = new ol.layer.Tile({
  source: new ol.source.WMTS({
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    url: 'https://wmts.nlsc.gov.tw/wmts',
    layer: 'EMAP',
    tileGrid: new ol.tilegrid.WMTS({
      origin: ol.extent.getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds
    }),
    style: 'default',
    wrapX: true,
    attributions: '<a href="http://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
  }),
  opacity: 0.8
});

var map = new ol.Map({
  layers: [baseLayer, vectorPoints],
  target: 'map',
  view: appView
});

map.addControl(sidebar);
var pointClicked = false;
map.on('singleclick', function (evt) {
  content.innerHTML = '';
  pointClicked = false;
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (false === pointClicked) {
      currentFeature = feature;
      currentFeature.setStyle(pointStyleFunction(currentFeature));
      if (false !== previousFeature) {
        previousFeature.setStyle(pointStyleFunction(previousFeature));
      }
      previousFeature = currentFeature;
      var p = feature.getProperties();
      pointClicked = true;
      $.getJSON('https://kiang.github.io/tnma.tainan.gov.tw/data/' + p.area + '/' + p.name + '.json', function (c) {
        var message = '<table class="table table-dark">';
        message += '<tbody>';
        if (c.img) {
          message += '<tr><td colspan="2"><img src="' + c.img + '" style="height: 200px;" /></td></tr>';
        }
        message += '<tr><th scope="row" style="width: 100px;">名稱</th><td><a href="' + c.url + '" target="_blank">' + c.name + '</a></td></tr>';
        message += '<tr><th scope="row">營業時間</th><td>' + c.time + '</td></tr>';
        message += '<tr><th scope="row">電話</th><td>' + c.phone + '</td></tr>';
        message += '<tr><th scope="row">主要販售</th><td>' + c.scope + c.category + '</td></tr>';
        message += '<tr><th scope="row">地址</th><td>' + c.address + '</td></tr>';
        message += '<tr><th scope="row">故事</th><td>' + c.story + '</td></tr>';
        message += '<tr><th scope="row">成立年代</th><td>' + c.built + '</td></tr>';
        message += '<tr><th scope="row">成立背景</th><td>' + c.background + '</td></tr>';
        message += '<tr><th scope="row">特色</th><td><pre>' + c.feature + '</pre></td></tr>';
        message += '<tr><th scope="row">攤販數</th><td><pre>' + c.count_stores + '</pre></td></tr>';
        message += '<tr><td colspan="2">';
        for(k in c.stores) {
          message += '<a href="' + c.stores[k].url + '" target="_blank" class="btn btn-info" style="margin: 5px;">[' + c.stores[k].no + ']' + c.stores[k].name + '</a>';
        }
        message += '</td></tr>';
        message += '<tr><td colspan="2">';
        message += '<hr /><div class="btn-group-vertical" role="group" style="width: 100%;">';
        message += '<a href="https://www.google.com/maps/dir/?api=1&destination=' + c.latitude + ',' + c.longitude + '&travelmode=driving" target="_blank" class="btn btn-info btn-lg btn-block">Google 導航</a>';
        message += '<a href="https://wego.here.com/directions/drive/mylocation/' + c.latitude + ',' + c.longitude + '" target="_blank" class="btn btn-info btn-lg btn-block">Here WeGo 導航</a>';
        message += '<a href="https://bing.com/maps/default.aspx?rtp=~pos.' + c.latitude + '_' + c.longitude + '" target="_blank" class="btn btn-info btn-lg btn-block">Bing 導航</a>';
        message += '</div></td></tr>';
        message += '</tbody></table>';
        sidebarTitle.innerHTML = c.name;
        content.innerHTML = message;
        sidebar.open('home');
      });
    }
  });
});

var previousFeature = false;
var currentFeature = false;

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function (error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var firstPosDone = false;
geolocation.on('change:position', function () {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
  if (false === firstPosDone) {
    appView.setCenter(coordinates);
    firstPosDone = true;
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

$('#btn-geolocation').click(function () {
  var coordinates = geolocation.getPosition();
  if (coordinates) {
    appView.setCenter(coordinates);
  } else {
    alert('目前使用的設備無法提供地理資訊');
  }
  return false;
});