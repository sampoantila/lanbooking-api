import express from 'express';
import todoService from '../services/todoService.js';

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

router
  .get('/', (req, res) => {
    todoService.getTodos(data => {
      if (hasError(data)) {
        sendFailure(data.error, res, 500);
      } else if (data === null) {
        sendFailure('no data', res);
      } else {
        res.json(data);
      }
    });
  })
  .post('/', (req, res) => {
    todoService.store(req.body, data => {
      if (hasError(data)) {
        sendFailure(data.error, res, 500);
      } else if (data === null) {
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
