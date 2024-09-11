'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const refresh_Token = {};

module.exports = [
    {
        method: "GET",
        path: "/",
        handler: (request, h) => {
            return h.response("Hello World!!");
        }
    },
    {
        method: 'POST',
        path: '/auth/register/seller',
        options: {
            auth: false,
            handler: async (request, h) => {
                const { email, name, password, phone } = request.payload;

                const role = 'seller';

                try {
                    const userExists = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [email]);
                    if (userExists) {
                        return h.response({ error: 'User already exists' }).code(400);
                    }

                    const hashedPassword = await bcrypt.hash(password, 10);

                    const newUser = await db.one(
                        `INSERT INTO users(email, name, password, phone, role) 
                         VALUES($1, $2, $3, $4, $5) 
                         RETURNING id, email, name, phone, role`,
                        [email, name, hashedPassword, phone, role]
                    );

                    return h.response({
                        user: {
                            id: newUser.id,
                            email: newUser.email,
                            name: newUser.name,
                            phone: newUser.phone,
                            role: newUser.role
                        },
                        message: 'User registered successfully!!'
                    }).code(201);
                } catch (error) {
                    console.error('Error during registration:', error);
                    return h.response({ error: 'Internal Server Error' }).code(500);
                }
            }
        }
    },
    {
        method: "POST",
        path: "/auth/login",
        options: {
            auth: false,
            handler: async (request, h) => {
                const { email, password } = request.payload;

                try {
                    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
                    if (!user) {
                        return h.response({ error: 'User not found' }).code(400);
                    }

                    const isValid = await bcrypt.compare(password, user.password);
                    if (!isValid) {
                        return h.response({ error: 'Invalid password' }).code(401);
                    }

                    const token = jwt.sign(
                        { id: user.id, email: user.email, name: user.name, role: user.role },
                        process.env.JWTSECRET,
                        { expiresIn: '10h' }
                    );

                    const refreshToken = jwt.sign(
                        { id: user.id, email: user.email, name: user.name, role: user.role },
                        process.env.JWTSECRET,
                        { expiresIn: '10h' }
                    );

                    refresh_Token[user.id] = refreshToken;

                    return h.response({
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role
                        },
                        token,
                        refreshToken,
                        message: 'Login successful',
                    }).code(200);
                } catch (error) {
                    console.error('Error during login:', error);
                    return h.response({ error: 'Internal Server Error' }).code(500);
                }
            }
        }
    },
    {
        method: 'GET',
        path: '/auth/check-role',
        options: {
            auth: false,
            handler: async (request, h) => {
                try {
                    const authHeader = request.headers.authorization;
                    if (!authHeader || !authHeader.startsWith('Bearer ')) {
                        return h.response({ error: 'Token is missing or invalid' }).code(401);
                    }
    
                    const token = authHeader.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWTSECRET);
    
                    return h.response({
                        role: decoded.role
                    }).code(200);
                } catch (error) {
                    console.error('Error checking role:', error);
                    return h.response({ error: 'Invalid or expired token' }).code(401);
                }
            }
        }
    },    
    {
        method: "GET",
        path: "/dashboard/profile-seller",
        handler: async (request, h) => {
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return h.response({ error: 'Token is missing or invalid' }).code(401);
                }

                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWTSECRET);

                const { email, name, images } = decoded;

                return h.response({
                    email,
                    name,
                    images
                }).code(200);

            } catch (error) {
                console.error('Error retrieving profile:', error);
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        }
    },
    {
        method: "GET",
        path: "/products",
        handler: async (request, h) => {
            try {
                const query = 'SELECT * FROM product';
                const products = await db.any(query);
                return h.response(products).code(200);
            } catch (error) {
                console.error('Error retrieving products:', error);
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        },
        options: {
            auth: false
        }
    },
    {
        method: "GET",
        path: "/dashboard/profile-seller/my-products",
        handler: async (request, h) => {
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return h.response({ error: 'Token is missing or invalid' }).code(401);
                }
    
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWTSECRET);
    
                const sellerEmail = decoded.email;
    
                const seller = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [sellerEmail]);
                if (!seller) {
                    return h.response({ error: 'Seller not found' }).code(404);
                }
    
                const sellerId = seller.id;
    
                const products = await db.any('SELECT * FROM product WHERE seller_id = $1', [sellerId]);
    
                return h.response(products).code(200);
            } catch (error) {
                console.error('Error retrieving products by email:', error);
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        }
    },    
    {
        method: "POST",
        path: "/dashboard/profile-seller/add-product",
        handler: async (request, h) => {
            const { title, description, images, price, sku } = request.payload;
    
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return h.response({ error: 'Token is missing or invalid' }).code(401);
                }
    
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWTSECRET);
    
                const seller_id = decoded.id;
    
                if (!title || !description || !images || !price || !sku) {
                    return h.response({ error: 'All fields are required' }).code(400);
                }
    
                const newProduct = await db.one(
                    `INSERT INTO product(title, description, images, price, sku, seller_id) 
                     VALUES($1, $2, $3, $4, $5, $6) 
                     RETURNING id, title, description, images, price, sku, created_at`,
                    [title, description, images, price, sku, seller_id]
                );
    
                return h.response({
                    product: {
                        id: newProduct.id,
                        title: newProduct.title,
                        description: newProduct.description,
                        images: newProduct.images,
                        price: newProduct.price,
                        sku: newProduct.sku,
                        created_at: newProduct.created_at
                    },
                    message: 'Product added successfully'
                }).code(201);
            } catch (error) {
                console.error('Error adding product:', error);
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        }
    },    
    {
        method: "PUT",
        path: "/dashboard/profile-seller/update-product/{id}",
        handler: async (request, h) => {
            const { id } = request.params;
            const { title, description, images, price } = request.payload;
    
            console.log('Request payload:', request.payload);
    
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return h.response({ error: 'Token is missing or invalid' }).code(401);
                }
    
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWTSECRET);
    
                const seller_id = decoded.id;
    
                if (!title || !description || !images || !price) {
                    return h.response({ error: 'All fields are required' }).code(400);
                }
    
                const updatedProduct = await db.oneOrNone(
                    `UPDATE product
                     SET title = $1, description = $2, images = $3, price = $4
                     WHERE id = $5 AND seller_id = $6
                     RETURNING id, title, description, images, price`,
                    [title, description, images, price, id, seller_id]
                );
    
                if (!updatedProduct) {
                    return h.response({ error: 'Product not found or you are not the seller' }).code(404);
                }
    
                return h.response({
                    product: {
                        id: updatedProduct.id,
                        title: updatedProduct.title,
                        description: updatedProduct.description,
                        images: updatedProduct.images,
                        price: updatedProduct.price
                    },
                    message: 'Product updated successfully'
                }).code(200);
            } catch (error) {
                console.error('Error updating product:', error);
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        }
    },
    {
        method: "DELETE",
        path: "/dashboard/profile-seller/delete-product/{id}",
        handler: async (request, h) => {
            const { id } = request.params;
    
            try {
                const authHeader = request.headers.authorization;
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return h.response({ error: 'Token is missing or invalid' }).code(401);
                }
    
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWTSECRET);
    
                const seller_id = decoded.id;
    
                const deletedProduct = await db.oneOrNone(
                    `DELETE FROM product
                     WHERE id = $1 AND seller_id = $2
                     RETURNING id`,
                    [id, seller_id]
                );
    
                if (!deletedProduct) {
                    return h.response({ error: 'Product not found or you are not the seller' }).code(404);
                }
    
                return h.response({ message: 'Product deleted successfully' }).code(200);
            } catch (error) {
                console.error('Error deleting product:', error);
                return h.response({ error: 'Internal Server Error' }).code(500);
            }
        }
    }
];
