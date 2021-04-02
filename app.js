var express = require('express');
var app = express();
const fs = require('fs');

/* body parser */
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* template engine */
app.set('view engine', 'pug'); /* pug template engine 을 사용 */
app.set('views', './pug'); /* template file 은 pug 라는 폴더 및에 위치 */
app.use(express.static('public'));

restaurantsJson = JSON.parse(fs.readFileSync('public/js/restaurants-geojson.json', {
    encoding: 'utf8'
}));
roomsJson = JSON.parse(fs.readFileSync('public/js/rooms-geojson.json', {
    encoding: 'utf8'
}));
bookingsJson = JSON.parse(fs.readFileSync('public/js/bookings.json', {
    encoding: 'utf8'
}));


app.get('/', function (req, res) {
    res.render('index',{
        path:'',
    })
});

app.get('/login', function (req, res) {
    res.render('login',{
        path:'',
    })
});

app.get('/signup', function (req, res) {
    res.render('signup',{
        path:'',
    })
});

app.get('/category', function(req, res) {
    res.render('category_custom', {title:'검색결과'});
});

app.get('/category-map', function(req, res) {
    res.render('category-map_custom', {title:'지도 검색결과'});
});

app.get('/index', function(req, res) {
    res.render('index_custom', {title:'메인'});
});

app.listen(8080, function(){
    console.log("실행")
});