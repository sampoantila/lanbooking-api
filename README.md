# lanbooking-api

| Language | Framework | Platform                       | Author |
| -------- | --------- | ------------------------------ | ------ |
| Nodejs   | Express   | Azure Web App, Virtual Machine |        |

# Nodejs Express REST API for lan booking

Nodejs Express REST API for lan booking

## Ympäristömuuttujat

Projekti käyttää .env tiedostoa ympäristömuuttujien hallintaan. Kopioi `env.example` tiedosto `.env` nimellä ja täytä oikeat arvot:

```bash
cp env.example .env
```

Täytä .env tiedostoon seuraavat arvot:

- `DB_HOST` - Tietokannan host
- `DB_NAME` - Tietokannan nimi
- `DB_USER` - Tietokannan käyttäjätunnus
- `DB_PASSWORD` - Tietokannan salasana
- `SENDGRID_API_KEY` - SendGrid API avain
- `SG_BOOKING_TEMPLATE_ID` - SendGrid booking template ID
- `SG_INVITE_TEMPLATE_ID` - SendGrid invite template ID
- `INVITE_SECRET` - Invite salaisuus
- `NODE_ENV` - Ympäristö (development/production)
- `PORT` - Portti (oletus 4000)

## License:

See [LICENSE](LICENSE).
