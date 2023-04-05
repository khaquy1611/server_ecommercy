const nodemailer = require('nodemailer')

const sendEmailActive = async (email, subject, link) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.HOST,
            services: process.env.SERVICES,
            port: 587,
            secure: false,
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASS
            }
        })
        const info = await transporter.sendMail({
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: subject,
            html: `
            <a href=${link}>Click here to activate your account</a>
            `
        })
        console.log('Sent email success');
        return info
    } catch(err) {
        console.log('Sent email error', err);
        return err
    }
}
module.exports = {
    sendEmailActive
}