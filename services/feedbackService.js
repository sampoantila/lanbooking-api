import { TYPES } from 'tedious';
import { withConnection, execSql } from '../utils/db.js';

class FeedbackService {
  store(model, callback) {
    withConnection(async connection => {
      const { rowCount } = await execSql(
        connection,
        'INSERT [Lanfeedback] (overall,organizing,food,tournaments,atmosphere,comments,created) VALUES (@overall,@organizing,@food,@tournaments,@atmosphere,@comments,@created)',
        request => {
          request.addParameter('overall', TYPES.Int, model.overall);
          request.addParameter('organizing', TYPES.Int, model.organizing);
          request.addParameter('food', TYPES.Int, model.food);
          request.addParameter('tournaments', TYPES.Int, model.tournaments);
          request.addParameter('atmosphere', TYPES.Int, model.atmosphere);
          request.addParameter('comments', TYPES.NVarChar, model.comments);
          request.addParameter('created', TYPES.DateTime, new Date());
        }
      );

      if (rowCount === 0) {
        const error = new Error('no result');
        error.code = 'no result';
        throw error;
      }
      return rowCount;
    })
      .then(result => callback(result))
      .catch(err => {
        console.error('request error:');
        console.error(err);
        callback({ error: err.code === 'no result' ? 'no result' : 'request error' });
      });
  }
}

export default new FeedbackService();
