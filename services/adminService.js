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
   * Päivittää lanregistration-rivin id:llä ne kentistä Arrived, Food_paid,
   * staff_food ja staff_price, jotka pyynnössä on annettu.
   */
  updateArrival(id, arrived, foodPaid, staffFood, staffPrice, callback) {
    const assignments = [];
    if (arrived !== undefined) {
      assignments.push('[Arrived] = @arrived');
    }
    if (foodPaid !== undefined) {
      assignments.push('[Food_paid] = @food_paid');
    }
    if (staffFood !== undefined) {
      assignments.push('[staff_food] = @staff_food');
    }
    if (staffPrice !== undefined) {
      assignments.push('[staff_price] = @staff_price');
    }

    withConnection(async connection => {
      const { rowCount } = await execSql(
        connection,
        `UPDATE [dbo].[Lanregistration]
         SET ${assignments.join(', ')}
         WHERE [Id] = @id`,
        request => {
          request.addParameter('id', TYPES.Int, id);
          if (arrived !== undefined) {
            request.addParameter(
              'arrived',
              TYPES.Int,
              arrived === true || arrived === 1
            );
          }
          if (foodPaid !== undefined) {
            request.addParameter(
              'food_paid',
              TYPES.Int,
              foodPaid === true || foodPaid === 1
            );
          }
          if (staffFood !== undefined) {
            request.addParameter(
              'staff_food',
              TYPES.Int,
              staffFood === true || staffFood === 1
            );
          }
          if (staffPrice !== undefined) {
            request.addParameter('staff_price', TYPES.Int, staffPrice);
          }
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

  /**
   * Arkistoi kaikki ilmoittautumiset ja nollaa kaikki varaukset.
   * Lanregistration.History = 1.
   * Lanbooking: Code = '*****', Location = null, InvitationSent = 0.
   */
  resetBookingsAndRegistrations(callback) {
    const query = `BEGIN TRY
      BEGIN TRANSACTION;
      UPDATE [dbo].[Lanregistration] SET [History] = 1;
      UPDATE [dbo].[Lanbooking]
        SET [Code] = @code,
            [Location] = NULL,
            [InvitationSent] = 0;
      COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
      IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
      THROW;
    END CATCH`;

    withConnection(async connection => {
      await execSql(connection, query, request => {
        request.addParameter('code', TYPES.NVarChar, '*****');
      });
      return { success: true };
    })
      .then(result => callback(result))
      .catch(err => {
        console.error(err);
        callback({ error: 'reset error' });
      });
  }
}

export default new AdminService();
