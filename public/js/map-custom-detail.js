var lat; // 위도
var lon; // 경도
var mapContainer;    // Container
var zoomControl;     // 줌 컨트롤
var imageSrc = 'img/Marker.png'; // 마커 이미지의 이미지 주소
var selectedImagesrc = 'img/selectedMarker.png';
var positions = [];  // 장소
var points = [];

if (navigator.geolocation) {
// 현재 위치값으로 지도 생성
    navigator.geolocation.getCurrentPosition(
        function (position) {

            lat = position.coords.latitude
            lon = position.coords.longitude
            //points.push(new kakao.maps.LatLng(lat, lon));
            console.log(lat);
            console.log(lon);

            var mapContainer1 = document.getElementById('map'), // 지도를 표시할 div
                mapOption = {
                    center: new kakao.maps.LatLng(lat, lon), // 지도의 중심좌표
                    level: 3 // 지도의 확대 레벨
                };

            var map = new kakao.maps.Map(mapContainer1, mapOption); // 지도를 생성합니다

            // 마커가 표시될 위치입니다
            var markerPosition = new kakao.maps.LatLng(lat, lon);

            // 마커를 생성합니다
            var marker = new kakao.maps.Marker({
                position: markerPosition
            });

            // 마커가 지도 위에 표시되도록 설정합니다
            marker.setMap(map);


            // 지도 확대 축소를 제어할 수 있는  줌 컨트롤을 생성
            zoomControl = new kakao.maps.ZoomControl();
            map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);



        }, function (error) {

        }
    )
}