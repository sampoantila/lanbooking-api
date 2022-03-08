const dev = {
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    SG_API_KEY: process.env.SENDGRID_API_KEY,
    SG_BOOKING_TEMPLATE_ID: process.env.SG_BOOKING_TEMPLATE_ID,
    SG_INVITE_TEMPLATE_ID: process.env.SG_INVITE_TEMPLATE_ID,
    INVITE_SECRET: process.env.INVITE_SECRET
};

const prod = {
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    SG_API_KEY: process.env.SENDGRID_API_KEY,
    SG_BOOKING_TEMPLATE_ID: process.env.SG_BOOKING_TEMPLATE_ID,
    SG_INVITE_TEMPLATE_ID: process.env.SG_INVITE_TEMPLATE_ID,
    INVITE_SECRET: process.env.INVITE_SECRET
};

const config = process.env.NODE_ENV === 'development' ? dev : prod;

export default {
    ...config
};
