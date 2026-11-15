import { Pool } from "pg";

export const pool = new Pool({
    connectionString:  process.env.CONNECTION_STRING,
})

export const initDB = async () => {
    try {
        //create users table 
        await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'technician', 'admin')),

    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     );
            `)

        //Create Service table 

        await pool.query(`
        CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
        `)

        // Create tehnical table 
        await pool.query(`
      CREATE TABLE  IF NOT EXISTS technician_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,

    experience TEXT,
    address TEXT,
    bio TEXT,

    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);  
        `);

        //create bookings table 
        await pool.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    customer_id UUID NOT NULL
    REFERENCES users(id),

    technician_id UUID
    REFERENCES technician_profiles(id),

    service_id UUID NOT NULL
    REFERENCES services(id),

    scheduled_at TIMESTAMP NOT NULL,
    address TEXT NOT NULL,
    description TEXT,

    status VARCHAR(30) DEFAULT 'pending'
    CHECK (status IN (
        'pending',
        'accepted',
        'rejected',
        'in_progress',
        'completed',
        'cancelled'
    )),

    total_price NUMERIC(10,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);  
    `)

        //-- 5. PAYMENTS TABLE
        await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID UNIQUE NOT NULL
    REFERENCES bookings(id),

    amount NUMERIC(10,2) NOT NULL,

    payment_method VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('online', 'cash')),

    payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN (
        'pending',
        'paid',
        'failed',
        'refunded'
    )),

    transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
  
        `);
    
         // ADDITIONAL PAYMENT COLUMNS
        // Required for SSLCommerz verification

        await pool.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS validation_id VARCHAR(255);
        `);

        await pool.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

    //review table 

    await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID UNIQUE NOT NULL
    REFERENCES bookings(id),

    customer_id UUID NOT NULL
    REFERENCES users(id),

    rating INTEGER NOT NULL
    CHECK (rating BETWEEN 1 AND 5),

    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);    
        `)
        console.log(' database connected successfully ');
    } catch (error) {
            console.error("Database initialization failed:", error);
    throw error;
    }
}
