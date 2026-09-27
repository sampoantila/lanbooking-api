import { TYPES } from 'tedious';
import { withConnection, execSql } from '../utils/db.js';

class TodoService {
  getTodos(callback) {
    withConnection(async connection => {
      const { rowCount, rows } = await execSql(
        connection,
        'SELECT id, task, person, doing, done, created FROM [Lantodo]'
      );

      if (rowCount === 0) {
        return [];
      }

      return rows.map(row => ({
        [row[0].metadata.colName]: row[0].value,
        [row[1].metadata.colName]: row[1].value,
        [row[2].metadata.colName]: row[2].value,
        [row[3].metadata.colName]: row[3].value,
        [row[4].metadata.colName]: row[4].value,
        [row[5].metadata.colName]: row[5].value,
      }));
    })
      .then(result => callback(result))
      .catch(err => {
        console.error(err);
        callback({ error: 'request error' });
      });
  }

  store(model, callback) {
    withConnection(async connection => {
      const { rowCount } = await execSql(
        connection,
        'INSERT [Lantodo] (task,person,doing,done,created) VALUES (@task,@person,@doing,@done,@created)',
        request => {
          request.addParameter('task', TYPES.NVarChar, model.task);
          request.addParameter('person', TYPES.NVarChar, model.person);
          request.addParameter('doing', TYPES.Int, model.doing);
          request.addParameter('done', TYPES.Int, model.done);
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

export default new TodoService();
