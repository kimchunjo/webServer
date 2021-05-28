function getTodayLabel() {
    var week = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
    var today = new Date().getDay();
    var todayLabel = week[today];
    return todayLabel;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

exports.getDistance = function (lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

exports.applySortFilter = function(allPlace, sortBy, lat, lon){
    if (sortBy === "STAR") { // 정렬 기준에 맞게 검색 결과를 정렬한다.
        for (let i = 0; i < allPlace.length; i++) { // 평점 순서로 정렬
            for (let j = i + 1; j < allPlace.length; j++) {
                if (allPlace[i].star < allPlace[j].star) {
                    let temp = allPlace[i];
                    allPlace[i] = allPlace[j];
                    allPlace[j] = temp;
                }
            }
        }
    } else if (sortBy=== 'CLOSESET') {
        for (var i = 0; i < allPlace.length; i++) {
            for (var j = i + 1; j < allPlace.length; j++) {
                if ((((allPlace[i].latitude) - (lat)) * ((allPlace[i].latitude) - (lat))) + (((allPlace[i].longitude) - (lon)) * ((allPlace[i].longitude) - (lon))) > (((allPlace[j].latitude) - (lat)) * ((allPlace[j].latitude) - (lat))) + (((allPlace[j].longitude) - (lon)) * ((allPlace[j].longitude) - (lon)))) {
                    let temp = allPlace[i];
                    allPlace[i] = allPlace[j];
                    allPlace[j] = temp;
                }
            }
        }
    }
    return allPlace;
}

exports.applyTimeFilter= function(allPlace, timeFilter){
    let filterTimeCurrent = timeFilter.current;
    let filterTimeAfternoon = timeFilter.afternoon;
    let filterTimeMorning = timeFilter.morning;
    let filterTimeNight = timeFilter.night;

    for (let i = 0; i < allPlace.length; i++) {
        switch (getTodayLabel()) {
            case 'Sun':
                allPlace[i].time = allPlace[i].sun_open.slice(0, 5) + ' - ' + allPlace[i].sun_close.slice(0, 5);
                break;
            case 'Mon':
                allPlace[i].time = allPlace[i].mon_open.slice(0, 5) + ' - ' + allPlace[i].mon_close.slice(0, 5);
                break;
            case 'Tue':
                allPlace[i].time = allPlace[i].tue_open.slice(0, 5) + ' - ' + allPlace[i].tue_close.slice(0, 5);
                break;
            case 'Wed':
                allPlace[i].time = allPlace[i].wed_open.slice(0, 5) + ' - ' + allPlace[i].wed_close.slice(0, 5);
                break;
            case 'Thu':
                allPlace[i].time = allPlace[i].thu_open.slice(0, 5) + ' - ' + allPlace[i].thu_close.slice(0, 5);
                break;
            case 'Fri':
                allPlace[i].time = allPlace[i].fri_open.slice(0, 5) + ' - ' + allPlace[i].fri_close.slice(0, 5);
                break;
            case 'Sat':
                allPlace[i].time = allPlace[i].sat_open.slice(0, 5) + ' - ' + allPlace[i].sat_close.slice(0, 5);
                break;
        }
    }

    for(let i =0; i< allPlace.length; i++){
        let openTime = parseInt(allPlace[i].time.slice(0, 2));
        let closeTime = parseInt(allPlace[i].time.slice(8, allPlace[i].time.length - 3));
        if(filterTimeCurrent === 'true'){ // 현재 시간이 선택된 경우
            let day = new Date;
            let hours = day.getHours()
            if (openTime > closeTime) { // ex) 10:00 - 03:00 or 18:00 - 01:00
                if(openTime > hours && hours > closeTime){ // 현재 시간 04시에 10:00 - 03:00
                    allPlace.splice(i--, 1);
                    continue
                }
            } else { // ex) 10:00 - 18:00
                if(openTime <= hours && hours <= closeTime){
                    //
                }else{
                    allPlace.splice(i--, 1);
                    continue
                }
            }
        }
        if(filterTimeMorning === 'true'){ // 오전 시간이 선택된 경우
            if(openTime > 12) {
                allPlace.splice(i--, 1);
                continue
            }
        }
        if(filterTimeAfternoon ==='true'){ // 오후 시간이 선택된 경우
            if (openTime > closeTime) { // ex) 10:00 - 03:00
                if (closeTime >= 12) allPlace.splice(i--, 1);
                continue
            } else { // ex) 10:00 - 18:00
                if (closeTime < 12) allPlace.splice(i--, 1); // ex) 10:00 - 18:00
                continue
            }
        }
        if(filterTimeNight === 'true'){ // 저녁 시간이 선택된 경우
            if (openTime > closeTime) {
                // ex) 18:00 - 03:00
            } else { // ex) 12:00 - 18:00
                if(closeTime < 18) allPlace.splice(i--, 1);
            }
        }
    }
    return allPlace;
}
