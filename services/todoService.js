import { Request, TYPES } from 'tedious';
import azureSqlConnection from '../utils/azureSqlConnection';

class TodoService {
  store(model, callback) {
    const connection = azureSqlConnection.connect();

    // Attempt to connect and execute queries if connection goes through
    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        // Read all rows from table
        const request = new Request(
          'INSERT [Lantodo] (task,person,doing,done,created) VALUES (@task,@person,@doing,@done,@created)',
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

        request.addParameter('task', TYPES.Int, model.overall);
        request.addParameter('person', TYPES.Int, model.organizing);
        request.addParameter('doing', TYPES.Int, model.food);
        request.addParameter('done', TYPES.Int, model.tournaments);
        request.addParameter('created', TYPES.DateTime, new Date());

        request.on('done', rowCount => {
          callback(true);
        });

        connection.execSql(request);
      }
    });

    connection.connect();
  }
}

export default new TodoService();
