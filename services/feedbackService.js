import { Request, TYPES } from 'tedious';
import azureSqlConnection from '../utils/azureSqlConnection';

class FeedbackService {
  store(model, callback) {
    const connection = azureSqlConnection.connect();

    // Attempt to connect and execute queries if connection goes through
    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        // Read all rows from table
        const request = new Request(
          'INSERT [Lanfeedback] (overall,organizing,food,tournaments,atmosphere,comments) VALUES (@overall,@organizing,@food,@tournaments,@atmosphere,@comments)',
          (err, rowCount) => {
            if (err) {
              console.error('request error:');
              console.log(err);
              callback({ error: 'request error' });
              return;
            }
            if (rowCount === 0) {
              callback({ error: 'no result' });
            } else {
              callback(rowCount);
            }
          }
        );

        request.addParameter('overall', TYPES.Int, model.overall);
        request.addParameter('organizing', TYPES.Int, model.organizing);
        request.addParameter('food', TYPES.Int, model.food);
        request.addParameter('tournaments', TYPES.Int, model.tournaments);
        request.addParameter('atmosphere', TYPES.Int, model.atmosphere);
        request.addParameter('comments', TYPES.NVarChar, model.comments);

        request.on('done', rowCount => {
          callback(true);
        });

        connection.execSql(request);
      }
    });

    connection.connect();
  }
}

export default new FeedbackService();
