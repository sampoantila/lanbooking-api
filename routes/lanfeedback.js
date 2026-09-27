import express from 'express';
import feedbackService from '../services/feedbackService.js';

const router = express.Router();

function sendFailure(msg, res, status = 400) {
  res.status(status).send({
    success: 'false',
    message: msg,
  });
}

function hasError(data) {
  return data && typeof data === 'object' && data.error != null;
}

router.post('/', (req, res) => {
  feedbackService.store(req.body, data => {
    if (hasError(data)) {
      sendFailure(data.error, res, 500);
    } else if (data === null) {
      sendFailure('access denied', res);
    } else {
      res.status(201).json({
        success: 'true',
        message: 'registration stored',
      });
    }
  });
});

export default router;
