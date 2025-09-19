import { Request, TYPES } from 'tedious';
import sendgrid from '@sendgrid/mail';
import azureSqlConnection from '../utils/azureSqlConnection.js';
import config from '../config/config.js';

class BookingService {
  query(email, code, callback) {
    const connection = azureSqlConnection.connect();

    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        const request = new Request(
          'SELECT Location FROM [Lanbooking] WHERE Email = @email AND Code = @code',
          (err, rowCount, rows) => {
            if (err) {
              console.error('request error:');
              console.log(err);
              callback({ error: 'request error' });
              return;
            }

            if (rowCount === 0) {
              callback(null);
            } else {
              rows[0][0].value == null
                ? callback('-')
                : callback(rows[0][0].value);
            }
          }
        );

        request.addParameter('email', TYPES.NVarChar, email);
        request.addParameter('code', TYPES.NVarChar, code);

        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }

  store(email, code, location, callback) {
    const connection = azureSqlConnection.connect();

    // Attempt to connect and execute queries if connection goes through
    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        // Read all rows from table
        const request = new Request(
          'UPDATE [Lanbooking] SET Location = @location WHERE Email = @email AND Code = @code',
          (err, rowCount) => {
            if (err) {
              console.error('request error:');
              console.log(err);
              callback({ error: 'request error' });
              return;
            }
            console.log('rowcount r: ' + rowCount);
            if (rowCount === 0) {
              callback({ error: 'no result' });
            } else {
              callback(rowCount);
            }
          }
        );

        request.addParameter('email', TYPES.NVarChar, email);
        request.addParameter('code', TYPES.NVarChar, code);
        request.addParameter('location', TYPES.NVarChar, location);

        console.log(request);

        request.on('done', rowCount => {
          console.log('req on done called');
          console.log('rowcount: ' + rowCount);
          callback(rowCount);
        });

        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }

  isBooked(location, callback) {
    const connection = azureSqlConnection.connect();

    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        const request = new Request(
          'SELECT * FROM [Lanbooking] WHERE Location = @location',
          (err, rowCount) => {
            if (err) {
              console.error('request error:');
              console.log(err);
              callback({ error: 'request error' });
              return;
            }
            console.log('rowcount: ' + rowCount);
            callback({ booked: rowCount > 0 });
          }
        );

        request.addParameter('location', TYPES.NVarChar, location);

        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }

  allbooked(callback) {
    const connection = azureSqlConnection.connect();

    // Attempt to connect and execute queries if connection goes through
    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        // Read all rows from table
        const request = new Request(
          'SELECT Location FROM [Lanbooking] WHERE Location IS NOT NULL',
          (err, rowCount, rows) => {
            if (err) {
              console.error('request error:');
              console.log(err);
              callback({ error: 'request error' });
              return;
            }

            if (rowCount === 0) {
              callback([]);
            } else {
              callback(rows.map(row => row[0].value));
            }
          }
        );

        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }

  sendEmails(callback) {
    const connection = azureSqlConnection.connect();

    connection.on('connect', connErr => {
      if (connErr) {
        console.log(connErr);
      } else {
        // Read all rows from table send only for those who has note yet registered
        const request = new Request(
          'SELECT Email FROM [Lanbooking] WHERE InvitationSent = 0; UPDATE [Lanbooking] SET InvitationSent = 1 WHERE InvitationSent = 0;',
          (err, rowCount, rows) => {
            if (err) {
              console.error('request error:');
              console.log(err);
              callback({ error: 'request error' });
              return;
            }
            if (rowCount === 0) {
              callback({ error: 'No emails to sent' });
              return;
            }
            connection.close();

            const emails = rows.map(row => row[0].value);
            //callback(rows.map(row => row[0].value));

            this.sendMail(this.createInvitationMessage(emails), callback);
          }
        );

        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }

  createAccount(email, callback) {
    const connection = azureSqlConnection.connect();
    const code = `aslan${this.makeCode()}`;

    // Attempt to connect and execute queries if connection goes through
    connection.on('connect', connErr => {
      if (connErr) {
        console.error(connErr);
      } else {
        // Is already registered?
        const request = new Request(
          'SELECT * FROM [Lanbooking] WHERE Email = @email',
          (err, rowCount) => {
            if (err) {
              console.error('request error:');
              console.error(err);
              callback({ error: 'request error' });
              return;
            }

            if (rowCount > 0) {
              console.log('update account: ' + email);
              this.updateAccountWithCode(connection, email, code, callback);
              return;
            }

            // not yet registered
            console.log('create account: ' + email);
            this.createNewAccountWithCode(connection, email, code, callback);
          }
        );

        request.addParameter('email', TYPES.NVarChar, email);
        connection.execSql(request);
      }
    });

    connection.connect();
    connection.close();
  }

  createNewAccountWithCode(connection, email, code, callback) {
    // Create account all rows from table send only for those who has note yet registered
    const request = new Request(
      'INSERT INTO [Lanbooking] (Email, Code) VALUES (@email, @code)',
      (err, rowCount) => {
        if (err) {
          console.error('request error:');
          console.error(err);
          callback({ error: 'request error' });
          return;
        }
        connection.close();

        if (rowCount === 0) {
          callback({ error: 'INSERT failed' });
          return;
        }

        console.log('send email to ' + email);
        this.sendMail(this.createBookingMessage(email, code), callback);
      }
    );

    request.addParameter('code', TYPES.NVarChar, code);
    request.addParameter('email', TYPES.NVarChar, email);

    connection.execSql(request);
  }

  updateAccountWithCode(connection, email, code, callback) {
    // Update account code and send email
    const request = new Request(
      'UPDATE [Lanbooking] SET Code = @code WHERE Email = @email',
      (err, rowCount) => {
        if (err) {
          console.error('request error:');
          console.error(err);
          callback({ error: 'request error' });
          return;
        }
        connection.close();

        if (rowCount === 0) {
          callback({ error: 'UPDATE failed' });
          return;
        }

        console.log('send email to ' + email);
        this.sendMail(this.createBookingMessage(email, code), callback);
      }
    );

    request.addParameter('code', TYPES.NVarChar, code);
    request.addParameter('email', TYPES.NVarChar, email);

    connection.execSql(request);
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
        date: '16.-18.10.2025',
      },
    };
  }

  sendMail(msg, callback) {
    sendgrid.setApiKey(config.SG_API_KEY);

    sendgrid
      .send(msg, true)
      .then(result => {
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
