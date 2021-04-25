var express = require('express');
var app = express();
const fs = require('fs');

/* 파이썬 연동을 위한 모듈  */
const spawn = require("child_process").spawn;
const pythonProcess = spawn('python',['./user_history.py', '카페아바나']);
pythonProcess.stdout.on('data',(data)=>{
    console.log(data.toString())
})
pythonProcess.stderr.on('data', (data)=>{
    console.log(data.toString());
});

/* 현재 시간을 얻기 위한 모듈 */
var moment = require('moment');
require('moment-timezone'); // 필요 ?
moment.tz.setDefault("Asia/Seoul");

/* connect DB */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'ghp.cchzr2v2ry4q.ap-northeast-2.rds.amazonaws.com',
    user     : 'admin',
    password : '!eogus123',
    database : 'ghp'
});
// 비밀번호는 별도의 파일로 분리해서 버전관리에 포함시키지 않아야 합니다.

/* 무엇을 위한? */
var multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/');
        },
        filename: function (req, file, cb) {
            cb(null, `${Date.now()}_${file.originalname}`);
        }
    }),
});


var session = require('express-session');

app.use(session({
    secret: '1234DSFs@adf1234!@#asd',
    resave: false,
    saveUninitialized: true
}));


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

/* routing */
app.get('/', function (req, res) {
    if(req.session.id1){
        res.render('index', {
            loggedUser: true
        })
    }
    else{
        res.render('index', {
            loggedUser: false
        })
    }


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
    let body = req.body;
    let id = body.loginUsername;
    let password = body.loginPassword;
    let age = body.loginUserage;
    let sex = body.loginUsersex;
    let now = moment().format('YYYY-MM-DD HH:mm:ss')
    connection.query('INSERT INTO user(id, password, age, sex, created) VALUES("' + id + '","' + password + '","' + age + '","' + sex + '","' + now +'")', function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
    });

    res.render('coming-soon', {
    });
});

//place = JSON.stringify(place)
//fs.writeFileSync("pug/js/place.json", place, 'utf-8')

let place = {
    "name": "",
    "location": "",
    "explanation": "",
    "price": 0,
    "categorie": "",
    "hotplacescore": 0,
    "usetime_start": "",
    "usetime_end": ""
};
// 장소 추가
app.get('/user-add-0', function (req, res) {
    res.render('user-add-0')
});
app.get('/user-add-1', function (req, res) {
    res.render('user-add-1')
});
app.post('/user-add-5', function (req, res) {
    res.render('user-add-5')
    var body = req.body;
    var name = body.form_name;
    var category = body.type;
    var door = body.door;
    var explanation = body.explanation;
    var oTime = body.oTime;
    var cTime = body.cTime;

    connection.query('INSERT INTO place(name, explanation, category, usetime_start, usetime_end, door) VALUES("' + name + '","' + explanation + '","' + category + '","' + door + '","' + oTime + '","' + cTime +'")', function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
    });


});


app.post('/login-confirm', function (req, res){
    var id = req.body.loginUsername;
    var password = req.body.loginPassword;
    console.log(id);
    console.log(password);
    connection.query('SELECT COUNT(*) FROM user WHERE id = ? and password = ?', [id, password], function (error, results, fields) {

            for (var keyNm in results[0]) {
                if(results[0][keyNm] == 1){
                    console.log("로그인 성공");
                    req.session.id1 = id;
                    req.session.pw1 = password;
                    res.redirect('/');
                }


                else{
                    console.log("로그인 실패");
                }

            }
            if (error) {
                console.log(error);
            }
        }
    )
});




app.post('/upload', upload.single('file'), (req, res) => {
    console.log(req.file);
    connection.query('INSERT INTO image(filename, originalname) VALUES("' + req.file.filename + '","' + req.file.originalname +'")', function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
    });


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