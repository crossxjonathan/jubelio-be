require('dotenv').config();
const pgp = require('pg-promise')();

const db = pgp({
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

const products = require('../helper/dummyjson.js');

const importData = async () => {
    try {
        const query = `INSERT INTO product (title, description, price, images, sku)
                       VALUES ($(title), $(description), $(price), $(images), $(sku))
                       ON CONFLICT (sku) DO NOTHING
                       `;

        for (const product of products) {
            const imagesString = product.images.join(',');

            await db.none(query, {
                title: product.title,
                description: product.description,
                price: product.price,
                images: imagesString,
                sku: product.sku
            });
        }

        console.log('Data imported successfully');
    } catch (error) {
        console.error('Error importing data:', error);
    }
}

db.connect()
    .then(async obj => {
        console.log('Connected to the DB successfully.');

        await importData();

        obj.done();
    })
    .catch(error => {
        console.error('Failed to connect to the DB:', error);
    });

module.exports = db;
