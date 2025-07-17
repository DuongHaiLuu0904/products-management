import express from 'express'
import { join } from 'path'
import methodOverride from 'method-override'
import bodyParser from 'body-parser'
import flash from 'express-flash'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import moment from 'moment'
import { createServer } from 'http'
import { Server } from "socket.io"
import cors from 'cors'
import { config } from 'dotenv'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import passport from 'passport';
import './config/passport.js';
const { session: _session } = passport;
import { cleanupExpiredTokens } from './helpers/tokenCleanup.js'

config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import { connect } from './config/database.js'
connect()  

import { prefixAdmin } from './config/system.js'

import router from './routes/clients/index.route.js'
import routerAdmin from './routes/admin/index.route.js'

const app = express()
const port = process.env.PORT 

// parse application
app.use(bodyParser.urlencoded({ extended: false }))

app.use(methodOverride('_method'))

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')

// Socket.io
const server = createServer(app);
const io = new Server(server);
global._io = io;

// Flash
app.use(cookieParser('IamHaiLuu')); 
app.use(session({
    secret: 'IamHaiLuu',      
    resave: false,                   
    saveUninitialized: false,  
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
app.use('/tinymce', express.static(join(__dirname, 'node_modules', 'tinymce')));

app.use(express.static(`${__dirname}/public`))

// app local variables
app.locals.prefixAdmin = prefixAdmin
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
    
    setInterval(async () => {
        try {
            await cleanupExpiredTokens();
        } catch (error) {
            console.error('Token cleanup job failed:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    setTimeout(async () => {
        try {
            await cleanupExpiredTokens();
        } catch (error) {
            console.error('Initial token cleanup failed:', error);
        }
    }, 5000); // Wait 5 seconds after startup
})