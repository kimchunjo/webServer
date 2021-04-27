var map; // 지도
var lat; // 위도
var lon; // 경도
var mapContainer;    // Container
var zoomControl;     // 줌 컨트롤
var imageSrc = 'img/marker.svg'; // 마커 이미지의 이미지 주소
var positions = [];  // 장소
var points = [];


if (navigator.geolocation){
// 현재 위치값으로 지도 생성
navigator.geolocation.getCurrentPosition(
    function(position){

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



        var longitude = document.getElementsByName('longitude');
        var latitude = document.getElementsByName('latitude');

        for(var i = 0; i< longitude.length; i++) {
            var obj = {
                latlng: new kakao.maps.LatLng(latitude[i].value, longitude[i].value)
            }
            positions.push(obj);
        }




        setBounds(map, longitude, latitude);
        makeMaker(map, positions, imageSrc, true) // 마커 적용

    },function (error){

    }
)
}else{
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

    for(var i = 0; i< longitude.length; i++) {
        var obj = {
            latlng: new kakao.maps.LatLng(latitude[i].value, longitude[i].value)
        }
        positions.push(obj);
    }


    setBounds(map, longitude, latitude);
    makeMaker(map, positions, imageSrc, false); // 마커 적용
}

// 마커 만들기
function makeMaker(map, positions, imageSrc, current){

    for (var i = points.length - 1; i >= 0 ; i--) {
        console.log(points.length);
        // 마커 이미지의 이미지 크기 입니다
        var imageSize = new kakao.maps.Size(24, 35);

        // 마커 이미지를 생성합니다
        var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize);

        // 마커를 생성합니다
        var marker = new kakao.maps.Marker({
            map: map, // 마커를 표시할 지도
            position: positions[i].latlng, // 마커를 표시할 위치
            name : positions[i].name, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
            image : markerImage // 마커 이미지
        });
    }
}

function setBounds(map, longitude, latitude) {
    var bounds = new kakao.maps.LatLngBounds();

    for(var i = 0; i< longitude.length; i++) {
        points.push(new kakao.maps.LatLng(latitude[i].value, longitude[i].value));
    }
    var i;
    for (i = 0; i < points.length; i++) {
        // LatLngBounds 객체에 좌표를 추가합니다
        bounds.extend(points[i]);
        console.log(points[i]);
    }
    // LatLngBounds 객체에 추가된 좌표들을 기준으로 지도의 범위를 재설정합니다
    // 이때 지도의 중심좌표와 레벨이 변경될 수 있습니다
    map.setBounds(bounds);
}