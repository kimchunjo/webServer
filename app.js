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

/* body parser */
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* template engine */
app.set('view engine', 'pug'); /* pug template engine 을 사용 */
app.set('views', './pug'); /* template file 은 pug 라는 폴더 및에 위치 */
app.use(express.static('public'));

/* connect DB */
var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'ghp.cchzr2v2ry4q.ap-northeast-2.rds.amazonaws.com',
    user     : 'admin',
    password : '!eogus123',
    database : 'ghp',
    multipleStatements: true
});
// 비밀번호는 별도의 파일로 분리해서 버전관리에 포함시키지 않아야 합니다.

/* 무엇을 위한? */
var multer = require('multer');
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, '/uploads/');
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


// example = JSON.parse(fs.readFileSync('pug/js/example.json', {
//     encoding: 'utf8'
// }));

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
    var tag = body.tag;
    tag = tag.trim();
    tag = tag.split(" ");
    var address = body.address + " " +body.detailAddress;
    console.log(address);

    var latitude = body.latitude;
    var longitude = body.longitude;
    console.log(latitude);
    console.log(longitude);

    var query = 'INSERT INTO place(name, explanation, category, usetime_start, usetime_end, door, latitude, longitude) VALUES("' + name + '","' + explanation + '","' + category + '","' + door + '","' + oTime + '","' + cTime + '","' + latitude+ '","' + longitude +'")'
    connection.query(query, function (error, results, fields) {
        if (error) {
            console.log(error);
        }
        console.log(results);
    });

    var query = `INSERT INTO hashtag(name) VALUES (?);`;
   // var query2 = `insert into place_hashtag(fk_place_number, fk_hashtag_number) values ((select place.number from place where place.name = ?), (select hashtag.number from hashtag where hashtag.name = ?));`;
    var getPlaceNumberQuery = `select place.number from place where place.name = ?`;
    var getHashtagNumberQuery = `select hashtag.number from hashtag where hashtag.name = ?`;
    var insertPlaceHashtagQuery = `insert into place_hashtag(fk_place_number, fk_hashtag_number) values (?, ?)`;

    for(var i = 0; i< tag.length; i++){
        let temp = tag[i];
        connection.query(query, temp, function(err1, result1){
            connection.query(getPlaceNumberQuery, name, function (err2, result2){
                console.log(result2[0].number);
                connection.query(getHashtagNumberQuery, temp, function (err3, result3){
                    //console.log(result3);
                    connection.query(insertPlaceHashtagQuery, [result2[0].number, result3[0].number], function(err4, result4){
                        //console.log(result4);

                    });
                });
            });
        });
    }



});

app.get('/logout', function (req, res){
   delete req.session.id1;
   delete req.session.pw1;
   res.redirect('/');
    console.log("로그아웃 성공");
});

app.post('/login-confirm', function (req, res){
    var id = req.body.loginUsername;
    var password = req.body.loginPassword;

    connection.query('SELECT COUNT(*) FROM user WHERE id = ? and password = ?', [id, password], function (error, results, fields) {

            for (var keyNm in results[0]) {
                if(results[0][keyNm] == 1){
                    req.session.id1 = id;
                    req.session.pw1 = password;
                    res.redirect('/');
                    console.log("로그인 성공");
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

    var searchHashtagQuery = `select number from hashtag where hashtag.name = ?`;
   // var searchPlaceNameQuery = `select name from place where place.name = ?`;
    var searchPlaceNumberQuery = `select fk_place_number from place_hashtag where fk_hashtag_number = ?`;
    var searchPlaceNameQuery = "";




    connection.query(searchHashtagQuery, searchWord, function (err1, result1){
           connection.query(searchPlaceNumberQuery, result1[0].number , function (err3, result3){
                for(var i = 0; i< result3.length; i++){
                    searchPlaceNameQuery += `select * from place where number = ${result3[i].fk_place_number};`;
                }
               connection.query(searchPlaceNameQuery, function(err4, result4){
                   var features = [];
                   for(var i = 0; i< result4.length; i++){
                        features.push(result4[i]);
                   }
                   console.log(features);

                   res.render('category-custom', {
                       path: '',
                       title: '검색결과',
                       searchWord: searchWord,
                       searchLocation: searchLocation,
                       example: features
                   });
                    // fs.writeFile('pug/js/example.json', JSON.stringify(features),function(){
                    //     fs.readFile('pug/js/example.json', {encoding: 'utf8'}, function(err, data){
                    //
                    //     });
                    // });
               });
           });
       });

    // connection.query(searchPlaceNameQuery, searchWord, function(err2, result2){
    // });




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