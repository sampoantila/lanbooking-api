import { TYPES } from 'tedious';
import sendgrid from '@sendgrid/mail';
import config from '../config/config.js';
import { withConnection, execSql } from '../utils/db.js';

class BookingService {
  query(email, code, callback) {
    withConnection(async connection => {
      const { rowCount, rows } = await execSql(
        connection,
        'SELECT Location FROM [Lanbooking] WHERE Email = @email AND Code = @code',
        request => {
          request.addParameter('email', TYPES.NVarChar, email);
          request.addParameter('code', TYPES.NVarChar, code);
        }
      );

      if (rowCount === 0) {
        return null;
      }

      return rows[0][0].value == null ? '-' : rows[0][0].value;
    })
      .then(result => callback(result))
      .catch(err => {
        console.error('request error:');
        console.error(err);
        callback({ error: 'request error' });
      });
  }

  store(email, code, location, callback) {
    withConnection(async connection => {
      const { rowCount } = await execSql(
        connection,
        'UPDATE [Lanbooking] SET Location = @location WHERE Email = @email AND Code = @code',
        request => {
          request.addParameter('email', TYPES.NVarChar, email);
          request.addParameter('code', TYPES.NVarChar, code);
          request.addParameter('location', TYPES.NVarChar, location);
        }
      );

      console.log('rowcount r: ' + rowCount);
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

  isBooked(location, callback) {
    withConnection(async connection => {
      const { rowCount } = await execSql(
        connection,
        'SELECT * FROM [Lanbooking] WHERE Location = @location',
        request => {
          request.addParameter('location', TYPES.NVarChar, location);
        }
      );

      console.log('rowcount: ' + rowCount);
      return { booked: rowCount > 0 };
    })
      .then(result => callback(result))
      .catch(err => {
        console.error('request error:');
        console.error(err);
        callback({ error: 'request error' });
      });
  }

  allbooked(callback) {
    withConnection(async connection => {
      const { rowCount, rows } = await execSql(
        connection,
        'SELECT Location FROM [Lanbooking] WHERE Location IS NOT NULL'
      );

      if (rowCount === 0) {
        return [];
      }
      return rows.map(row => row[0].value);
    })
      .then(result => callback(result))
      .catch(err => {
        console.error('request error:');
        console.error(err);
        callback({ error: 'request error' });
      });
  }

  sendEmails(callback) {
    withConnection(async connection => {
      const { rowCount, rows } = await execSql(
        connection,
        'SELECT Email FROM [Lanbooking] WHERE InvitationSent = 0; UPDATE [Lanbooking] SET InvitationSent = 1 WHERE InvitationSent = 0;'
      );

      if (rowCount === 0) {
        const error = new Error('No emails to sent');
        error.code = 'No emails to sent';
        throw error;
      }

      return rows.map(row => row[0].value);
    })
      .then(emails => {
        this.sendMail(this.createInvitationMessage(emails), callback);
      })
      .catch(err => {
        console.error('request error:');
        console.error(err);
        callback({
          error: err.code === 'No emails to sent' ? 'No emails to sent' : 'request error',
        });
      });
  }

  createAccount(email, callback) {
    const code = `aslan${this.makeCode()}`;

    withConnection(async connection => {
      const { rowCount } = await execSql(
        connection,
        'SELECT * FROM [Lanbooking] WHERE Email = @email',
        request => {
          request.addParameter('email', TYPES.NVarChar, email);
        }
      );

      if (rowCount > 0) {
        console.log('update account: ' + email);
        const { rowCount: updated } = await execSql(
          connection,
          'UPDATE [Lanbooking] SET Code = @code WHERE Email = @email',
          request => {
            request.addParameter('code', TYPES.NVarChar, code);
            request.addParameter('email', TYPES.NVarChar, email);
          }
        );

        if (updated === 0) {
          const error = new Error('UPDATE failed');
          error.code = 'UPDATE failed';
          throw error;
        }
      } else {
        console.log('create account: ' + email);
        const { rowCount: inserted } = await execSql(
          connection,
          'INSERT INTO [Lanbooking] (Email, Code) VALUES (@email, @code)',
          request => {
            request.addParameter('code', TYPES.NVarChar, code);
            request.addParameter('email', TYPES.NVarChar, email);
          }
        );

        if (inserted === 0) {
          const error = new Error('INSERT failed');
          error.code = 'INSERT failed';
          throw error;
        }
      }

      return { email, code };
    })
      .then(({ email: accountEmail, code: accountCode }) => {
        console.log('send email to ' + accountEmail);
        this.sendMail(this.createBookingMessage(accountEmail, accountCode), callback);
      })
      .catch(err => {
        console.error('request error:');
        console.error(err);
        callback({
          error:
            err.code === 'INSERT failed' || err.code === 'UPDATE failed'
              ? err.code
              : 'request error',
        });
      });
  }

  createBookingMessage(email, code) {
    return {
      to: email,
      from: 'aslan@aslan.fi',
      templateId: config.SG_BOOKING_TEMPLATE_ID,
      dynamic_template_data: {
        email: email,
        code: code,
      },
    };
  }

  createInvitationMessage(emails) {
    return {
      to: emails,
      from: 'aslan@aslan.fi',
      templateId: config.SG_INVITE_TEMPLATE_ID,
      dynamic_template_data: {
        date: '19.-21.2.2026',
      },
    };
  }

  sendMail(msg, callback) {
    sendgrid.setApiKey(config.SG_API_KEY);

    sendgrid
      .send(msg, true)
      .then(() => {
        console.log('sent');
        console.log(msg);

        if (Array.isArray(msg.to)) {
          callback({ success: true, count: msg.to.length });
        } else {
          callback({ success: true });
        }
      })
      .catch(error => {
        console.error('email send error:');
        console.error(error);
        callback({ error: error });
      });
  }

  makeCode() {
    let text = '';
    const possible = '123456789';

    for (let i = 0; i < 5; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }
}

export default new BookingService();
