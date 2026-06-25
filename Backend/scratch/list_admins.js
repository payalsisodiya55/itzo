import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { FoodAdmin } from '../src/core/admin/admin.model.js';
import { AdminRole } from '../src/core/admin/role.model.js';

dotenv.config({ path: 'e:/itzo folder/itzo/Backend/.env' });

async function run() {
    await connectDB();
    const admins = await FoodAdmin.find().populate('adminRoleId').lean();
    console.log("=== ADMINS IN DB ===");
    admins.forEach(a => console.log(JSON.stringify({
        _id: a._id,
        email: a.email,
        role: a.role,
        isActive: a.isActive,
        adminRole: a.adminRoleId ? {
            name: a.adminRoleId.name,
            status: a.adminRoleId.status,
            permissions: a.adminRoleId.permissions
        } : null
    }, null, 2)));
    await disconnectDB();
}

run().catch(console.error);
