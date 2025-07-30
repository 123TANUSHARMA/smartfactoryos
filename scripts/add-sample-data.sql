-- Add sample machine maintenance records
INSERT INTO machine_maintenance (machine_id, maintenance_date, cost, description, maintenance_type)
SELECT 
  m.id,
  CURRENT_DATE - (random() * 30)::int,
  (random() * 5000 + 1000)::int,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Regular cleaning and lubrication'
    WHEN 1 THEN 'Belt replacement and adjustment'
    WHEN 2 THEN 'Motor repair and maintenance'
    ELSE 'General inspection and tune-up'
  END,
  CASE (random() * 2)::int
    WHEN 0 THEN 'routine'
    ELSE 'repair'
  END
FROM machines m
CROSS JOIN generate_series(1, 3)
LIMIT 12;

-- Add sample B2B sales
INSERT INTO b2b_sales (party_id, product_id, quantity, unit_price, total_amount, amount_paid, remaining_amount, sale_date, due_date, status)
SELECT 
  p.id,
  pr.id,
  (random() * 100 + 10)::int,
  pr.unit_price,
  (random() * 100 + 10)::int * pr.unit_price,
  CASE (random() * 3)::int
    WHEN 0 THEN (random() * 100 + 10)::int * pr.unit_price -- full payment
    WHEN 1 THEN ((random() * 100 + 10)::int * pr.unit_price) * 0.5 -- partial payment
    ELSE 0 -- no payment
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 0 -- full payment
    WHEN 1 THEN ((random() * 100 + 10)::int * pr.unit_price) * 0.5 -- partial payment
    ELSE (random() * 100 + 10)::int * pr.unit_price -- no payment
  END,
  CURRENT_DATE - (random() * 60)::int,
  CURRENT_DATE + (random() * 30)::int,
  CASE (random() * 3)::int
    WHEN 0 THEN 'paid'
    WHEN 1 THEN 'partial'
    ELSE 'pending'
  END
FROM b2b_parties p
CROSS JOIN products pr
LIMIT 20;

-- Add sample partner withdrawals
INSERT INTO partner_withdrawals (partner_name, amount, withdrawal_date, description)
VALUES
('owner', 25000, CURRENT_DATE - 5, 'Monthly personal expenses'),
('brother', 20000, CURRENT_DATE - 3, 'Monthly personal expenses'),
('owner', 15000, CURRENT_DATE - 15, 'Business investment'),
('brother', 12000, CURRENT_DATE - 12, 'Family expenses'),
('owner', 30000, CURRENT_DATE - 25, 'Equipment purchase'),
('brother', 18000, CURRENT_DATE - 20, 'Personal expenses'),
('owner', 22000, CURRENT_DATE - 35, 'Monthly withdrawal'),
('brother', 16000, CURRENT_DATE - 30, 'Monthly withdrawal');
