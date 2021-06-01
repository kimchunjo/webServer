var express = require('express');
var app = express();
const fs = require('fs');
const url = require('url');
let fn = require('./server'); // 서버에서 사용 할 함수들
/* 현재 시간을 얻기 위한 모듈 */
var moment = require('moment');
require('moment-timezone'); // 필요 ?
moment.tz.setDefault("Asia/Seoul");

/* body parser */
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* template engine */
app.set('view engine', 'pug'); /* pug template engine 을 사용 */
app.set('views', './pug'); /* template file 은 pug 라는 폴더 및에 위치 */
app.use(express.static('public'));

// /* 파이썬 연동을 위한 모듈  */
const {PythonShell} = require('python-shell');

/* connect DB */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'ghp.cchzr2v2ry4q.ap-northeast-2.rds.amazonaws.com',
    user: 'admin',
    password: '!eogus123',
    database: 'ghp',
    multipleStatements: true
});
// 비밀번호는 별도의 파일로 분리해서 버전관리에 포함시키지 않아야 합니다.

/* 파일 업로드 모듈 */
var multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, __dirname + '/public/uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, `${file.originalname}`);
        }
    }),
});

/* 로그인 */
var session = require('express-session');
app.use(session({
    secret: '1234DSFs@adf1234!@#asd',
    resave: false,
    saveUninitialized: true
}));

/* 추후 삭제해야 함 */
restaurantsJson = JSON.parse(fs.readFileSync('pug/js/restaurants-geojson.json', {
    encoding: 'utf8'
}));
roomsJson = JSON.parse(fs.readFileSync('pug/js/rooms-geojson.json', {
    encoding: 'utf8'
}));
bookingsJson = JSON.parse(fs.readFileSync('pug/js/bookings.json', {
    encoding: 'utf8'
}));

