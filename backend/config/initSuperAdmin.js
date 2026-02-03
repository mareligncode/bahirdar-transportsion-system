import User from '../models/Users.js';

export const initSuperAdmin = async () => {
    try {
        const existingSuperAdmin = await User.findOne({
            email: process.env.SUPER_ADMIN_EMAIL
        });

        if (!existingSuperAdmin) {
            console.log('Creating initial super admin...');
            const superAdmin = new User({
                fullName: process.env.SUPER_ADMIN_NAME || 'System Super Admin',
                email: process.env.SUPER_ADMIN_EMAIL,
                phoneNumber: process.env.SUPER_ADMIN_PHONE || '+251900000000',
                password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!',
                role: 'super_admin',
                isActive: true
            });

            await superAdmin.save();
            console.log(' Initial super admin created successfully!');
            console.log(`Email: ${process.env.SUPER_ADMIN_EMAIL}`);
            console.log('Please change the password after first login.');
        } else {
            console.log('Super admin already exists in database.');
        }
    } catch (error) {
        console.error('Error creating super admin:', error.message);
        process.exit(1);
    }
};
export default initSuperAdmin