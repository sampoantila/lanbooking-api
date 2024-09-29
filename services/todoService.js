import { Request, TYPES } from 'tedious';
import azureSqlConnection from '../utils/azureSqlConnection.js';

class TodoService {
  getTodos(callback) {
    const connection = azureSqlConnection.connect();

    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        var request = new Request(
          'SELECT id, task, person, doing, done, created FROM [Lantodo]',
          (err, rowCount, rows) => {
            if (err) {
              console.log(err);
            }
            if (rowCount === 0) {
              callback([]);
            } else {
              callback(
                rows.map(row => {
                  return {
                    [row[0].metadata.colName]: row[0].value,
                    [row[1].metadata.colName]: row[1].value,
                    [row[2].metadata.colName]: row[2].value,
                    [row[3].metadata.colName]: row[3].value,
                    [row[4].metadata.colName]: row[4].value,
                    [row[5].metadata.colName]: row[5].value,
                  };
                })
              );
            }
          }
        );

        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }

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

        request.addParameter('task', TYPES.NVarChar, model.task);
        request.addParameter('person', TYPES.NVarChar, model.person);
        request.addParameter('doing', TYPES.Int, model.doing);
        request.addParameter('done', TYPES.Int, model.done);
        request.addParameter('created', TYPES.DateTime, new Date());

        request.on('done', rowCount => {
          callback(true);
        });

        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }
}

export default new TodoService();
