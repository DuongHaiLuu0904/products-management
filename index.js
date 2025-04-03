const express = require('express')
const path = require('path')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')
const flash = require('express-flash')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const moment = require('moment')

require("dotenv").config()


const database = require('./config/database')
database.connect()

const systemConfig = require('./config/system');


const router = require('./routes/clients/index.route')
const routerAdmin = require('./routes/admin/index.route')

const app = express()
const port = process.env.PORT 

// parse application
app.use(bodyParser.urlencoded({ extended: false }))

app.use(methodOverride('_method'))

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')

// Flash
app.use(cookieParser('IamHaiLuu')); // key ramdom
app.use(session({
    secret: 'IamHaiLuu',       // Chuỗi bí mật để mã hóa session (nên đặt trong biến môi trường)
    resave: false,             // Không lưu session nếu không có thay đổi
    saveUninitialized: false,  // Không lưu session mới nếu chưa có dữ liệu
    cookie: { maxAge: 60000 }  // Thời gian sống của session (60 giây)
}))
app.use(flash());
// End Flash

// TinyMCE
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

app.use(express.static(`${__dirname}/public`))

// app local variables
app.locals.prefixAdmin = systemConfig.prefixAdmin
app.locals.moment = moment

// router
routerAdmin(app)
router(app)

// app.get('*', (req, res) => {
//     res.render('client/pages/error/404', {
//         title: 'Trang chủ'
//     })
// })

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})