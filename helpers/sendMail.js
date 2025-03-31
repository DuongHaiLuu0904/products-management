const nodeMailer = require('nodemailer')

module.exports.sendMail = async (email, subject, html) => {
    const transporter = nodeMailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: html
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    })
}