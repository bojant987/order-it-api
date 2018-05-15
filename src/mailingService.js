const nodemailer = require('nodemailer');

const mailingService = ({to, subject, text, html, res}) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'bojant987@gmail.com',
            pass: 'parlament',
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: 'bojant987@gmail.com',
        to,
        subject,
        text,
        html,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions).then(res => {
            transporter.close();
            resolve(res);
        }).catch(e => {
            transporter.close();
            reject(e);
        })
    });
};

module.exports = { mailingService };
