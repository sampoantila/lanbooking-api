import { Request } from 'tedious';
import azureSqlConnection from './azureSqlConnection.js';

/**
 * Opens a connection, runs work(connection), and always closes afterwards.
 * work may be async and may run multiple queries on the same connection.
 */
export function withConnection(work) {
  return new Promise((resolve, reject) => {
    const connection = azureSqlConnection.connect();
    let settled = false;

    const finish = (err, result) => {
      if (settled) {
        return;
      }
      settled = true;
      connection.close();
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    };

    connection.on('connect', connErr => {
      if (connErr) {
        console.error(connErr);
        finish(connErr);
        return;
      }

      Promise.resolve()
        .then(() => work(connection))
        .then(result => finish(null, result))
        .catch(err => finish(err));
    });

    connection.connect();
  });
}

/**
 * Executes a single SQL statement on an open connection.
 * Returns { rowCount, rows }.
 */
export function execSql(connection, sql, addParams) {
  return new Promise((resolve, reject) => {
    const request = new Request(sql, (err, rowCount, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ rowCount, rows });
    });

    if (addParams) {
      addParams(request);
    }

    connection.execSql(request);
  });
}
