import express from 'express';
import feedbackService from '../services/feedbackService';

const router = express.Router();

function sendFailure(msg, res) {
  res.status(400).send({
    success: 'false',
    message: msg,
  });
}

router.post('/', (req, res) => {
  feedbackService.store(req.body, data => {
    if (data === null) {
      sendFailure('access denied', res);
    } else {
      res.json({
        success: 'true',
        message: 'registration stored',
      });
    }
  });
});

export default router;
