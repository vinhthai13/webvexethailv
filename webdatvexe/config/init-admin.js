const db = require('./database');

async function createAdmin() {
    try {
        // Check if admin exists in admins table
        const checkQuery = 'SELECT * FROM admins WHERE username = "admin"';
        const [admins] = await db.query(checkQuery);

        if (admins.length === 0) {
            // Add admin to admins table with plain password
            const insertQuery = `
                INSERT INTO admins (username, password, email, full_name, phone, is_super_admin)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            await db.query(insertQuery, [
                'admin',
                'admin123', // Plain password
                'admin@example.com',
                'System Admin',
                '0123456789',
                1 // is_super_admin
            ]);
            console.log('Admin account created successfully');
        } else {
            console.log('Admin account already exists');
        }
    } catch (err) {
        console.error('Error creating admin:', err);
    }
}

// Run function
createAdmin(); 