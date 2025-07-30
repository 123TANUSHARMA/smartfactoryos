-- Simple database setup for testing
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (simplified)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw materials table
CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw material purchases
CREATE TABLE IF NOT EXISTS raw_material_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id),
    material_id UUID REFERENCES raw_materials(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    purchase_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Other essential tables
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS machine_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES machines(id),
    maintenance_date DATE NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    description TEXT,
    maintenance_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_number VARCHAR(50) NOT NULL,
    capacity DECIMAL(10,2) NOT NULL,
    driver_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS truck_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id UUID REFERENCES trucks(id),
    expense_date DATE NOT NULL,
    expense_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS b2b_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS b2b_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    party_id UUID REFERENCES b2b_parties(id),
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS b2c_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    customer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS partner_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    withdrawal_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO raw_materials (name, unit) VALUES
('Soda Ash', 'kg'),
('Acid Slurry', 'liters'),
('LABSA', 'kg'),
('STPP', 'kg'),
('Perfume', 'liters'),
('Color', 'kg'),
('Plastic Wrapping', 'pieces'),
('Boxes', 'pieces'),
('Katta Sacks', 'pieces')
ON CONFLICT DO NOTHING;

INSERT INTO machines (name, type) VALUES
('Detergent Cake Maker', 'detergent_cake'),
('Utensil Bar Maker', 'utensil_bar'),
('Surf Powder Machine', 'surf_powder'),
('Packaging Unit', 'packaging')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, type, unit_price) VALUES
('Detergent Powder 1kg', 'detergent_powder', 45.00),
('Detergent Cake 200g', 'detergent_cake', 15.00),
('Utensil Cleaning Bar 100g', 'utensil_bar', 12.00)
ON CONFLICT DO NOTHING;

INSERT INTO trucks (truck_number, capacity, driver_name) VALUES
('MH-01-AB-1234', 5000, 'Ramesh Kumar'),
('MH-01-AB-5678', 7000, 'Suresh Patil'),
('MH-01-AB-9012', 6000, 'Mahesh Singh'),
('MH-01-AB-3456', 8000, 'Ganesh Yadav'),
('MH-01-AB-7890', 5500, 'Rajesh Sharma')
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (name, contact_person, phone, address) VALUES
('Chemical Suppliers Ltd', 'Rajesh Kumar', '+91-9876543210', 'Industrial Area, Mumbai'),
('Raw Materials Co', 'Priya Sharma', '+91-9876543211', 'Chemical Hub, Pune'),
('Packaging Solutions', 'Amit Patel', '+91-9876543212', 'Industrial Zone, Ahmedabad')
ON CONFLICT DO NOTHING;

INSERT INTO b2b_parties (name, contact_person, phone, address, credit_limit) VALUES
('City Distributors', 'Suresh Gupta', '+91-9876543213', 'Market Area, Delhi', 50000),
('Retail Chain Pvt Ltd', 'Meera Singh', '+91-9876543214', 'Commercial Complex, Bangalore', 75000),
('Wholesale Traders', 'Vikram Joshi', '+91-9876543215', 'Trade Center, Chennai', 100000)
ON CONFLICT DO NOTHING;
