require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();

const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');
const {setCORSHeader} = require('./middleware/setCORSHeader');
const {sendError} = require('./util/sendError');
const {mailingService} = require('./mailingService');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(setCORSHeader);

// usermgmt
app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const activationID = uidgen.generateSync();
    const activationLink = `${process.env.CLIENT_URL}activate?activationID=${activationID}`;
    const user = new User({
        ...body,
        activationID,
    });

    const save = user.save();
    const mail = mailingService({
        to: body.email,
        subject: 'Activate order it account',
        html: '<p>To activate your order it account click this <a href="' +
        activationLink +
        '">link</a></p>',
    });

    return Promise.all([save, mail]).then(() => {
        res.sendStatus(200);
    }).catch(e => {
        let error;

        if (e.responseCode === 535) {
            error = {
                developerMessage: e.message,
                message: 'Failed to connect with email service provider',
                status: 500,
            };
        } else {
            error = {
                status: 500,
                developerMessage: e.errmsg,
                message: 'Internal server error',
            }
        }

        User.findOneAndRemove({email: user.email}).catch(e => {});

        sendError(res, error);
    });
});

app.post('/users/activate', (req, res) => {
    const activationID = req.body.activationID;

    User.findOneAndUpdate({activationID}, {activationID: null, active: true}).then(user => {
        if (!user) {
            return res.status(404).send();
        }

        res.status(200).send();
    }).catch(e => {
        sendError(res, {
            status: 400,
        });
    });
});

app.post('/users/forgotpassword', (req, res) => {
    const email = req.body.email;
    const signature = uidgen.generateSync();
    const activationLink = `${process.env.CLIENT_URL}resetpassword?email=${email}&signature=${signature}`;

    const setSignature = User.findOneAndUpdate({ email }, { passwordResetID: signature });

    const emailLink = mailingService({
        to: email,
        subject: 'Reset order it password',
        html: '<p>To reset your order it password click this <a href="' +
        activationLink +
        '">link</a></p>',
        res,
    });

    return Promise.all([setSignature, emailLink]).then(([user]) => {
        if (!user) {
            throw new Error();
        }

        res.sendStatus(200);
    }).catch(e => {
        let error;

        if (e.responseCode === 535) {
            error = {
                developerMessage: e.message,
                message: 'Failed to connect with email service provider',
                status: 500,
            };
        } else {
            error = {
                status: 404,
                message: 'User with that email doesn\'t exist.',
                developerMessage: e.errmsg,
            }
        }

        User.findOneAndUpdate({email}, { passwordResetID: null }, {new: true}).catch(e => {});

        sendError(res, error);
    });
});

app.post('/users/passwordreset', (req, res) => { // tests
    const {password, passwordResetID} = req.body;

    User.findOneAndUpdate({passwordResetID}, {passwordResetID: null, password}, {new: true}).then(user => {
        if (!user) {
            throw new Error();
        }

        res.sendStatus(200);
    }).catch(e => {
        sendError(res, {
            status: 404,
            message: 'No user has requested reset with this signature.',
            developerMessage: e.errmsg
        });
    });
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password).then(user => {
        if (!user.active) {
            return sendError(res, {
                status: 400,
                message: 'Account not yet activated',
            });
        }

        return user.generateAuthToken().then(token => {
            res.status(200).send({token});
        });
    }).catch((e) => {
        sendError(res, {
            status: 401,
            message: 'Wrong username and/or password',
            errorObj: e,
        });
    });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }, () => {
        res.status(400).send();
    });
});

app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

module.exports = {app};
