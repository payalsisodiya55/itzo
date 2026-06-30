import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import { FoodAdmin } from './src/core/admin/admin.model.js';
import { HrmsEmployee } from './src/modules/hrms/models/employee.model.js';
import { HrmsDailyReport } from './src/modules/hrms/models/dailyReport.model.js';
import { HrmsDailyReportComment } from './src/modules/hrms/models/dailyReportComment.model.js';
import { HrmsSupportTicket } from './src/modules/hrms/models/supportTicket.model.js';
import { HrmsSupportMessage } from './src/modules/hrms/models/supportMessage.model.js';

// Setup environment first if needed. In this project, env.js initializes dotenv.
import './src/config/env.js'; 

const runSeed = async () => {
    try {
        console.log('Connecting to DB...');
        await connectDB();
        console.log('Connected.');

        console.log('Generating HRMS Dummy Data...');

        // 1. Create Admins (if not exist)
        let mainAdmin = await FoodAdmin.findOne({ email: 'admin@itzofood.com' });
        if (!mainAdmin) {
            console.log('Creating main admin...');
            mainAdmin = new FoodAdmin({
                name: 'ECS Super Admin',
                email: 'admin@itzofood.com',
                password: 'hashed_password_placeholder', // Usually created via proper flow, just for reference
                phone: '9999999999',
                status: 'Active',
            });
            await mainAdmin.save();
        }

        let hrManager1 = await FoodAdmin.findOne({ email: 'hrmanager1@itzofood.com' });
        if (!hrManager1) {
            console.log('Creating HR Manager 1...');
            hrManager1 = new FoodAdmin({
                name: 'Rahul Sharma',
                email: 'hrmanager1@itzofood.com',
                password: 'password123', 
                phone: '9876543210',
                status: 'Active',
            });
            await hrManager1.save();
        }

        let techManager = await FoodAdmin.findOne({ email: 'techmanager@itzofood.com' });
        if (!techManager) {
            console.log('Creating Tech Manager...');
            techManager = new FoodAdmin({
                name: 'Priya Verma',
                email: 'techmanager@itzofood.com',
                password: 'password123',
                phone: '9876543211',
                status: 'Active',
            });
            await techManager.save();
        }

        // 2. Create Employees
        const dummyEmployees = [
            { name: 'Amit Kumar', email: 'amit@itzofood.com', dept: 'Sales', manager: hrManager1 },
            { name: 'Sneha Gupta', email: 'sneha@itzofood.com', dept: 'Tech', manager: techManager },
            { name: 'Ravi Singh', email: 'ravi@itzofood.com', dept: 'Operations', manager: hrManager1 },
            { name: 'Pooja Patel', email: 'pooja@itzofood.com', dept: 'Tech', manager: techManager },
            { name: 'Vikram Joshi', email: 'vikram@itzofood.com', dept: 'Delivery', manager: hrManager1 }
        ];

        const employeeIds = [];
        for (const emp of dummyEmployees) {
            let employeeAdmin = await FoodAdmin.findOne({ email: emp.email });
            if (!employeeAdmin) {
                employeeAdmin = new FoodAdmin({
                    name: emp.name,
                    email: emp.email,
                    password: 'password123',
                    phone: `900000000${employeeIds.length}`,
                    status: 'Active'
                });
                await employeeAdmin.save();
            }

            let hrmsEmp = await HrmsEmployee.findOne({ adminId: employeeAdmin._id });
            if (!hrmsEmp) {
                hrmsEmp = new HrmsEmployee({
                    adminId: employeeAdmin._id,
                    managerId: emp.manager._id,
                    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
                    department: emp.dept,
                    designation: 'Executive',
                    status: 'Active',
                    joiningDate: new Date()
                });
                await hrmsEmp.save();
                console.log(`Created employee: ${emp.name}`);
            }
            employeeIds.push(hrmsEmp);
        }

        // 3. Create Daily Reports
        console.log('Generating Daily Reports...');
        const statuses = ['Draft', 'Submitted', 'Approved', 'Rejected', 'Revision Requested'];
        for (const hrmsEmp of employeeIds) {
            const reportCount = await HrmsDailyReport.countDocuments({ employeeId: hrmsEmp._id });
            if (reportCount < 3) {
                for (let i=0; i<3; i++) {
                    const reportDate = new Date();
                    reportDate.setDate(reportDate.getDate() - i);
                    reportDate.setUTCHours(0,0,0,0);
                    
                    const status = statuses[Math.floor(Math.random() * statuses.length)];
                    const report = new HrmsDailyReport({
                        employeeId: hrmsEmp._id,
                        managerId: hrmsEmp.managerId,
                        reportDate,
                        status: status,
                        workSummary: 'Completed all assigned tasks for the day including client calls and follow-ups.',
                        tasks: [
                            { title: 'Client Meeting', category: 'Meeting', status: 'Completed' },
                            { title: 'Weekly Report', category: 'Documentation', status: 'In Progress' }
                        ],
                        metrics: { restaurantsVisited: Math.floor(Math.random() * 5), callsMade: Math.floor(Math.random() * 20) },
                        travelSummary: { distanceKm: Math.floor(Math.random() * 50), travelCost: Math.floor(Math.random() * 500) },
                        tomorrowPlan: 'Follow up with 5 new clients.'
                    });
                    await report.save();

                    // Add a comment
                    if (status !== 'Draft' && status !== 'Submitted') {
                        const comment = new HrmsDailyReportComment({
                            reportId: report._id,
                            senderId: hrmsEmp.managerId,
                            senderType: 'Manager',
                            message: status === 'Rejected' ? 'Please fix the metrics.' : 'Good progress. Please focus on the documentation tomorrow.'
                        });
                        await comment.save();
                    }
                }
            }
        }

        // 4. Create Support Tickets
        console.log('Generating Support Tickets...');
        const categories = ['Payroll', 'IT Support', 'Leave', 'Expense', 'Other'];
        const ticketStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
        
        for (const hrmsEmp of employeeIds) {
            const ticketCount = await HrmsSupportTicket.countDocuments({ employeeId: hrmsEmp._id });
            if (ticketCount === 0) {
                const status = ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)];
                const ticket = new HrmsSupportTicket({
                    ticketId: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
                    employeeId: hrmsEmp._id,
                    subject: 'Issue with recent payslip',
                    category: categories[Math.floor(Math.random() * categories.length)],
                    priority: 'Medium',
                    status: status
                });
                await ticket.save();

                // Employee message
                const msg1 = new HrmsSupportMessage({
                    ticketId: ticket._id,
                    senderId: hrmsEmp._id,
                    senderType: 'Employee',
                    message: 'Hello, my travel allowance seems incorrect for last month.'
                });
                await msg1.save();

                // Admin reply
                if (status !== 'Open' && status !== 'Waiting for Employee') {
                    const msg2 = new HrmsSupportMessage({
                        ticketId: ticket._id,
                        senderId: mainAdmin._id,
                        senderType: 'Admin',
                        message: 'Checking this right away. Can you attach your expense receipts?'
                    });
                    await msg2.save();
                }
            }
        }

        console.log('Dummy data generation complete!');
        await disconnectDB();
        process.exit(0);

    } catch (error) {
        console.error('Error during seed:', error);
        process.exit(1);
    }
};

runSeed();
