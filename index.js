const express = require('express')
const path = require('path')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')
const flash = require('express-flash')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const moment = require('moment')
const http = require('http')
const { Server } = require("socket.io");
const cors = require('cors')
const passport = require('./config/passport') // Import passport config
const { cleanupExpiredTokens } = require('./helpers/tokenCleanup')

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

// Socket.io
const server = http.createServer(app);
const io = new Server(server);
global._io = io;


// Flash
app.use(cookieParser('IamHaiLuu')); // key ramdom
app.use(session({
    secret: 'IamHaiLuu',       // Chuỗi bí mật để mã hóa session (nên đặt trong biến môi trường)
    resave: false,             // Không lưu session nếu không có thay đổi
    saveUninitialized: false,  // Không lưu session mới nếu chưa có dữ liệu
    cookie: { maxAge: 24 * 60 * 60 * 1000 }  // Thời gian sống của session (24 giờ)
}))
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
// End Flash

// CORS 
app.use(cors());

// TinyMCE
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));

app.use(express.static(`${__dirname}/public`))

// app local variables
app.locals.prefixAdmin = systemConfig.prefixAdmin
app.locals.moment = moment
app.locals.formatCurrency = function (num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
};


// router
routerAdmin(app)
router(app)

app.get('*', (req, res) => {
    res.render('client/pages/error/404', {
        title: 'Trang lỗi'
    })
})

server.listen(port, () => {
    console.log(`App listening on port ${port}`)
    
    // Start token cleanup job (runs every 24 hours)
    setInterval(async () => {
        try {
            await cleanupExpiredTokens();
        } catch (error) {
            console.error('Token cleanup job failed:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Run cleanup once on startup
    setTimeout(async () => {
        try {
            await cleanupExpiredTokens();
        } catch (error) {
            console.error('Initial token cleanup failed:', error);
        }
    }, 5000); // Wait 5 seconds after startup
})