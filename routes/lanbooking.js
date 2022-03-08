import express from 'express';
import config from '../config/config';
import service from '../services/bookingService';

var router = express.Router();

function sendFailure(msg, res) {
    res.status(400).send({
        success: 'false',
        message: msg
    });
}

router
    .get('/isbooked/:location', (req, res) => {
        if (req.params.location) {
            service.isBooked(req.params.location, (data) => {
                if (data === null) {
                    sendFailure('error in query', res);
                }
                else {
                    res.json(data);
                }
            });
        }
        else {
            sendFailure('missing location', res);
        }
    })
    .get('/check', (req, res) => {
        if (req.query.email && req.query.code) {
            service.query(req.query.email, req.query.code, (data) => {
                res.json(data);
            });
        }
        else {
            sendFailure('invalid email or code', res);
        }
    })
    .get('/booked', (req, res) => {
        service.allbooked((data) => {
            if (data === null) {
                sendFailure('no data', res);
            }
            else {
                res.json(data);
            }
        });
    })
    .post('/', (req, res) => {
        console.log(req.body);
        if (req.body.email && req.body.code) {
            service.store(req.body.email,
                req.body.code,
                req.body.location,
                (data) => {
                    if (data === null) {
                        sendFailure('access denied', res);
                    }
                    else {
                        console.log(data);
                        res.json({
                            success: 'true',
                            message: 'location stored'
                        });
                    }
                });
        }
        else {
            sendFailure('invalid code', res);
        }
    })
    .put('/invite/:code', (req, res) => {
        if (req.params.code === config.INVITE_SECRET) {
            service.sendEmails((data) => {
                if (data === null) {
                    sendFailure('error in query', res);
                }
                else {
                    res.json(data);
                }
            });
        }
        else {
            sendFailure('unauthorized', res);
        }
    });

export default router;
