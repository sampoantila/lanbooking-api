import { Request, TYPES } from 'tedious';
import azureSqlConnection from '../utils/azureSqlConnection';

class RegistrationService {
    register(model, callback) {
        var connection = azureSqlConnection.connect();

        // Attempt to connect and execute queries if connection goes through
        connection.on('connect', (connErr) => {
            if (connErr) {
                console.log(connErr)
            }
            else {
                // Store registration
                var query = `INSERT INTO [dbo].[Lanregistration]
                                    ([Firstname],[Lastname],[Phone],[Email],[ParentName],[ParentPhone],
                                    [DevicePC],[DeviceConsole],[DeviceHanging],[DeviceOther],[DeviceOtherComment],
                                    [AttendingThu],[AttendingFri],
                                    [TournamentBS],[TournamentOW],[TournamentLOL],[TournamentMC],[TournamentCS],[TournamentTetris],
                                    [TournamentTableFB],[TournamentTableTennis],[TournamentBiljard],[TournamentOther],[TournamentOtherComment],
                                    [Food],[Diet],[DietL],[DietG],[DietV],[DietOther],[DietOtherComment])
                            VALUES
                                    (@firstname,@lastname,@phone,@email,@parentName,@parentPhone,
                                    @devicePC,@deviceConsole,@deviceHanging,@deviceOther,@deviceOtherComment,
                                    @attendingThu,@attendingFri,
                                    @tournamentBS,@tournamentOW,@tournamentLOL,@tournamentMC,@tournamentCS,@tournamentTetris,
                                    @tournamentTableFB,@tournamentTableTennis,@tournamentBiljard,@tournamentOther,@tournamentOtherComment,
                                    @food,@diet,@dietL,@dietG,@dietV,@dietOther,@dietOtherComment);
                            SELECT @@identity`;

                var request = new Request(query,
                    (err, rowCount, rows) => {
                        if (err) {
                            console.log(err);
                        }
                        // console.log("rowcount r: " + rowCount);
                        if (rowCount === 0) {
                            callback(null);
                        }
                        else {
                            //console.log('New id: %d', rows[0][0].value)
                            callback(rowCount);
                        }
                    });

                request.addParameter('firstname', TYPES.NVarChar, model.etunimi);
                request.addParameter('lastname', TYPES.NVarChar, model.sukunimi);
                request.addParameter('phone', TYPES.NVarChar, model.puhelin);
                request.addParameter('email', TYPES.NVarChar, model.email);
                request.addParameter('parentName', TYPES.NVarChar, model.huoltajaNimi);
                request.addParameter('parentPhone', TYPES.NVarChar, model.huoltajaPuhelin);
                request.addParameter('devicePC', TYPES.TinyInt, model.mukaanPc);
                request.addParameter('deviceConsole', TYPES.TinyInt, model.mukaanKonsoli);
                request.addParameter('deviceHanging', TYPES.TinyInt, model.mukaanHengailu);
                request.addParameter('deviceOther', TYPES.TinyInt, model.mukaanMuuta);
                request.addParameter('deviceOtherComment', TYPES.NVarChar, model.mukaanMuutaKommentti);
                request.addParameter('attendingThu', TYPES.TinyInt, model.osallistumisToPe);
                request.addParameter('attendingFri', TYPES.TinyInt, model.osallistumisPeLa);
                request.addParameter('tournamentBS', TYPES.TinyInt, model.turnausBS);
                request.addParameter('tournamentOW', TYPES.TinyInt, model.turnausOW);
                request.addParameter('tournamentLOL', TYPES.TinyInt, model.turnausLOL);
                request.addParameter('tournamentMC', TYPES.TinyInt, model.turnausMC);
                request.addParameter('tournamentCS', TYPES.TinyInt, model.turnausCS);
                request.addParameter('tournamentTetris', TYPES.TinyInt, model.turnausTetris);
                request.addParameter('tournamentNerf', TYPES.TinyInt, model.turnausNerf);
                request.addParameter('tournamentTableFB', TYPES.TinyInt, model.turnausTableFB);
                request.addParameter('tournamentTableTennis', TYPES.TinyInt, model.turnausTableTennis);
                request.addParameter('tournamentBiljard', TYPES.TinyInt, model.turnausBiljari);
                request.addParameter('tournamentOther', TYPES.TinyInt, model.turnausMuuta);
                request.addParameter('tournamentOtherComment', TYPES.NVarChar, model.turnausMuutaKommentti);
                request.addParameter('food', TYPES.TinyInt, model.ruoka);
                request.addParameter('diet', TYPES.TinyInt, model.ruokaKaikki);
                request.addParameter('dietL', TYPES.TinyInt, model.ruokaLaktoositon);
                request.addParameter('dietG', TYPES.TinyInt, model.ruokaGluteeniton);
                request.addParameter('dietV', TYPES.TinyInt, model.ruokaVegaani);
                request.addParameter('dietOther', TYPES.TinyInt, model.ruokaMuu);
                request.addParameter('dietOtherComment', TYPES.NVarChar, model.ruokaMuuKommentti);

                connection.execSql(request);
            }
        });

        connection.connect();
    }

    isRegistered(email, callback) {
        var connection = azureSqlConnection.connect();
        
        connection.on('connect', (connErr) => {
            if (connErr) {
                console.log(connErr)
            }
            else {
                var request = new Request("SELECT * FROM [Lanregistration] WHERE Email = @email AND History IS NULL",
                        (err, rowCount) => {
                            if (err) {
                                console.log(err);
                            } else {
                                callback({'registered': rowCount > 0});
                            }
                        });

                        request.addParameter('email', TYPES.NVarChar, email);

                connection.execSql(request);
            }
        });

        connection.connect();
    }

    tournaments(callback) {
        var connection = azureSqlConnection.connect();

        connection.on('connect', (connErr) => {
            if (connErr) {
                console.log(connErr)
            }
            else {
                var request = new Request("SELECT Id, Name, Link FROM [Lantournament] WHERE Enabled = 1",
                        (err, rowCount, rows) => {
                            if (err) {
                                console.log(err);
                            }
                            console.log("rowcount: " + rowCount);
                            if (rowCount === 0) {
                                callback([]);
                            }
                            else {
                                callback(rows.map(row => {
                                        return {
                                            [row[0].metadata.colName]: row[0].value,
                                            [row[1].metadata.colName]: row[1].value,
                                            [row[2].metadata.colName]: row[2].value
                                        };
                                    }
                                ));
                            }
                        });

                connection.execSql(request);
            }
        });

        connection.connect();
    }

    count(callback) {
        var connection = azureSqlConnection.connect();

        connection.on('connect', (connErr) => {
            if (connErr) {
                console.log(connErr)
            }
            else {
                var request = new Request("SELECT COUNT(*) FROM [Lanregistration] WHERE History IS NULL",
                        (err, rowCount, rows) => {
                            if (err) {
                                console.log(err);
                            }
                            console.log("rowcount: " + rowCount);
                            if (rowCount === 0) {
                                callback([]);
                            }
                            else {
                                callback(rows.map(row => {
                                        return row[0].value;
                                    }
                                ));
                            }
                        });

                connection.execSql(request);
            }
        });

        connection.connect();
    }

}

export default new RegistrationService();
