var map; // 지도
var lat; // 위도
var lon; // 경도
var mapContainer;    // Container
var zoomControl;     // 줌 컨트롤
var imageSrc = 'img/Marker.png'; // 마커 이미지의 이미지 주소
var selectedImagesrc = 'img/selectedMarker.png';
var positions = [];  // 장소
var points = [];
var overlay;
var item = [];
item = document.getElementsByName('item');
var selectedPlaceArray = [];

for(var i = 0; i< item.length; i++){
    selectedPlaceArray.push(
        {
            number: item[i].id,
            longitude: item[i].querySelector('.longitude').value,
            latitude:   item[i].querySelector('.latitude').value,
            itemName:   item[i].querySelector('.itemName').value,
            itemImage:  item[i].querySelector('.itemImage').value,
            itemLocation:  item[i].querySelector('.itemLocation').value
        }
    );
}


var contentArray = ['<div class="wrap">' +
'    <div class="info">' +
'        <div class="title">' +
`            현재 위치` +
'        </div>' +
'        <div class="body">' +
'            <div class="img">' +
'                <img src="uploads/banana.jpg" width="73" height="70">' +
'           </div>' +
'            <div class="desc">' +
'                <div><a href="#" target="_blank" class="link">홈페이지</a></div>' +
'            </div>' +
'        </div>' +
'    </div>' +
'</div>'];

for(var i = 0; i < selectedPlaceArray.length; i++){
    console.log(selectedPlaceArray[i]);
    var content = '<div class="wrap">' +
        '    <div class="info">' +
        '        <div class="title">' +
        `            ${selectedPlaceArray[i].itemName}` +
        '        </div>' +
        '        <div class="body">' +
        '            <div class="img">' +
        `                <img src="${selectedPlaceArray[i].itemImage}" width="73" height="70">` +
        '           </div>' +
        '            <div class="desc">' +
        `                <div class="ellipsis">${selectedPlaceArray[i].itemLocation}</div>` +
        '                <div><a href="#" target="_blank" class="link">홈페이지</a></div>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '</div>';
    contentArray.push(content);
}


selectedMarker = null; // 클릭한 마커를 담을 변수
if (navigator.geolocation) {
// 현재 위치값으로 지도 생성
    navigator.geolocation.getCurrentPosition(
        function (position) {

            lat = position.coords.latitude
            lon = position.coords.longitude
            points.push(new kakao.maps.LatLng(lat, lon));

            mapContainer = document.getElementById('map'), // 지도를 표시할 div
                mapOption = {
                    center: new kakao.maps.LatLng(lat, lon), // 지도의 중심좌표
                    level: 3 // 지도의 확대 레벨
                };

            map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다


            // 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성
            zoomControl = new kakao.maps.ZoomControl();
            map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

            // 현재위치 추가
            var obj = {
                name: '현재위치',
                latlng: new kakao.maps.LatLng(lat, lon)
            }
            positions.push(obj);


            var longitude = [];
            var latitude = [];

            for (var i = 0; i < selectedPlaceArray.length; i++) {
                var obj = {
                    latlng: new kakao.maps.LatLng(selectedPlaceArray[i].latitude, selectedPlaceArray[i].longitude)
                }
                positions.push(obj);
                longitude.push(selectedPlaceArray[i].longitude);
                latitude.push(selectedPlaceArray[i].latitude)
            }
            console.log(longitude);
            console.log(latitude);


            setBounds(map, longitude, latitude);

            positions.forEach(function (element, index) {
                makeMaker(element, imageSrc, contentArray[index], true) // 마커 적용

            });
            var marker;
            var noCurrentPositions = positions.slice(1,);
            noCurrentPositions.forEach(function (element, index){
                item[index].addEventListener("mouseover", function (){
                    // 마커 이미지의 이미지 크기 입니다
                    var imageSize = new kakao.maps.Size(33, 37);

                    // 마커 이미지를 생성합니다
                    var markerImage = new kakao.maps.MarkerImage(selectedImagesrc, imageSize);

                    // 마커를 생성합니다
                    marker = new kakao.maps.Marker({
                        map: map, // 마커를 표시할 지도
                        position: element.latlng, // 마커를 표시할 위치
                        name: element.name, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
                        image: markerImage // 마커 이미지
                    });
                });
                item[index].addEventListener("mouseout", function (){
                    marker.setMap(null);

                });
            });


        }, function (error) {

        }
    )
} else {
    mapContainer = document.getElementById('map'), // 지도를 표시할 div
        mapOption = {
            center: new kakao.maps.LatLng(35.17533583094488, 126.9067985737813), // 지도의 중심좌표
            level: 3 // 지도의 확대 레벨
        };

    map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다


    // 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성
    zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

    var longitude = document.getElementsByName('longitude');
    var latitude = document.getElementsByName('latitude');

    for (var i = 0; i < selectedPlaceArray.length; i++) {
        var obj = {
            latlng: new kakao.maps.LatLng(selectedPlaceArray[i].latitude, selectedPlaceArray[i].longitude)
        }
        positions.push(obj);
    }


    setBounds(map, longitude, latitude);
    makeMaker(positions, imageSrc, false); // 마커 적용
}

// 마커 만들기
function makeMaker(position, imageSrc, content, current) {

    // 마커 이미지의 이미지 크기 입니다
    var imageSize = new kakao.maps.Size(33, 37);

    // 마커 이미지를 생성합니다
    var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

    // 마커를 생성합니다
    var marker = new kakao.maps.Marker({
        map: map, // 마커를 표시할 지도
        position: position.latlng, // 마커를 표시할 위치
        name: position.name, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
        image: markerImage // 마커 이미지
    });

    // 마커를 클릭했을 때 커스텀 오버레이를 표시합니다
    kakao.maps.event.addListener(marker, 'click', function () {
        if (overlay != null) {
            overlay.setMap(null);
            overlay = null;
        } else {
            overlay = new daum.maps.CustomOverlay({
                content: content,
                map: map,
                position: marker.getPosition()
            });

        }
    });


}

function setBounds(map, longitude, latitude) {
    var bounds = new kakao.maps.LatLngBounds();

    for (var i = 0; i < longitude.length; i++) {
        points.push(new kakao.maps.LatLng(latitude[i], longitude[i]));
    }
    var i;
    for (i = 0; i < points.length; i++) {
        // LatLngBounds 객체에 좌표를 추가합니다
        bounds.extend(points[i]);

    }
    // LatLngBounds 객체에 추가된 좌표들을 기준으로 지도의 범위를 재설정합니다
    // 이때 지도의 중심좌표와 레벨이 변경될 수 있습니다
    map.setBounds(bounds);
}

// 커스텀 오버레이를 닫기 위해 호출되는 함수입니다
function closeOverlay(index) {
    console.log("클릭");
    if (overlay[index] != null) {
        overlay[index].setMap(null);
    }
    overlay = new daum.maps.CustomOverlay({
        content: content,
        map: map,
        position: positions[index].latlng
    });
}


