# Deployment Instructions

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

## Database Setup (Supabase)

1. Create a new Supabase project
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `scripts/database-schema.sql`
4. Run the SQL script to create all tables and initial data
5. **Optional**: Run `scripts/seed-demo-data.sql` to add sample data for testing
6. Go to Settings > API to get your project URL and API keys
7. **Important**: Make sure to enable Row Level Security (RLS) in your Supabase project for production use

## Authentication Setup

The application now supports both signup and login:

1. **First Time Setup**: Use the signup form to create your owner account
2. **Demo Account**: A demo owner account is created automatically:
   - Email: owner@detergent.com
   - Password: password123
3. **Staff Accounts**: Additional staff members can sign up and select "Staff" role

## Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   \`\`\`

## Local Development

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

## Default Login Credentials

After running the database schema, you can either:
- Create a new account using the signup form
- Use the demo credentials: owner@detergent.com / password123

## Features Included

✅ **Raw Material Procurement & Expense Tracking**
- Upload daily records of raw materials purchased
- Track amount paid vs. remaining payment
- Multiple supplier management

✅ **Dashboard Overview**
- Daily summary: total money spent and earned
- Monthly overview: income, expense, profit/loss
- Real-time statistics

✅ **Authentication System**
- Owner and staff roles
- Secure login with Supabase Auth

## Remaining Features to Implement

The following features are partially implemented and need completion:

- **Machinery Maintenance System**
- **Truck Operations & Fleet Management**
- **B2B Sales & Payment Management**
- **B2C Retail Transactions**
- **Partner Share Management**
- **Advanced Financial Reports**
- **Charts and Analytics**

## Database Schema

The application uses a normalized PostgreSQL schema with proper foreign key relationships:

- `users` - Authentication and user management
- `suppliers` - Supplier information
- `raw_materials` - Material catalog
- `raw_material_purchases` - Purchase records
- `machines` - Machinery catalog
- `machine_maintenance` - Maintenance records
- `trucks` - Fleet management
- `truck_expenses` - Truck operational costs
- `b2b_parties` - Business customers
- `products` - Product catalog
- `b2b_sales` - Business-to-business sales
- `b2c_sales` - Direct customer sales
- `partner_withdrawals` - Partner financial tracking

## Support

For issues or questions, please check the documentation or create an issue in the repository.
