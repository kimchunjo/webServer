var express = require('express');
var app = express();

/* body parser */
app.use(express.json());
app.use(express.urlencoded({extended: false}));

/* template engine */
app.set('view engine', 'pug'); /* pug template engine 을 사용 */
app.set('views', './pug'); /* template file 은 pug 라는 폴더 및에 위치 */
app.use(express.static('public'));

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
app.listen(8080);