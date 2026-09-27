import { TYPES } from 'tedious';
import { withConnection, execSql } from '../utils/db.js';

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
    const query = `SELECT r.*, b.[Location]
        FROM [dbo].[Lanregistration] r
        LEFT JOIN [dbo].[Lanbooking] b ON r.[Email] = b.[Email]
        WHERE r.[History] IS NULL`;

    withConnection(async connection => {
      const { rows } = await execSql(connection, query);
      return rows ? rows.map(row => rowToObject(row)) : [];
    })
      .then(result => callback(result))
      .catch(err => {
        console.error(err);
        callback({ error: 'request error' });
      });
  }

  /**
   * Päivittää lanregistration-rivin id:llä kentät Arrived ja Food_paid.
   */
  updateArrival(id, arrived, foodPaid, callback) {
    withConnection(async connection => {
      const { rowCount } = await execSql(
        connection,
        `UPDATE [dbo].[Lanregistration]
         SET [Arrived] = @arrived, [Food_paid] = @food_paid
         WHERE [Id] = @id`,
        request => {
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
        }
      );

      if (rowCount === 0) {
        const error = new Error('not found');
        error.code = 'not found';
        throw error;
      }

      return { success: true };
    })
      .then(result => callback(result))
      .catch(err => {
        console.error(err);
        if (err.code === 'not found') {
          callback({ error: 'not found' });
          return;
        }
        callback({ error: 'update error' });
      });
  }
}

export default new AdminService();
