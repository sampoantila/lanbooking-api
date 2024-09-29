import express from 'express';
import registrationService from '../services/registrationService.js';
import bookingService from '../services/bookingService.js';

const router = express.Router();

function sendFailure(msg, res) {
  res.status(400).send({
    success: 'false',
    message: msg,
  });
}

router
  .get('/isregistered/:email', (req, res) => {
    if (req.params.email) {
      registrationService.isRegistered(req.params.email, data => {
        if (data === null) {
          sendFailure('error in query', res);
        } else {
          res.json(data);
        }
      });
    } else {
      sendFailure('missing email', res);
    }
  })
  .get('/tournaments', (req, res) => {
    registrationService.tournaments(data => {
      if (data === null) {
        sendFailure('no data', res);
      } else {
        res.json(data);
      }
    });
  })
  .get('/diets', (req, res) => {
    const diets = [
      { id: 1, name: 'Kaikki käy' },
      { id: 2, name: 'Laktoositon' },
      { id: 3, name: 'Gluteeniton' },
      { id: 4, name: 'Kasvis' },
      { id: 5, name: 'Vegaaninen' },
      { id: 6, name: 'Muu, mikä' },
    ];
    res.json(diets);
  })
  .get('/registeredCount', (req, res) => {
    registrationService.count(data => {
      if (data === null) {
        sendFailure('no data', res);
      } else {
        res.json(data);
      }
    });
  })
  .post('/', (req, res) => {
    if (req.body.email) {
      registrationService.isRegistered(req.body.email, isReg => {
        if (isReg.registered === true) {
          sendFailure('already registered', res);
        } else {
          registrationService.register(req.body, data => {
            if (data === null) {
              sendFailure('access denied', res);
            } else {
              // send table booking email
              bookingService.createAccount(req.body.email, createData => {
                if (createData.error != null) {
                  console.error('create account error');
                  console.log(createData.error);
                  sendFailure(createData.error, res);
                } else {
                  res.json({
                    success: 'true',
                    message: 'registration stored',
                  });
                }
              });
            }
          });
        }
      });
    } else {
      sendFailure('invalid registration', res);
    }
  });

export default router;
