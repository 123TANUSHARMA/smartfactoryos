-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff', -- 'owner', 'staff'
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw materials table
CREATE TABLE raw_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL, -- kg, liters, pieces
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw material purchases
CREATE TABLE raw_material_purchases (
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

-- Machines table
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'detergent_cake', 'utensil_bar', 'surf_powder', 'packaging'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Machine maintenance records
CREATE TABLE machine_maintenance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    machine_id UUID REFERENCES machines(id),
    maintenance_date DATE NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    description TEXT,
    maintenance_type VARCHAR(50) NOT NULL, -- 'repair', 'routine'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trucks table
CREATE TABLE trucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_number VARCHAR(50) NOT NULL,
    capacity DECIMAL(10,2) NOT NULL,
    driver_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Truck expenses
CREATE TABLE truck_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    truck_id UUID REFERENCES trucks(id),
    expense_date DATE NOT NULL,
    expense_type VARCHAR(50) NOT NULL, -- 'diesel', 'salary', 'repair'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B2B Parties (distributors/retailers)
CREATE TABLE b2b_parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'detergent_powder', 'detergent_cake', 'utensil_bar'
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B2B Sales
CREATE TABLE b2b_sales (
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
    status VARCHAR(50) DEFAULT 'pending', -- 'paid', 'partial', 'pending'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B2C Sales (retail)
CREATE TABLE b2c_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date DATE NOT NULL,
    customer_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner withdrawals
CREATE TABLE partner_withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_name VARCHAR(255) NOT NULL, -- 'owner', 'brother'
    amount DECIMAL(10,2) NOT NULL,
    withdrawal_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO raw_materials (name, unit) VALUES
('Soda Ash', 'kg'),
('Acid Slurry', 'liters'),
('LABSA', 'kg'),
('STPP', 'kg'),
('Perfume', 'liters'),
('Color', 'kg'),
('Plastic Wrapping', 'pieces'),
('Boxes', 'pieces'),
('Katta Sacks', 'pieces');

INSERT INTO machines (name, type) VALUES
('Detergent Cake Maker', 'detergent_cake'),
('Utensil Bar Maker', 'utensil_bar'),
('Surf Powder Machine', 'surf_powder'),
('Packaging Unit', 'packaging');

INSERT INTO products (name, type, unit_price) VALUES
('Detergent Powder 1kg', 'detergent_powder', 45.00),
('Detergent Cake 200g', 'detergent_cake', 15.00),
('Utensil Cleaning Bar 100g', 'utensil_bar', 12.00);

INSERT INTO trucks (truck_number, capacity, driver_name) VALUES
('MH-01-AB-1234', 5000, 'Ramesh Kumar'),
('MH-01-AB-5678', 7000, 'Suresh Patil'),
('MH-01-AB-9012', 6000, 'Mahesh Singh'),
('MH-01-AB-3456', 8000, 'Ganesh Yadav'),
('MH-01-AB-7890', 5500, 'Rajesh Sharma');

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'staff')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a default owner account for demo purposes
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  uuid_generate_v4(),
  'owner@detergent.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"name": "Business Owner", "role": "owner"}'::jsonb
) ON CONFLICT (email) DO NOTHING;
