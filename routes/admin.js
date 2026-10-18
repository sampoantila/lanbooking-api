import express from 'express';
import adminService from '../services/adminService.js';
import config from '../config/config.js';

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

function requireAdminCode(req, res, next) {
  const code = req.params.code;
  if (!code || code !== config.ADMIN_SECRET) {
    sendFailure('unauthorized', res, 401);
    return;
  }
  next();
}

router.get('/:code', requireAdminCode, (req, res) => {
  adminService.getRegistrationsWithLocation(data => {
    if (hasError(data)) {
      sendFailure(data.error, res, 500);
    } else if (data === null) {
      sendFailure('error in query', res, 500);
    } else {
      res.json(data);
    }
  });
});

router.put('/:id/:code', requireAdminCode, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    sendFailure('invalid id', res);
    return;
  }

  const { arrived, food_paid, staff_food, staff_price } = req.body;
  if (
    arrived === undefined &&
    food_paid === undefined &&
    staff_food === undefined &&
    staff_price === undefined
  ) {
    sendFailure(
      'missing arrived, food_paid, staff_food or staff_price in body',
      res
    );
    return;
  }

  let staffPrice;
  if (staff_price !== undefined) {
    staffPrice = Number(staff_price);
    if (!Number.isInteger(staffPrice)) {
      sendFailure('invalid staff_price', res);
      return;
    }
  }

  adminService.updateArrival(
    id,
    arrived,
    food_paid,
    staff_food,
    staffPrice,
    result => {
      if (result && result.error) {
        if (result.error === 'not found') {
          sendFailure('registration not found', res, 404);
        } else {
          sendFailure(result.error, res, 500);
        }
      } else {
        res.json({ success: 'true', message: 'updated' });
      }
    }
  );
});

export default router;