/* ******** routing ******** */
app.get('/', function (req, res) {
    req.session.valid = true;
    if (req.session.id1) {
        let number = req.session.number;
        let searchUserHistoryQuery = `select * from user where number = ${number}`;
        connection.query(searchUserHistoryQuery, function (err, result) {
            if (result[0].history !== null && (result[0].history).length !== 0 && result[0].history !== undefined) { // 히스토리가 있을 때
                let history = (result[0].history).split("//");
                let latest_history = [];
                if (history.length > 50) { // 최근 몇개의 히스토리를 확인 할 것 인가
                    let count = 0;
                    for (let i = history.length - 1; i >= 0; i--, count++) {
                        if (count > 49) break; // 최근 50개의 장소까지 확인
                        latest_history.push(history[i]);
                    }
                } else if (history.length < 10) { // 의미있는 데이터를 확인할 만큼 히스토리가 누적되지 않을 때
                    for (let i = history.length - 1; i >= 0; i--)
                        latest_history.push(history[i]);
                } else {
                    for (let i = history.length - 1; i >= 0; i--)
                        latest_history.push(history[i]);
                }

                const history_frequency = latest_history.reduce((t, a) => {
                    t[a] = (t[a] || 0) + 1;
                    return t
                }, {});

                const keys = Object.keys(history_frequency);
                let array = [];
                for (let i = 0; i < keys.length; i++) {
                    array.push({
                        'name': keys[i],
                        'count': history_frequency[keys[i]],
                    })
                }

                for (let i = 0; i < array.length; i++) {
                    for (let j = i + 1; j < array.length; j++) {
                        if (array[i].count < array[j].count) {
                            let temp = array[i];
                            array[i] = array[j];
                            array[j] = temp;
                        }
                    }
                }

                let tempQuery = ``;
                let count = 0;
                for (let i = 0; i < array.length; i++, count++) {
                    if (count >= 3) break;
                    tempQuery += `select * from place where name = '${array[i].name}';`;
                }
                connection.query(tempQuery, function (err, assPlaces) {
                    let data = [];
                    let options;
                    if (assPlaces.length >= 3) {
                        for (let i = 0; i < assPlaces.length; i++) data.push({name: assPlaces[i][0].name})
                        options = {
                            mode: 'json', // json or text
                            pythonOptions: ['-u'], // get print results in real-time
                            scriptPath: '', //If you are having python_test.py script in same folder, then it's optional.
                            encoding: 'utf8',
                            args: [JSON.stringify(data[0]), JSON.stringify(data[1]), JSON.stringify(data[2])], //[`${result[0].name}`], //An argument which can be accessed in the script using sys.argv[1]
                        };
                    } else if (assPlaces.length === 2) {
                        for (let i = 0; i < assPlaces.length; i++) data.push({name: assPlaces[i][0].name})
                        options = {
                            mode: 'json', // json or text
                            pythonOptions: ['-u'], // get print results in real-time
                            scriptPath: '', //If you are having python_test.py script in same folder, then it's optional.
                            encoding: 'utf8',
                            args: [JSON.stringify(data[0]), JSON.stringify(data[1])], //[`${result[0].name}`], //An argument which can be accessed in the script using sys.argv[1]
                        };
                    } else {
                        data.push({name: assPlaces[0].name})
                        options = {
                            mode: 'json', // json or text
                            pythonOptions: ['-u'], // get print results in real-time
                            scriptPath: '', //If you are having python_test.py script in same folder, then it's optional.
                            encoding: 'utf8',
                            args: [JSON.stringify(data[0])], //[`${result[0].name}`], //An argument which can be accessed in the script using sys.argv[1]
                        };
                    }

                    PythonShell.run('user_history.py', options, function (err, ap) {
                        let associatedPlace = ap[0];
                        let assPlaceList = [];
                        if (associatedPlace == "not in vocabulary") { // 연관 장소가 없는 경우
                            res.render('index', {
                                loggedUser: true,
                            })
                        } else { // 연관 장소가 있는 경우
                            let searchAssPlaceQuery = '';
                            for (let i = 0; i < associatedPlace.length; i++)
                                if (associatedPlace[i][1] > -2)
                                    associatedPlace[i] = associatedPlace[i][0]
                                else
                                    associatedPlace.splice(i, i + 1);

                            for (let i = 0; i < associatedPlace.length; i++)
                                searchAssPlaceQuery += `select * from place where name = '${associatedPlace[i]}';`
                            connection.query(searchAssPlaceQuery, function (err, assPlace) {
                                assPlaceList = [];

                                for (let i = 0; i < assPlace.length; i++)
                                    if (assPlace[i].length !== 0) assPlaceList.push(assPlace[i][0])

                                if (assPlaceList.length !== 0) {
                                    for (let i = 0; i < assPlaceList.length; i++)
                                        assPlaceList[i].image = ((assPlaceList[i].image).split("@#"))[1];
                                }

                                res.render('index', {
                                    loggedUser: true,
                                    assPlace: assPlaceList
                                })
                            })
                        }
                    });
                })
            } else { // 유저 히스토리가 존재하지 않을 때 -> 로그인 안한 것과 같은 액션이 이뤄져야 한다.
                var query = `select * from place ORDER BY viewed DESC limit 10;`
                connection.query(query, function(err, allPlace){
                    for (let i = 0; i < allPlace.length; i++) {
                        switch (fn.getToday()) {
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
                    if (allPlace.length !== 0) {
                        for (let i = 0; i < allPlace.length; i++)
                            allPlace[i].image = ((allPlace[i].image).split("@#"))[1];
                    }
                    res.render('index', {
                        loggedUser: false,
                        assPlace: allPlace
                    });
                });

            }
        });
    } else { // 비로그인
        var query = `select * from place ORDER BY viewed DESC limit 10;`
        connection.query(query, function(err, allPlace){
            for (let i = 0; i < allPlace.length; i++) {
                switch (fn.getToday()) {
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
            if (allPlace.length !== 0) {
                for (let i = 0; i < allPlace.length; i++)
                    allPlace[i].image = ((allPlace[i].image).split("@#"))[1];
            }
            res.render('index', {
                loggedUser: false,
                assPlace: allPlace
            });
        });

    }
});

app.get('/login', function (req, res) {
    res.render('login', {
        valid: req.session.valid
    })
});

app.get('/signup', function (req, res) {
    res.render('signup', {})
});

app.post('/upload', upload.single('file'), (req, res) => {
    console.log("업로드성공");
    res.end();
});

app.post('/coming-soon', function (req, res) {
    let body = req.body;
    let id = body.loginUsername;
    let password = body.loginPassword;
    let age = body.loginUserage;
    let sex = body.loginUsersex;
    let now = moment().format('YYYY-MM-DD HH:mm:ss')
    connection.query('INSERT INTO user(id, password, age, sex, created) VALUES("' + id + '","' + password + '","' + age + '","' + sex + '","' + now + '")', function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
    });

    res.render('coming-soon', {});
});


/* 장소 추가 라우팅 */
app.get('/user-add-0', function (req, res) {
    // 장소 추가 시작
    res.render('user-add-0')
});

app.get('/user-add-1', function (req, res) {
    // 장소 이름, 위치, 시간
    res.render('user-add-1')
});

app.post('/user-add-2', function (req, res) {
    // 장소 설명
    let body = req.body;
    let placeInfo = {
        name: body.form_name,
        category: body.category,
        door: body.door,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address + " " + body.detailAddress,
        openTime: [body.openMon, body.openTue, body.openWed, body.openThu, body.openFri, body.openSat, body.openSun],
        closeTime: [body.closeMon, body.closeTue, body.closeWed, body.closeThu, body.closeFri, body.closeSat, body.closeSun],
    }
    res.render('user-add-2', {
        placeInfo: placeInfo
    })
});

app.post('/user-add-3', function (req, res) {
    // 장소 오픈 시간 및 연락처
    let body = req.body;
    let placeInfo = {
        // 이전 페이지에서 얻은 정보
        name: body.name,
        category: body.category,
        door: body.door,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
        openTime: body.openTime,
        closeTime: body.closeTime,
        explanation: body.explanation,
        tag: body.tag,
        filename: body.filename,
    }

    res.render('user-add-3', {
        placeInfo: placeInfo
    });
})

app.post('/user-add-4', function (req, res) {
    // 장소 사진
    let body = req.body;
    let placeInfo = {
        // 이전 페이지에서 얻은 정보
        name: body.name,
        category: body.category,
        door: body.door,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
        openTime: body.openTime,
        closeTime: body.closeTime,
        explanation: body.explanation,
        tag: body.tag,
        // 새롭게 추가된 정보
        filename: body.filename,
        phoneNumber: body.phone_number,
        email: body.email,
        page: body.page,
        facebook: body.facebook_page,
        instagram: body.instagram_page
    }
    res.render('user-add-4', {
        placeInfo: placeInfo
    })
});

app.get('/user-add-5', function (req, res) {
    res.render('user-add-5');
});

app.post('/user-add', function (req, res) {
    var body = req.body;
    var name = body.name;
    var category = body.category;
    var door = body.door;
    var explanation = body.explanation;
    // openTime 출력 형식 -> 02:00,02:00,05:00,05:00,05:00,02:00,02:00 월 ~ 일 순서
    // closeTime 출력 형식 -> 13:59,13:59,23:05,23:05,23:05,13:59,13:59
    var openTime = body.openTime;
    var closeTime = body.closeTime;
    openTime = openTime.split(',');
    closeTime = closeTime.split(',');
    var tag = body.tag;
    tag = tag.trim();
    tag = tag.split(" ");
    var address = body.address;
    var filename = body.filename;
    var latitude = body.latitude;
    var longitude = body.longitude;
    var phoneNumber = body.phoneNumber;
    var email = body.email;
    var page = body.page;
    var facebook = body.facebook;
    var instagram = body.instagram;

    var query = `INSERT INTO place(name, explanation, category, phoneNumber, door, latitude, longitude, image, location, email, page, facebookID, instagramID, mon_open, tue_open, wed_open, thu_open, fri_open, sat_open, sun_open, mon_close, tue_close, wed_close, thu_close, fri_close, sat_close, sun_close) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(query, [name, explanation, category, phoneNumber, door, latitude, longitude, filename, address, email, page, facebook, instagram, openTime[0], openTime[1], openTime[2], openTime[3], openTime[4], openTime[5], openTime[6], closeTime[0], closeTime[1], closeTime[2], closeTime[3], closeTime[4], closeTime[5], closeTime[6]], function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
    });

    var query = `INSERT INTO hashtag(name) VALUES (?);`;
    var getPlaceNumberQuery = `select place.number from place where place.name = ? and place.location = ? and place.category = ?`;
    var getHashtagNumberQuery = `select hashtag.number from hashtag where hashtag.name = ?`;
    var insertPlaceHashtagQuery = `insert into place_hashtag(fk_place_number, fk_hashtag_number, hashtag_point) values (?, ?, 3)`;

    for (var i = 0; i < tag.length; i++) {
        let temp = tag[i];
        connection.query(query, temp, function (err1, result1) {
            connection.query(getPlaceNumberQuery, [name, address, category], function (err2, result2) {
                connection.query(getHashtagNumberQuery, temp, function (err3, result3) {
                    connection.query(insertPlaceHashtagQuery, [result2[0].number, result3[0].number], function (err4, result4) {
                    });
                });
            });
        });
    }
});

/* 로그인 로그아웃 */
app.get('/logout', function (req, res) {
    delete req.session.id1;
    delete req.session.pw1;
    res.redirect('/');
    console.log("로그아웃 성공");
});

app.post('/login-confirm', function (req, res) {
    var id = req.body.loginUsername;
    var password = req.body.loginPassword;
    // login 페이지와 detail 페이지에서 로그인 서비스를 제공한다.
    // 이때 login 페이지에서 로그인을 하면 목적지가 / 이고 detail 페이지에서 로그인을 했을 때 로그인 성공 목적지는 detail 페이지가 되는게 이상적이기 때문에
    // query 로 목적지를 받는다.
    var loginDestination = req.body.loginDestination;
    connection.query('SELECT COUNT(*) FROM user WHERE id = ? and password = ?', [id, password], function (error, results, fields) {
            connection.query('SELECT number FROM user WHERE id = ? and password =?', [id, password], function (error1, number, fields1) {
                for (var keyNm in results[0]) {
                    if (results[0][keyNm] == 1) {
                        req.session.id1 = id;
                        req.session.pw1 = password;
                        req.session.number = number[0].number;
                        res.redirect(loginDestination);
                    } else {
                        req.session.valid = false;
                        res.redirect(url.format({
                            pathname: '/login',
                            valid: req.session.valid
                        }));
                    }
                }
                if (error) {
                    console.log(error);
                }
            })
        }
    )
});

app.get('/user-account', function (req, res) {
    res.render('user-account', {
        path: '',
    })
});

app.get('/user-profile', function (req, res) {
    res.render('user-profile', {
        path: '',
    })
});

app.get('/category', function (req, res) {
    /* url query */
    let searchWord = req.query.search;
    let searchLocation = req.query.location;
    let lat = req.query.lat;
    let lon = req.query.lon;
    let pagination = req.query.pagination;
    let sortCategory = req.query.sort; // sortBy
    let filterCategory = req.query.filterCategory; // filter
    let filterDistance = req.query.filterDistance;
    let filterKeyword = req.query.filterKeyword;
    let filterTimeCurrent = req.query.filterTimeCurrent;
    let filterTimeMorning = req.query.filterTimeMorning;
    let filterTimeAfternoon = req.query.filterTimeAfternoon;
    let filterTimeNight = req.query.filterTimeNight;
    if (searchWord === undefined || searchWord === "") // 검색어를 입력하변지 않은 경우 사용자 취향을 고려한 검색
        searchWord = '내 취향에 맞는 장소'
    if (searchLocation === undefined || searchLocation === "") // 장소를 입력하변지 않은 경우 내 주변으로 검색
        searchLocation = '내 주변'
    if (sortCategory === undefined || sortCategory === "") // 기본 검색은 평점 순서
        sortCategory = 'STAR'
    if (pagination === undefined) pagination = 0;
    else pagination = parseInt(pagination);

    if (!filterKeyword)
        filterKeyword = undefined;
    if (filterKeyword == "null" || filterKeyword == "undefined")
        filterKeyword = undefined;

    if (filterTimeCurrent === undefined) filterTimeCurrent = false;
    if (filterTimeMorning === undefined) filterTimeMorning = false;
    if (filterTimeAfternoon === undefined) filterTimeAfternoon = false;
    if (filterTimeNight === undefined) filterTimeNight = false;
    let timeFilter = {
        current: filterTimeCurrent,
        morning: filterTimeMorning,
        afternoon: filterTimeAfternoon,
        night: filterTimeNight
    }
    if (filterDistance === undefined) filterDistance = 3;

    /* DB query */
    var searchHashtagQuery = `select number from hashtag where hashtag.name = '${searchWord}'`; // searchWord 와 일치하는 해쉬 태그 id 를 찾는 쿼리
    var searchPlaceNumberQuery = `select fk_place_number from place_hashtag where fk_hashtag_number = ? and hashtag_point >= 3`;
    var searchPlaceQuery = ""; // placeNumber 과 일치하는 place를 찾는 쿼리
    var searchPlaceNameQuery = `select * from place where name LIKE '%${searchWord}%'` // searchWord 와 placeName 이 일치하는 장소를 찾는 쿼리

    /* ******** 1. searchWord 가 placeName 에 포함된 장소를 찾는다. ******* */
    connection.query(searchPlaceNameQuery, function (err, placeName) {
        if (placeName.length !== 0) { // searchWord 가 placeName 에 포함된 장소가 있을 때 ex) searchWord 가 스타벅스 일 때, 전남대학교 스타벅스
            let placeList = [];
            for (let i = 0; i < placeName.length; i++)
                placeList.push(placeName[i]); // placeList 배열에 해당 장소를 push 한다.
            /* ******** 2. hashTag 를 이용한 검색 ******* */
            connection.query(searchHashtagQuery, function (err, hashTag) {
                if (hashTag.length !== 0) { // searchWord 와 일치하는 해시태그 값을 갖는 장소가 있을 때
                    connection.query(searchPlaceNumberQuery, hashTag[0].number, function (err, placeNumber) { // hashTag Number 을 이용해 해당 해쉬 태그를 가지고 있는 장소의 place id(number)을 가져온다.
                            for (var i = 0; i < placeNumber.length; i++)
                                searchPlaceQuery += `select * from place where name NOT LIKE '%${searchWord}%' and number = ${placeNumber[i].fk_place_number};`;
                            if (placeNumber.length !== 0) {
                                /* ******** 3. placeName 과 hashTag 모두에 대한 결과가 있는 경우 ******* */
                                connection.query(searchPlaceQuery, function (err, places) {
                                    let allPlace = []; // searchWord 에 해당하는 모든 장소를 allPlace 배열에 넣는다.
                                    /* 거리 계산 및 장소 넣기 */
                                    if (places.length === 1) { // 해당 hashTag 를 갖는 장소가 1개인 경우
                                        for (let i = places.length - 1; i >= 0; i--) {
                                            if (fn.getDistance(lat, lon, places[i].latitude, places[i].longitude) < filterDistance) {
                                                places[i].image = ((places[i].image).split("@#"))[1];
                                                allPlace.push(places[i]);
                                            }
                                        }
                                    } else { // 해당 hashTag 를 갖는 장소가 여러개인 경우
                                        for (let i = 0; i < places.length; i++) {
                                            if (places[i][0] !== undefined && fn.getDistance(lat, lon, places[i][0].latitude, places[i][0].longitude) < filterDistance) {
                                                places[i][0].image = ((places[i][0].image).split("@#"))[1];
                                                allPlace.push(places[i][0]);
                                            }
                                        }
                                    }

                                    /* sortBy */
                                    allPlace = fn.applySortFilter(allPlace, sortCategory, lat, lon);
                                    /* time */
                                    allPlace = fn.applyTimeFilter(allPlace, timeFilter);
                                    /* keyword */
                                    if (filterKeyword !== undefined && filterKeyword !== null) {
                                        for (let i = 0; i < allPlace.length; i++) {
                                            if ((allPlace[i].explanation).indexOf(filterKeyword) === -1) {
                                                allPlace.splice(i--, 1);
                                            }
                                        }
                                    }


                                    /* 결과를 각 페이지에 분리 */
                                    let totalPlaceCount = allPlace.length
                                    allPlace = allPlace.slice(12 * pagination, 12 * (pagination + 1)); // 각 페이지에 12개의 장소를 노출한다.
                                    if (req.session.id1) {
                                        res.render('category-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: totalPlaceCount,
                                            pagination: pagination,
                                            loggedUser: true,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    } else {
                                        res.render('category-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: totalPlaceCount,
                                            pagination: pagination,
                                            loggedUser: false,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    }
                                });
                            } else {
                                // 해쉬 태그는 존재하지만 해당 해쉬 태그를 갖는 장소가 존재하지 않는 경우
                                res.redirect('/');
                            }
                        }
                    );
                } else {
                    let allPlace = []; // 장소를 넣을 배열
                    /* 거리 계산 및 장소 넣기 */
                    for (let i = 0; i < placeList.length; i++) {
                        if (fn.getDistance(lat, lon, placeList[i].latitude, placeList[i].longitude) < filterDistance) {
                            placeList[i].image = ((placeList[i].image).split("@#"))[1]; // 대표 이미지 설정
                            allPlace.push(placeList[i]);
                        }
                    }
                    /* sortBy */
                    allPlace = fn.applySortFilter(allPlace, sortCategory, lat, lon);
                    /* time */
                    allPlace = fn.applyTimeFilter(allPlace, timeFilter);
                    /* keyword */
                    if (filterKeyword !== undefined && filterKeyword !== null) {
                        for (let i = 0; i < allPlace.length; i++) {
                            if ((allPlace[i].explanation).indexOf(filterKeyword) === -1) {
                                allPlace.splice(i--, 1);
                            }
                        }
                    }
                    /* 결과를 각 페이지에 분리*/
                    let totalPlaceCount = allPlace.length;
                    allPlace = allPlace.slice(12 * pagination, 12 * (pagination + 1));
                    if (req.session.id1) {
                        res.render('category-custom', {
                            path: '',
                            title: '검색결과',
                            searchWord: searchWord,
                            searchLocation: searchLocation,
                            allPlace: allPlace, // 검색 된 모든 장소
                            placeCount: totalPlaceCount, // 검색 된 장소의 개수
                            pagination: pagination,
                            loggedUser: true,
                            sortCategory: sortCategory,
                            lat: lat,
                            lon: lon,
                            filterTimeCurrent: filterTimeCurrent,
                            filterTimeMorning: filterTimeMorning,
                            filterTimeAfternoon: filterTimeAfternoon,
                            filterTimeNight: filterTimeNight,
                            filterDistance: filterDistance,
                            filterKeyword: filterKeyword,
                            filterCategory: filterCategory
                        });
                    } else {
                        res.render('category-custom', {
                                path: '',
                                title: '검색결과',
                                searchWord: searchWord,
                                searchLocation: searchLocation,
                                allPlace: allPlace,
                                placeCount: totalPlaceCount,
                                pagination: pagination,
                                loggedUser: false,
                                sortCategory: sortCategory,
                                lat: lat,
                                lon: lon,
                                filterTimeCurrent: filterTimeCurrent,
                                filterTimeMorning: filterTimeMorning,
                                filterTimeAfternoon: filterTimeAfternoon,
                                filterTimeNight: filterTimeNight,
                                filterDistance: filterDistance,
                                filterKeyword: filterKeyword,
                                filterCategory: filterCategory
                            }
                        );
                    }
                }
            })
        } else { // searchWord 가 placeName 에 포함된 장소가 없을 때
            /* ******** 2. hashTag 를 이용한 검색 ******* */
            connection.query(searchHashtagQuery, function (err, hashTag) {
                if (hashTag.length !== 0) { // searchWord 와 일치하는 해시태그 값을 갖는 장소가 있을 때
                    connection.query(searchPlaceNumberQuery, hashTag[0].number, function (err, placeNumber) { // hashTag Number 을 이용해 해당 해쉬 태그를 가지고 있는 장소의 place id(number)을 가져온다.
                            for (var i = 0; i < placeNumber.length; i++)
                                searchPlaceQuery += `select * from place where name NOT LIKE '%${searchWord}%' and number = ${placeNumber[i].fk_place_number};`;
                            if (placeNumber.length !== 0) {
                                /* ******** 3. placeName 과 hashTag 모두에 대한 결과가 있는 경우 ******* */
                                connection.query(searchPlaceQuery, function (err, places) {
                                    let allPlace = []; // searchWord 에 해당하는 모든 장소를 allPlace 배열에 넣는다.
                                    /* 거리 계산 및 장소 넣기 */
                                    if (places.length === 1) { // 해당 hashTag 를 갖는 장소가 1개인 경우
                                        for (let i = places.length - 1; i >= 0; i--) {
                                            if (fn.getDistance(lat, lon, places[i].latitude, places[i].longitude) < filterDistance) {
                                                places[i].image = ((places[i].image).split("@#"))[1];
                                                allPlace.push(places[i]);
                                            }
                                        }
                                    } else { // 해당 hashTag 를 갖는 장소가 여러개인 경우
                                        for (let i = 0; i < places.length; i++) {
                                            if (places[i][0] !== undefined && fn.getDistance(lat, lon, places[i][0].latitude, places[i][0].longitude) < filterDistance) {
                                                places[i][0].image = ((places[i][0].image).split("@#"))[1];
                                                allPlace.push(places[i][0]);
                                            }
                                        }
                                    }

                                    /* sortBy */
                                    allPlace = fn.applySortFilter(allPlace, sortCategory, lat, lon);
                                    /* time */
                                    allPlace = fn.applyTimeFilter(allPlace, timeFilter);
                                    /* keyword */
                                    if (filterKeyword !== undefined && filterKeyword !== null) {
                                        for (let i = 0; i < allPlace.length; i++) {
                                            if ((allPlace[i].explanation).indexOf(filterKeyword) === -1) {
                                                allPlace.splice(i--, 1);
                                            }
                                        }
                                    }


                                    /* 결과를 각 페이지에 분리 */
                                    let totalPlaceCount = allPlace.length
                                    allPlace = allPlace.slice(12 * pagination, 12 * (pagination + 1)); // 각 페이지에 12개의 장소를 노출한다.
                                    if (req.session.id1) {
                                        res.render('category-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: totalPlaceCount,
                                            pagination: pagination,
                                            loggedUser: true,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    } else {
                                        res.render('category-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: totalPlaceCount,
                                            pagination: pagination,
                                            loggedUser: false,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    }
                                });
                            } else {
                                // 해쉬 태그는 존재하지만 해당 해쉬 태그를 갖는 장소가 존재하지 않는 경우
                                res.redirect('/');
                            }
                        }
                    );
                } else {
                    let allPlace = []; // 장소를 넣을 배열
                    /* sortBy */
                    allPlace = fn.applySortFilter(allPlace, sortCategory, lat, lon);
                    /* time */
                    allPlace = fn.applyTimeFilter(allPlace, timeFilter);
                    /* keyword */
                    if (filterKeyword !== undefined && filterKeyword !== null) {
                        for (let i = 0; i < allPlace.length; i++) {
                            if ((allPlace[i].explanation).indexOf(filterKeyword) === -1) {
                                allPlace.splice(i--, 1);
                            }
                        }
                    }
                    /* 결과를 각 페이지에 분리*/
                    let totalPlaceCount = allPlace.length;
                    allPlace = allPlace.slice(12 * pagination, 12 * (pagination + 1));
                    if (req.session.id1) {
                        res.render('category-custom', {
                            path: '',
                            title: '검색결과',
                            searchWord: searchWord,
                            searchLocation: searchLocation,
                            allPlace: allPlace, // 검색 된 모든 장소
                            placeCount: totalPlaceCount, // 검색 된 장소의 개수
                            pagination: pagination,
                            loggedUser: true,
                            sortCategory: sortCategory,
                            lat: lat,
                            lon: lon,
                            filterTimeCurrent: filterTimeCurrent,
                            filterTimeMorning: filterTimeMorning,
                            filterTimeAfternoon: filterTimeAfternoon,
                            filterTimeNight: filterTimeNight,
                            filterDistance: filterDistance,
                            filterKeyword: filterKeyword,
                            filterCategory: filterCategory
                        });
                    } else {
                        res.render('category-custom', {
                                path: '',
                                title: '검색결과',
                                searchWord: searchWord,
                                searchLocation: searchLocation,
                                allPlace: allPlace,
                                placeCount: totalPlaceCount,
                                pagination: pagination,
                                loggedUser: false,
                                sortCategory: sortCategory,
                                lat: lat,
                                lon: lon,
                                filterTimeCurrent: filterTimeCurrent,
                                filterTimeMorning: filterTimeMorning,
                                filterTimeAfternoon: filterTimeAfternoon,
                                filterTimeNight: filterTimeNight,
                                filterDistance: filterDistance,
                                filterKeyword: filterKeyword,
                                filterCategory: filterCategory
                            }
                        );
                    }
                }
            })
        }
    });
});

app.get('/category-map', function (req, res) {
    /* url query */
    let searchWord = req.query.search;
    let searchLocation = req.query.location;
    let lat = req.query.lat;
    let lon = req.query.lon;
    let pagination = req.query.pagination;
    let sortCategory = req.query.sort; // sortBy
    let filterCategory = req.query.filterCategory; // filter
    let filterDistance = req.query.filterDistance;
    let filterKeyword = req.query.filterKeyword;
    let filterTimeCurrent = req.query.filterTimeCurrent;
    let filterTimeMorning = req.query.filterTimeMorning;
    let filterTimeAfternoon = req.query.filterTimeAfternoon;
    let filterTimeNight = req.query.filterTimeNight;
    if (searchWord === undefined || searchWord === "") // 검색어를 입력하변지 않은 경우 사용자 취향을 고려한 검색
        searchWord = '내 취향에 맞는 장소'
    if (searchLocation === undefined || searchLocation === "") // 장소를 입력하변지 않은 경우 내 주변으로 검색
        searchLocation = '내 주변'
    if (sortCategory === undefined || sortCategory === "" || sortCategory === 'undefined') // 기본 검색은 평점 순서
        sortCategory = 'STAR'
    if (pagination === undefined) pagination = 0;
    else pagination = parseInt(pagination);

    if (!filterKeyword)
        filterKeyword = undefined;
    if (filterKeyword == "null" || filterKeyword == "undefined")
        filterKeyword = undefined;

    if (filterTimeCurrent === undefined) filterTimeCurrent = false;
    if (filterTimeMorning === undefined) filterTimeMorning = false;
    if (filterTimeAfternoon === undefined) filterTimeAfternoon = false;
    if (filterTimeNight === undefined) filterTimeNight = false;
    let timeFilter = {
        current: filterTimeCurrent,
        morning: filterTimeMorning,
        afternoon: filterTimeAfternoon,
        night: filterTimeNight
    }
    if (filterDistance === undefined) filterDistance = 3;

    /* DB query */
    var searchHashtagQuery = `select number from hashtag where hashtag.name = '${searchWord}'`; // searchWord 와 일치하는 해쉬 태그 id 를 찾는 쿼리
    var searchPlaceNumberQuery = `select fk_place_number from place_hashtag where fk_hashtag_number = ? and hashtag_point >= 3`;
    var searchPlaceQuery = ""; // placeNumber 과 일치하는 place를 찾는 쿼리
    var searchPlaceNameQuery = `select * from place where name LIKE '%${searchWord}%'` // searchWord 와 placeName 이 일치하는 장소를 찾는 쿼리

    /* ******** 1. searchWord 가 placeName 에 포함된 장소를 찾는다. ******* */
    connection.query(searchPlaceNameQuery, function (err, placeName) {
        if (placeName.length !== 0) { // searchWord 가 placeName 에 포함된 장소가 있을 때 ex) searchWord 가 스타벅스 일 때, 전남대학교 스타벅스
            let placeList = [];
            for (let i = 0; i < placeName.length; i++)
                placeList.push(placeName[i]); // placeList 배열에 해당 장소를 push 한다.
            /* ******** 2. hashTag 를 이용한 검색 ******* */
            connection.query(searchHashtagQuery, function (err, hashTag) {
                if (hashTag.length !== 0) { // searchWord 와 일치하는 해시태그 값을 갖는 장소가 있을 때
                    connection.query(searchPlaceNumberQuery, hashTag[0].number, function (err, placeNumber) { // hashTag Number 을 이용해 해당 해쉬 태그를 가지고 있는 장소의 place id(number)을 가져온다.
                            for (var i = 0; i < placeNumber.length; i++)
                                searchPlaceQuery += `select * from place where name NOT LIKE '%${searchWord}%' and number = ${placeNumber[i].fk_place_number};`;
                            if (placeNumber.length !== 0) {
                                /* ******** 3. placeName 과 hashTag 모두에 대한 결과가 있는 경우 ******* */
                                connection.query(searchPlaceQuery, function (err, places) {
                                    let allPlace = []; // searchWord 에 해당하는 모든 장소를 allPlace 배열에 넣는다.
                                    /* 거리 계산 및 장소 넣기 */
                                    if (places.length === 1) { // 해당 hashTag 를 갖는 장소가 1개인 경우
                                        for (let i = places.length - 1; i >= 0; i--) {
                                            if (fn.getDistance(lat, lon, places[i].latitude, places[i].longitude) < filterDistance) {
                                                places[i].image = ((places[i].image).split("@#"))[1];
                                                allPlace.push(places[i]);
                                            }
                                        }
                                    } else { // 해당 hashTag 를 갖는 장소가 여러개인 경우
                                        for (let i = 0; i < places.length; i++) {
                                            if (places[i][0] !== undefined && fn.getDistance(lat, lon, places[i][0].latitude, places[i][0].longitude) < filterDistance) {
                                                places[i][0].image = ((places[i][0].image).split("@#"))[1];
                                                allPlace.push(places[i][0]);
                                            }
                                        }
                                    }

                                    for (let i = 0; i < placeList.length; i++) { // allPlace 에 1 번 단계에서 얻은 결과를 넣는다.
                                        if (fn.getDistance(lat, lon, placeList[i].latitude, placeList[i].longitude) < filterDistance) {
                                            placeList[i].image = ((placeList[i].image).split("@#"))[1];
                                            allPlace.push(placeList[i]);
                                        }
                                    }

                                    /* sortBy */
                                    allPlace = fn.applySortFilter(allPlace, sortCategory, lat, lon);
                                    /* time */
                                    allPlace = fn.applyTimeFilter(allPlace, timeFilter);
                                    /* keyword */
                                    if (filterKeyword !== undefined && filterKeyword !== null) {
                                        for (let i = 0; i < allPlace.length; i++) {
                                            if ((allPlace[i].explanation).indexOf(filterKeyword) === -1) {
                                                allPlace.splice(i--, 1);
                                            }
                                        }
                                    }


                                    /* 결과를 각 페이지에 분리 */
                                    let totalPlaceCount = allPlace.length
                                    allPlace = allPlace.slice(12 * pagination, 12 * (pagination + 1)); // 각 페이지에 12개의 장소를 노출한다.
                                    if (req.session.id1) {
                                        res.render('category-map-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: totalPlaceCount,
                                            pagination: pagination,
                                            loggedUser: true,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    } else {
                                        res.render('category-map-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: totalPlaceCount,
                                            pagination: pagination,
                                            loggedUser: false,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    }
                                });
                            } else {
                                // 해쉬 태그는 존재하지만 해당 해쉬 태그를 갖는 장소가 존재하지 않는 경우
                                res.redirect('/');
                            }
                        }
                    );
                } else {
                    let allPlace = []; // 장소를 넣을 배열
                    /* 거리 계산 및 장소 넣기 */
                    for (let i = 0; i < placeList.length; i++) {
                        if (fn.getDistance(lat, lon, placeList[i].latitude, placeList[i].longitude) < filterDistance) {
                            placeList[i].image = ((placeList[i].image).split("@#"))[1]; // 대표 이미지 설정
                            allPlace.push(placeList[i]);
                        }
                    }
                    /* sortBy */
                    allPlace = fn.applySortFilter(allPlace, sortCategory, lat, lon);
                    /* time */
                    allPlace = fn.applyTimeFilter(allPlace, timeFilter);
                    /* keyword */
                    if (filterKeyword !== undefined && filterKeyword !== null) {
                        for (let i = 0; i < allPlace.length; i++) {
                            if ((allPlace[i].explanation).indexOf(filterKeyword) === -1) {
                                allPlace.splice(i--, 1);
                            }
                        }
                    }
                    /* 결과를 각 페이지에 분리*/
                    let totalPlaceCount = allPlace.length;
                    allPlace = allPlace.slice(12 * pagination, 12 * (pagination + 1));
                    if (req.session.id1) {
                        res.render('category-custom', {
                            path: '',
                            title: '검색결과',
                            searchWord: searchWord,
                            searchLocation: searchLocation,
                            allPlace: allPlace, // 검색 된 모든 장소
                            placeCount: totalPlaceCount, // 검색 된 장소의 개수
                            pagination: pagination,
                            loggedUser: true,
                            sortCategory: sortCategory,
                            lat: lat,
                            lon: lon,
                            filterTimeCurrent: filterTimeCurrent,
                            filterTimeMorning: filterTimeMorning,
                            filterTimeAfternoon: filterTimeAfternoon,
                            filterTimeNight: filterTimeNight,
                            filterDistance: filterDistance,
                            filterKeyword: filterKeyword,
                            filterCategory: filterCategory
                        });
                    } else {
                        res.render('category-map-custom', {
                                path: '',
                                title: '검색결과',
                                searchWord: searchWord,
                                searchLocation: searchLocation,
                                allPlace: allPlace,
                                placeCount: totalPlaceCount,
                                pagination: pagination,
                                loggedUser: false,
                                sortCategory: sortCategory,
                                lat: lat,
                                lon: lon,
                                filterTimeCurrent: filterTimeCurrent,
                                filterTimeMorning: filterTimeMorning,
                                filterTimeAfternoon: filterTimeAfternoon,
                                filterTimeNight: filterTimeNight,
                                filterDistance: filterDistance,
                                filterKeyword: filterKeyword,
                                filterCategory: filterCategory
                            }
                        );
                    }
                }
            })
        } else { // searchWord 가 placeName 에 포함된 장소가 없을 때
            /* ******** 2. hashTag 를 이용한 검색 ******* */
            connection.query(searchHashtagQuery, searchWord, function (err, hashTag) {
                if (hashTag.length !== 0) { // searchWord 와 일치하는 해시태그 값을 갖는 장소가 있을 때
                    connection.query(searchPlaceNumberQuery, hashTag[0].number, function (err1, placeNumber) { // hashTag Number 을 이용해 해당 해쉬 태그를 가지고 있는 장소의 place id(number)을 가져온다.
                            for (var i = 0; i < placeNumber.length; i++)
                                searchPlaceQuery += `select * from place where number = ${placeNumber[i].fk_place_number};`;
                            if (placeNumber.length !== 0) {
                                connection.query(searchPlaceQuery, function (err2, places) {
                                    var allPlace = []; // searchWord 에 해당하는 모든 장소를 allPlace 배열에 넣고 결과를 노출한다.
                                    /* 거리 계산 및 장소 넣기 */
                                    if (places.length === 1) {
                                        for (var i = places.length - 1; i >= 0; i--) {
                                            if (fn.getDistance(lat, lon, places[i].latitude, places[i].longitude) < filterDistance) {
                                                places[i].image = ((places[i].image).split("@#"))[1];
                                                allPlace.push(places[i]);
                                            }
                                        }
                                    } else {
                                        for (var i = 0; i < places.length; i++) {
                                            if (fn.getDistance(lat, lon, places[i].latitude, places[i].longitude) < filterDistance) {
                                                places[i][0].image = ((places[i][0].image).split("@#"))[1];
                                                allPlace.push(places[i][0]);
                                            }
                                        }
                                    }
                                    /* sortBy */
                                    allPlace = fn.applySortFilter(allPlace, sortCategory, lat, lon);
                                    /* time */
                                    allPlace = fn.applyTimeFilter(allPlace, timeFilter);
                                    /* keyword */
                                    if (filterKeyword !== undefined && filterKeyword !== null) {
                                        for (let i = 0; i < allPlace.length; i++) {
                                            if ((allPlace[i].explanation).indexOf(filterKeyword) === -1) {
                                                allPlace.splice(i--, 1);
                                            }
                                        }
                                    }
                                    /* 결과를 각 페이지에 분리 */
                                    let totalPlaceCount = allPlace.length;
                                    allPlace = allPlace.slice(12 * pagination, 12 * (pagination + 1));
                                    if (req.session.id1) {
                                        res.render('category-map-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: totalPlaceCount,
                                            pagination: pagination,
                                            loggedUser: true,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    } else {
                                        res.render('category-map-custom', {
                                            path: '',
                                            title: '검색결과',
                                            searchWord: searchWord,
                                            searchLocation: searchLocation,
                                            allPlace: allPlace,
                                            placeCount: allPlace.length,
                                            pagination: pagination,
                                            loggedUser: false,
                                            sortCategory: sortCategory,
                                            lat: lat,
                                            lon: lon,
                                            filterTimeCurrent: filterTimeCurrent,
                                            filterTimeMorning: filterTimeMorning,
                                            filterTimeAfternoon: filterTimeAfternoon,
                                            filterTimeNight: filterTimeNight,
                                            filterDistance: filterDistance,
                                            filterKeyword: filterKeyword,
                                            filterCategory: filterCategory
                                        });
                                    }
                                });
                            } else {
                                res.redirect('/');
                            }
                        }
                    );
                } else { // placeName, hashTag 모두 검색 결과가 없는 경우이다.
                    if (req.session.id1) {
                        res.render('category-map-custom', {
                            path: '',
                            title: '검색결과',
                            searchWord: searchWord,
                            searchLocation: searchLocation,
                            allPlace: null,
                            placeCount: 0,
                            pagination: pagination,
                            loggedUser: true,
                            sortCategory: sortCategory,
                            lat: lat,
                            lon: lon,
                            filterTimeCurrent: filterTimeCurrent,
                            filterTimeMorning: filterTimeMorning,
                            filterTimeAfternoon: filterTimeAfternoon,
                            filterTimeNight: filterTimeNight,
                            filterDistance: filterDistance,
                            filterKeyword: filterKeyword,
                            filterCategory: filterCategory
                        });
                    } else {
                        res.render('category-map-custom', {
                            path: '',
                            title: '검색결과',
                            searchWord: searchWord,
                            searchLocation: searchLocation,
                            allPlace: null,
                            placeCount: 0,
                            pagination: pagination,
                            loggedUser: false,
                            sortCategory: sortCategory,
                            lat: lat,
                            lon: lon,
                            filterTimeCurrent: filterTimeCurrent,
                            filterTimeMorning: filterTimeMorning,
                            filterTimeAfternoon: filterTimeAfternoon,
                            filterTimeNight: filterTimeNight,
                            filterDistance: filterDistance,
                            filterKeyword: filterKeyword,
                            filterCategory: filterCategory

                        });
                    }
                }
            });
        }
    });
});


/* detail */
app.get('/detail', function (req, res) {
    let placeId = req.query.placeId;
    /* DB 조회를 위한 쿼리 */
    var searchPlace = `select * from place where place.number = ?;`;
    var searchReview = `select * from review where review.fk_place_number = ?`
    var searchHashtagNumber = `select * from place_hashtag where fk_place_number = ? and hashtag_point >= 3`
    var searchHashtag = "";
    var historyAddQuery = `UPDATE user SET history = CONCAT ( CONCAT (history, "//"), ?) WHERE user.id = ? and history is not null;`;
    var historyAddNullQuery = `UPDATE user SET history = ? WHERE user.id = ? and history is null;`;
    var increViewdQuery = `UPDATE place SET viewed = viewed + 1 where place.number = ?`;
    var searchAssPlaceQuery = '';

    connection.query(increViewdQuery, placeId, function(){
    });

    connection.query(searchPlace, placeId, function (err, result) {
        // 이미지
        let mainImage = ((result[0].image).split("@#"))[1]; // main 에 보여질 이미지를 선택한다.
        let temp = (result[0].image).split("@#");
        result[0].image = [];
        for (let i = 0; i < temp.length; i++) {
            if (temp[i] !== "" && temp[i] !== undefined) {
                result[0].image.push(temp[i]);
            }
        }

        // 오픈, 마감 시간
        result[0].oc = [];
        result[0].oc.push((result[0].sun_open).slice(0, 5)); // 일
        result[0].oc.push(result[0].sun_close.slice(0, 5));
        result[0].oc.push(result[0].mon_open.slice(0, 5)); // 월
        result[0].oc.push(result[0].mon_close.slice(0, 5));
        result[0].oc.push(result[0].tue_open.slice(0, 5)); // 화
        result[0].oc.push(result[0].tue_close.slice(0, 5));
        result[0].oc.push(result[0].wed_open.slice(0, 5)); // 수
        result[0].oc.push(result[0].wed_close.slice(0, 5));
        result[0].oc.push(result[0].thu_open.slice(0, 5)); // 목
        result[0].oc.push(result[0].thu_close.slice(0, 5));
        result[0].oc.push(result[0].fri_open.slice(0, 5)); // 금
        result[0].oc.push(result[0].fri_close.slice(0, 5));
        result[0].oc.push(result[0].sat_open.slice(0, 5)); // 토
        result[0].oc.push(result[0].sat_close.slice(0, 5));

        connection.query(searchHashtagNumber, placeId, function (err, hashtagNumberResult) {
            for (var i = 0; i < hashtagNumberResult.length; i++)
                searchHashtag += `select name from hashtag where number = ${hashtagNumberResult[i].fk_hashtag_number};`;
            connection.query(searchHashtag, function (err, hashtagResult) {
                var hashtagNames = [];
                var count = hashtagResult.length
                if (count == 1)
                    hashtagNames.push(hashtagResult[0].name);
                else {
                    for (var i = 0; i < count; i++)
                        hashtagNames.push(hashtagResult[i][0].name);
                }
                connection.query(searchReview, placeId, function (err, reviews) {
                    // 평점 및 날짜
                    if (!reviews) {
                        result[0].star = 0; // 리뷰가 없을 때
                        result[0].review_count = 0;
                    } else {
                        let sum = 0;
                        for (let i = 0; i < reviews.length; i++) {
                            sum += reviews[i].starpoint;
                            let timeSource = reviews[i].datetime;
                            let dateObj = new Date(timeSource);
                            let timeString_KR = dateObj.toLocaleString("ko-KR", {timeZone: "Asia/Seoul"});
                            timeString_KR = timeString_KR.substr(0, timeString_KR.length - 3);
                            timeString_KR = timeString_KR.substr(2, timeString_KR.length)
                            reviews[i].datetime = timeString_KR;
                        }
                        sum /= reviews.length;
                        result[0].star = sum;
                        result[0].review_count = reviews.length;
                    }
                    if (result[0].star > 5) result[0].star = 5;
                    else if (result[0].star < 0) result[0].star = 0;
                    result[0].star = Math.round(result[0].star);

                    // 연관 장소
                    let data = {
                        name: result[0].name
                    }

                    let options = {
                        mode: 'json', // json or text
                        pythonOptions: ['-u'], // get print results in real-time
                        scriptPath: '', //If you are having python_test.py script in same folder, then it's optional.
                        encoding: 'utf8',
                        args: [JSON.stringify(data)], //[`${result[0].name}`], //An argument which can be accessed in the script using sys.argv[1]
                    };

                    PythonShell.run('user_history.py', options, function (err, ap) {
                        let associatedPlace = ap[0];
                        let assPlaceList = [];

                        if (associatedPlace == "not in vocabulary") { // 연관 장소가 없는 경우
                            if (req.session.id1) {
                                res.render('detail', {
                                    mainImage: mainImage,
                                    placeInfo: result[0],
                                    userInfo: req.session.id1,
                                    reviews: reviews,
                                    loggedUser: true,
                                    hashtagNames: hashtagNames,
                                });
                                connection.query(historyAddQuery, [result[0].name, req.session.id1], function (err, hashTag) {
                                });
                                connection.query(historyAddNullQuery, [result[0].name, req.session.id1], function (err, hashTag) {
                                });
                            } else {
                                res.render('detail', {
                                    mainImage: mainImage,
                                    placeInfo: result[0],
                                    reviews: reviews,
                                    loggedUser: false,
                                    hashtagNames: hashtagNames,
                                });
                            }
                        } else { // 연관 장소가 있는 경우
                            for (let i = 0; i < associatedPlace.length; i++)
                                if (associatedPlace[i][1] > -2)
                                    associatedPlace[i] = associatedPlace[i][0]
                                else
                                    associatedPlace.splice(i, i + 1);

                            for (let i = 0; i < associatedPlace.length; i++)
                                searchAssPlaceQuery += `select * from place where name = '${associatedPlace[i]}';`

                            connection.query(searchAssPlaceQuery, function (err, assPlace) {
                                assPlaceList = [];

                                for (let i = 0; i < assPlace.length; i++)
                                    if (assPlace[i].length !== 0) assPlaceList.push(assPlace[i][0])

                                if (assPlaceList.length !== 0) {
                                    for (let i = 0; i < assPlaceList.length; i++)
                                        assPlaceList[i].image = ((assPlaceList[i].image).split("@#"))[1];
                                }

                                if (req.session.id1) {
                                    res.render('detail', {
                                        mainImage: mainImage,
                                        placeInfo: result[0],
                                        userInfo: req.session.id1,
                                        reviews: reviews,
                                        loggedUser: true,
                                        hashtagNames: hashtagNames,
                                        assPlace: assPlaceList,
                                    });
                                    connection.query(historyAddQuery, [result[0].name, req.session.id1], function (err, hashTag) {
                                    });
                                    connection.query(historyAddNullQuery, [result[0].name, req.session.id1], function (err, hashTag) {
                                    });
                                } else {
                                    res.render('detail', {
                                        mainImage: mainImage,
                                        placeInfo: result[0],
                                        reviews: reviews,
                                        loggedUser: false,
                                        hashtagNames: hashtagNames,
                                        assPlace: assPlaceList,
                                    });
                                }
                            })
                        }
                    });
                })
            })
        })
    })
})

app.post('/review', function (req, response) {
    let placeNumber = req.body.placeNumber;
    let userNumber = req.session.number;
    let rating = req.body.rating;
    let writer = req.body.writer;
    let review = req.body.review;
    let tag = req.body.tag;
    tag = tag.trim();
    tag = tag.split(" ");
    let today = new Date();
    let month = today.getMonth() + 1
    let date = today.getFullYear() + "-" + month + "-" + today.getDate() + " " + today.getHours() + ":" + today.getMinutes();

    var insertHashtagQuery = ""; // hash tag 테이블에 리뷰에서 얻은 새로운 해쉬 태그를 넣는 쿼리.
    var insertPlaceHashtagQuery = ""; // place hash tag 테이블에 새로운 리뷰와 장소를 연결시키는 쿼리.
    let writeReviewQuery = `INSERT INTO review (user_id,datetime, starpoint , contents, fk_user_number, fk_place_number) VALUES('${writer}', '${date}', '${rating}', '${review}', '${userNumber}', '${placeNumber}');`;
    let updateStarQuery = `select * from review where fk_place_number = ${placeNumber}`;
    for (var i = 0; i < tag.length; i++) {
        if (tag[i] != "") {
            insertHashtagQuery += `insert into hashtag(name) values ("${tag[i]}");`;
            insertPlaceHashtagQuery += `insert into place_hashtag(fk_place_number, fk_hashtag_number, hashtag_point) values (${placeNumber}, (select number from hashtag where name = "${tag[i]}"), 1) on duplicate key update hashtag_point = hashtag_point + 1;`;
        }
    }

    connection.query(insertHashtagQuery, function (err, res) {
        connection.query(insertPlaceHashtagQuery, function (err, res) {
            connection.query(writeReviewQuery, function (err, res) {
                connection.query(updateStarQuery, function (err, result) {
                    let review_count = result.length;
                    let sum = 0;
                    for (let i = 0; i < review_count; i++)
                        sum += result[i].starpoint;
                    sum /= review_count;
                    updateStarQuery = `update place set star = ${sum} where number = ${placeNumber}`;
                    connection.query(updateStarQuery, function (err, res) {
                        response.send({result: true});
                    })
                })
            });
        });
    });
})


app.listen(8080);
