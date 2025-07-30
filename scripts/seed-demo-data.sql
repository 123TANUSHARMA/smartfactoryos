-- Insert demo suppliers
INSERT INTO suppliers (name, contact_person, phone, address) VALUES
('Chemical Suppliers Ltd', 'Rajesh Kumar', '+91-9876543210', 'Industrial Area, Mumbai'),
('Raw Materials Co', 'Priya Sharma', '+91-9876543211', 'Chemical Hub, Pune'),
('Packaging Solutions', 'Amit Patel', '+91-9876543212', 'Industrial Zone, Ahmedabad')
ON CONFLICT DO NOTHING;

-- Insert demo B2B parties
INSERT INTO b2b_parties (name, contact_person, phone, address, credit_limit) VALUES
('City Distributors', 'Suresh Gupta', '+91-9876543213', 'Market Area, Delhi', 50000),
('Retail Chain Pvt Ltd', 'Meera Singh', '+91-9876543214', 'Commercial Complex, Bangalore', 75000),
('Wholesale Traders', 'Vikram Joshi', '+91-9876543215', 'Trade Center, Chennai', 100000)
ON CONFLICT DO NOTHING;

-- Insert some demo purchases (last 30 days)
INSERT INTO raw_material_purchases (
  supplier_id, 
  material_id, 
  quantity, 
  unit_price, 
  total_amount, 
  amount_paid, 
  remaining_amount, 
  purchase_date,
  due_date
) 
SELECT 
  s.id,
  rm.id,
  CASE rm.name
    WHEN 'Soda Ash' THEN 500
    WHEN 'LABSA' THEN 200
    WHEN 'Plastic Wrapping' THEN 1000
    ELSE 100
  END as quantity,
  CASE rm.name
    WHEN 'Soda Ash' THEN 25.50
    WHEN 'LABSA' THEN 85.00
    WHEN 'Plastic Wrapping' THEN 2.50
    WHEN 'Boxes' THEN 15.00
    ELSE 50.00
  END as unit_price,
  CASE rm.name
    WHEN 'Soda Ash' THEN 12750
    WHEN 'LABSA' THEN 17000
    WHEN 'Plastic Wrapping' THEN 2500
    WHEN 'Boxes' THEN 1500
    ELSE 5000
  END as total_amount,
  CASE rm.name
    WHEN 'Soda Ash' THEN 10000
    WHEN 'LABSA' THEN 17000
    WHEN 'Plastic Wrapping' THEN 2500
    ELSE 3000
  END as amount_paid,
  CASE rm.name
    WHEN 'Soda Ash' THEN 2750
    WHEN 'LABSA' THEN 0
    WHEN 'Plastic Wrapping' THEN 0
    ELSE 2000
  END as remaining_amount,
  CURRENT_DATE - (random() * 30)::int as purchase_date,
  CURRENT_DATE + (random() * 30)::int as due_date
FROM suppliers s
CROSS JOIN raw_materials rm
WHERE s.name IN ('Chemical Suppliers Ltd', 'Raw Materials Co')
AND rm.name IN ('Soda Ash', 'LABSA', 'Plastic Wrapping', 'Boxes')
LIMIT 8;

-- Insert some demo B2C sales
INSERT INTO b2c_sales (product_id, quantity, unit_price, total_amount, sale_date, customer_name)
SELECT 
  p.id,
  (random() * 10 + 1)::int as quantity,
  p.unit_price,
  (random() * 10 + 1)::int * p.unit_price as total_amount,
  CURRENT_DATE - (random() * 7)::int as sale_date,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Walk-in Customer'
    WHEN 1 THEN 'Regular Customer'
    ELSE 'Local Retailer'
  END as customer_name
FROM products p
CROSS JOIN generate_series(1, 15) -- Generate 15 demo sales
LIMIT 15;

-- Insert some demo truck expenses
INSERT INTO truck_expenses (truck_id, expense_date, expense_type, amount, description)
SELECT 
  t.id,
  CURRENT_DATE - (random() * 15)::int as expense_date,
  CASE (random() * 3)::int
    WHEN 0 THEN 'diesel'
    WHEN 1 THEN 'salary'
    ELSE 'repair'
  END as expense_type,
  CASE (random() * 3)::int
    WHEN 0 THEN (random() * 2000 + 1000)::int -- diesel
    WHEN 1 THEN (random() * 5000 + 8000)::int -- salary
    ELSE (random() * 3000 + 500)::int -- repair
  END as amount,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Fuel refill'
    WHEN 1 THEN 'Driver monthly salary'
    ELSE 'Maintenance and repair'
  END as description
FROM trucks t
CROSS JOIN generate_series(1, 3) -- 3 expenses per truck
LIMIT 15;
