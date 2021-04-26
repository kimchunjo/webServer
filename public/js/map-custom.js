var map // 지도
var lat // 위도
var lon // 경도
var mapContainer    // Container
var zoomControl     // 줌 컨트롤
var imageSrc = 'img/marker.svg'; // 마커 이미지의 이미지 주소
var positions = []  // 장소
var jsonUrl     // 장소 데이터

// 현재 위치값으로 지도 생성
navigator.geolocation.getCurrentPosition(
    function(position){

        lat = position.coords.latitude
        lon = position.coords.longitude

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

        jsonUrl = 'js/restaurants-geojson.json';    // 데이터 json 파일


        // 주소-좌표 변환 객체를 생성합니다
        var geocoder = new kakao.maps.services.Geocoder();
        // 주소로 좌표를 검색합니다
        geocoder.addressSearch('제주특별자치도 제주시 첨단로 242', function(result, status) {

            // 정상적으로 검색이 완료됐으면
            if (status === kakao.maps.services.Status.OK) {
                console.log(result[0].y);
                console.log(result[0].x);
            }
        });

        $.getJSON(jsonUrl, function (data) {
            $.each(data, function(key, value){
                console.log("key: " +key+" : value "+ value)
            });
            for(var i = 0; i< data.features.length; i++) {
                var obj = {
                    name: data.features[i].properties.name,
                    latlng: new kakao.maps.LatLng(data.features[i].geometry.coordinates[0], data.features[i].geometry.coordinates[1])
                }
                positions.push(obj);
            }

            makeMaker(map, positions, imageSrc) // 마커 적용
        })


    },function (error){

    }
)

// // 지도 확대, 축소 컨트롤에서 확대 버튼을 누르면 호출되어 지도를 확대하는 함수입니다
// function zoomIn() {
//     map.setLevel(map.getLevel() - 1);
// }
//
// // 지도 확대, 축소 컨트롤에서 축소 버튼을 누르면 호출되어 지도를 확대하는 함수입니다
// function zoomOut() {
//     map.setLevel(map.getLevel() + 1);
// }

// 마커 만들기
function makeMaker(map, positions, imageSrc){

    for (var i = 0; i < positions.length; i ++) {

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



