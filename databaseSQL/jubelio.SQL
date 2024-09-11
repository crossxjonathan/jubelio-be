CREATE TABLE users (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(64) NOT NULL,
    email VARCHAR(64) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    role VARCHAR(50),
    PRIMARY KEY (id)
);


CREATE TABLE seller(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(64),
    phone VARCHAR(20),
    images VARCHAR(2048),
    users_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY(id),
    FOREIGN KEY (users_id) REFERENCES users(id)
);


CREATE TABLE customer(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(64),
    phone VARCHAR(20),
    images VARCHAR(2048),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    users_id UUID,
    PRIMARY KEY(id),
    FOREIGN KEY (users_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(64) NOT NULL,
    description TEXT,
    images VARCHAR(2048),
    sku VARCHAR(64) UNIQUE NOT NULL,
    price NUMERIC(10, 2) CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seller_id UUID,
    FOREIGN KEY (seller_id) REFERENCES seller(id)
);


