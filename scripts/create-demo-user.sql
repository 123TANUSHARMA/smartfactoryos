-- This script creates a demo user in Supabase Auth
-- Run this in your Supabase SQL editor if the demo login isn't working

-- First, let's check if the user already exists
DO $$
BEGIN
    -- Insert demo user into auth.users if it doesn't exist
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
        reauthentication_sent_at
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
        NULL
    ) ON CONFLICT (email) DO NOTHING;

    -- Also insert into our users table
    INSERT INTO users (email, name, role) 
    VALUES ('owner@detergent.com', 'Business Owner', 'owner')
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Demo user setup completed';
END $$;
