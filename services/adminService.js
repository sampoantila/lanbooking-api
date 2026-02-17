import { Request, TYPES } from 'tedious';
import azureSqlConnection from '../utils/azureSqlConnection.js';

function rowToObject(row) {
  return row.reduce((obj, col) => {
    obj[col.metadata.colName] = col.value;
    return obj;
  }, {});
}

class AdminService {
  /**
   * Hakee lanregistration-rivit joissa history = null,
   * joinilla lanbooking-sähköpostin kautta henkilön varattu paikka (location).
   */
  getRegistrationsWithLocation(callback) {
    const connection = azureSqlConnection.connect();

    connection.on('connect', connErr => {
      if (connErr) {
        console.error(connErr);
        callback(null);
        return;
      }

      const query = `SELECT r.*, b.[Location]
        FROM [dbo].[Lanregistration] r
        LEFT JOIN [dbo].[Lanbooking] b ON r.[Email] = b.[Email]
        WHERE r.[History] IS NULL`;

      const request = new Request(query, (err, rowCount, rows) => {
        if (err) {
          console.error(err);
          callback(null);
          return;
        }
        const result = rows ? rows.map(row => rowToObject(row)) : [];
        callback(result);
      });

      connection.execSql(request);
    });

    connection.connect();
    connection.close();
  }

  /**
   * Päivittää lanregistration-rivin id:llä kentät Arrived ja Food_paid.
   */
  updateArrival(id, arrived, foodPaid, callback) {
    const connection = azureSqlConnection.connect();

    connection.on('connect', connErr => {
      if (connErr) {
        console.error(connErr);
        callback({ error: 'connection error' });
        return;
      }

      const request = new Request(
        `UPDATE [dbo].[Lanregistration]
         SET [Arrived] = @arrived, [Food_paid] = @food_paid
         WHERE [Id] = @id`,
        (err, rowCount) => {
          if (err) {
            console.error(err);
            callback({ error: 'update error' });
            return;
          }
          if (rowCount === 0) {
            callback({ error: 'not found' });
            return;
          }
          callback({ success: true });
        }
      );

      request.addParameter('id', TYPES.Int, id);
      request.addParameter(
        'arrived',
        TYPES.Int,
        arrived === true || arrived === 1
      );
      request.addParameter(
        'food_paid',
        TYPES.Int,
        foodPaid === true || foodPaid === 1
      );

      connection.execSql(request);
    });

    connection.connect();
    connection.close();
  }
}

export default new AdminService();
