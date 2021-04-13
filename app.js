var express = require('express');
var app = express();
const fs = require('fs');
var mysql = require('mysql');
var moment = require('moment');

require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

console.log(moment().format('YYYY-MM-DD HH:mm:ss'));


// 비밀번호는 별도의 파일로 분리해서 버전관리에 포함시키지 않아야 합니다.
var connection = mysql.createConnection({
    host     : 'ghp.cchzr2v2ry4q.ap-northeast-2.rds.amazonaws.com',
    user     : 'admin',
    password : '!eogus123',
    database : 'ghp'
});



/* body parser */
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* template engine */
app.set('view engine', 'pug'); /* pug template engine 을 사용 */
app.set('views', './pug'); /* template file 은 pug 라는 폴더 및에 위치 */
app.use(express.static('public'));

restaurantsJson = JSON.parse(fs.readFileSync('pug/js/restaurants-geojson.json', {
    encoding: 'utf8'
}));
roomsJson = JSON.parse(fs.readFileSync('pug/js/rooms-geojson.json', {
    encoding: 'utf8'
}));
bookingsJson = JSON.parse(fs.readFileSync('pug/js/bookings.json', {
    encoding: 'utf8'
}));


app.get('/', function (req, res) {
    res.render('index', {
        path: '',
    })
});

app.get('/login', function (req, res) {
    res.render('login', {
        path: '',
    })
});

app.get('/signup', function (req, res) {
    res.render('signup', {
    })
});

app.post('/coming-soon', function (req, res) {
    res.render('coming-soon', {
    });

    var body = req.body;
    var id = body.loginUsername;
    var password = body.loginPassword;
    var age = body.loginUserage;
    var sex = body.l5oginUsersex;

    connection.query('INSERT INTO user(id, password, age, sex, created) VALUES("' + id + '","' + password + '","' + age + '","' + sex + '","' + date +'")', function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
    });

});

// 장소 추가
app.get('/user-add-0', function (req, res) {
    res.render('user-add-0')
});
app.get('/user-add-1', function (req, res) {
    res.render('user-add-1')
});
app.get('/user-add-2', function (req, res) {
    res.render('user-add-2')
});
app.get('/user-add-3', function (req, res) {
    res.render('user-add-3')
});
app.get('/user-add-4', function (req, res) {
    res.render('user-add-4')
});
app.get('/user-add-5', function (req, res) {
    res.render('user-add-5')
});



app.get('/detail', function (req, res) {
    res.render('detail',{
        path:'',
    })
});

app.get('/user-account', function (req, res) {
    res.render('user-account',{
        path:'',
    })
});

app.get('/user-profile', function (req ,res) {
    let loginId = req.query.loginUsername;
    let loginPW = req.query.loginPassword;
    res.render('user-profile',{
        path:'',
    })
});


// 검색 결과 페이지
app.get('/category', function (req, res) {
    let searchWord = req.query.search;
    let searchLocation = req.query.location;
    if (searchWord === undefined || searchWord === "") // 검색어를 입력하변지 않은 경우 사용자 취향을 고려한 검색
        searchWord = '내 취향에 맞는 장소'
    if (searchLocation === undefined || searchLocation === "") // 장소를 입력하변지 않은 경우 내 주변으로 검색
        searchLocation = '근처'
    res.render('category-custom', {
        path: '',
        title: '검색결과',
        searchWord: searchWord,
        searchLocation: searchLocation,
    });
});

app.get('/category-map', function (req, res) {
    let searchWord = req.query.search;
    res.render('category-map-custom', {
        path: '',
        title: '지도 검색결과',
        searchWord: searchWord
    });
});



app.listen(8080);