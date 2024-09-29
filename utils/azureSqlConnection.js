import { Connection, ISOLATION_LEVEL } from 'tedious';
import config from '../config/config.js';

class AzureSqlConnection {
  connect() {
    // Create connection to database
    var dbConfig = {
      server: config.DB_HOST,
      options: {
        database: config.DB_NAME,
        encrypt: true,
        rowCollectionOnRequestCompletion: true,
        enableArithAbort: true,
        connectionIsolationLevel: ISOLATION_LEVEL.READ_UNCOMMITTED,
      },
      authentication: {
        type: 'default',
        options: {
          userName: config.DB_USER,
          password: config.DB_PASSWORD,
        },
      },
    };

    return new Connection(dbConfig);
  }
}

export default new AzureSqlConnection();
