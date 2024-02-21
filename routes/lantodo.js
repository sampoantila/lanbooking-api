import express from 'express';
import todoService from '../services/todoService';

const router = express.Router();

function sendFailure(msg, res) {
  res.status(400).send({
    success: 'false',
    message: msg,
  });
}

router.post('/', (req, res) => {
  todoService.store(req.body, data => {
    if (data === null) {
      sendFailure('access denied', res);
    } else {
      res.status(201).json({
        success: 'true',
        message: 'todo stored',
      });
    }
  });
});

export default router;
