import { Connection, Request, TYPES } from 'tedious';

const executeSQL = (context, verb, payload) =>
  new Promise((resolve, reject) => {
    var result = '';
    const paramPayload = payload != null ? JSON.stringify(payload) : '';
    //context.log(`Payload: ${JSON.stringify(payload)}`);

    const config = {}; // TODO
    const connection = new Connection(config);

    const request = new Request(`web.${verb}_todo`, err => {
      if (err) {
        reject(err);
      } else {
        if (result == '' || result == null || result == 'null') result = '[]';
        resolve(result);
      }
    });
    request.addParameter('payload', TYPES.NVarChar, paramPayload, Infinity);

    request.on('row', columns => {
      columns.forEach(column => {
        result += column.value;
      });
    });

    connection.on('connect', err => {
      if (err) {
        reject(err);
      } else {
        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  });

export default executeSQL;
