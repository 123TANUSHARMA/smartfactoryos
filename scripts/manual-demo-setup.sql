-- Manual Demo User Setup
-- Run this in your Supabase SQL Editor if demo login is still not working

-- First, let's clean up any existing demo user
DELETE FROM auth.users WHERE email = 'owner@detergent.com';
DELETE FROM users WHERE email = 'owner@detergent.com';

-- Wait a moment (you might need to run the next part separately)

-- Create the demo user manually in auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'owner@detergent.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Business Owner", "role": "owner"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE
);

-- Get the user ID we just created
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'owner@detergent.com';
    
    -- Insert into our users table
    INSERT INTO users (id, email, name, role) 
    VALUES (user_id, 'owner@detergent.com', 'Business Owner', 'owner')
    ON CONFLICT (email) DO UPDATE SET
        name = 'Business Owner',
        role = 'owner';
        
    RAISE NOTICE 'Demo user created with ID: %', user_id;
END $$;
