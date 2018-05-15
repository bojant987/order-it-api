const nodemailer = require('nodemailer');

const mailingService = ({to, subject, text, html, res}) => {
    // let transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: {
    //         user: 'bojant987@gmail.com',
    //         pass: 'parlament',
    //     },
    //     tls: {
    //         rejectUnauthorized: false
    //     }
    // });

    let transporter = nodemailer.createTransport({
        host: 'smtp25.elasticemail.com',
        port: 25,
        auth: {
            user: 'bojant987@hotmail.com',
            pass: '9e3126cc-b67f-43f7-a6a5-668ddca6108d',
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
