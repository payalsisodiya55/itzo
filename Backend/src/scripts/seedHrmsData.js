import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { FoodAdmin } from '../core/admin/admin.model.js';
import { HrmsEmployee } from '../modules/hrms/models/employee.model.js';
import { HrmsAttendance } from '../modules/hrms/models/attendance.model.js';
import { HrmsLeave } from '../modules/hrms/models/leave.model.js';
import { HrmsExpense } from '../modules/hrms/models/expense.model.js';
import { HrmsSalary } from '../modules/hrms/models/salary.model.js';
import { HrmsJoiningRequest } from '../modules/hrms/models/joiningRequest.model.js';
import { config } from '../config/env.js';

// --- DATA DICTIONARIES ---
const firstNames = ['Rahul', 'Priya', 'Amit', 'Neha', 'Ravi', 'Anjali', 'Vikram', 'Pooja', 'Rohit', 'Kavita', 'Sanjay', 'Sneha', 'Arun', 'Swati', 'Manish', 'Kiran', 'Suresh', 'Divya', 'Rajesh', 'Deepa', 'Nitin', 'Shruti', 'Anil', 'Ritu', 'Karan', 'Megha', 'Sunil', 'Preeti', 'Deepak', 'Aarti'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Joshi', 'Mishra', 'Reddy', 'Das', 'Roy', 'Nair', 'Bose', 'Yadav', 'Iyer', 'Menon', 'Pillai', 'Rao', 'Desai', 'Kulkarni', 'Bhatt', 'Mehta', 'Chauhan', 'Thakur', 'Garg'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'];
const streets = ['MG Road', 'Station Road', 'Main Bazar', 'Linking Road', 'Ring Road', 'FC Road', 'Park Street', 'Indira Nagar', 'Anna Salai', 'NH Bypass'];

const departments = [
    { name: 'HR', mgrSalary: 1200000, empSalaryRange: [360000, 600000] },
    { name: 'Finance', mgrSalary: 1400000, empSalaryRange: [400000, 700000] },
    { name: 'Sales', mgrSalary: 1300000, empSalaryRange: [300000, 800000] },
    { name: 'Operations', mgrSalary: 1500000, empSalaryRange: [350000, 600000] },
    { name: 'Technology', mgrSalary: 2000000, empSalaryRange: [500000, 1200000] }
];

const empDesignations = ['Executive', 'Senior Executive', 'Associate', 'Analyst', 'Specialist'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomMath = () => Math.random();

// Generate 12 digit random string
const randomAadhaar = () => Math.random().toString().slice(2, 14);
const randomPAN = () => `${Array(5).fill(0).map(() => String.fromCharCode(65 + Math.random() * 26)).join('')}${randomInt(1000, 9999)}${String.fromCharCode(65 + Math.random() * 26)}`;

async function seedDatabase() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected.');

        console.log('1. Cleaning up existing demo data...');
        // Find all demo FoodAdmins
        const demoAdmins = await FoodAdmin.find({ email: /@itzodemo\.com$/ });
        const demoAdminIds = demoAdmins.map(a => a._id);

        if (demoAdminIds.length > 0) {
            // Find corresponding HrmsEmployees
            const demoEmployees = await HrmsEmployee.find({ adminId: { $in: demoAdminIds } });
            const demoEmpIds = demoEmployees.map(e => e._id);

            await HrmsAttendance.deleteMany({ employeeId: { $in: demoEmpIds } });
            await HrmsLeave.deleteMany({ employeeId: { $in: demoEmpIds } });
            await HrmsExpense.deleteMany({ employeeId: { $in: demoEmpIds } });
            await HrmsSalary.deleteMany({ employeeId: { $in: demoEmpIds } });
            await HrmsEmployee.deleteMany({ _id: { $in: demoEmpIds } });
        }
        await FoodAdmin.deleteMany({ email: /@itzodemo\.com$/ });
        await HrmsJoiningRequest.deleteMany({ email: /@itzodemo\.com$/ });

        console.log('Cleanup complete.');

        // Generate Password
        const salt = await bcrypt.genSalt(config.bcryptSaltRounds || 10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        console.log('2. Generating Managers...');
        let employeeIdCounter = 1000;
        const managers = [];

        for (const dept of departments) {
            const firstName = randomItem(firstNames);
            const lastName = randomItem(lastNames);
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}_mgr@itzodemo.com`;
            
            // Create Admin
            const admin = await FoodAdmin.create({
                email,
                password: 'password_placeholder_bypass',
                name: `${firstName} ${lastName}`,
                phone: `99${randomInt(10000000, 99999999)}`,
                role: 'ADMIN'
            });
            await FoodAdmin.findByIdAndUpdate(admin._id, { password: hashedPassword });

            const city = randomItem(cities);
            
            // Create HrmsEmployee
            const emp = await HrmsEmployee.create({
                adminId: admin._id,
                employeeId: `EMP${employeeIdCounter++}`,
                hrmsRole: 'Manager',
                department: dept.name,
                designation: `${dept.name} Manager`,
                employmentType: 'Full-Time',
                joiningDate: new Date('2023-01-15'),
                officeLocation: city,
                ctc: dept.mgrSalary,
                documents: {
                    aadhaarNumber: randomAadhaar(),
                    panNumber: randomPAN()
                },
                bankDetails: {
                    accountHolderName: `${firstName} ${lastName}`,
                    accountNumber: `301${randomInt(1000000, 9999999)}`,
                    bankName: 'HDFC Bank',
                    ifscCode: 'HDFC0001234'
                },
                address: {
                    street: randomItem(streets),
                    city: city,
                    state: 'State',
                    pincode: '400001'
                },
                qualification: 'MBA',
                experience: '8 Years'
            });
            managers.push(emp);
        }

        console.log('3. Generating Regular Employees...');
        const employees = [];
        for (let i = 0; i < 25; i++) {
            const dept = randomItem(departments);
            const manager = managers.find(m => m.department === dept.name);
            
            let firstName = randomItem(firstNames);
            let lastName = randomItem(lastNames);
            let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@itzodemo.com`;
            
            const admin = await FoodAdmin.create({
                email,
                password: 'password_placeholder', 
                name: `${firstName} ${lastName}`,
                phone: `98${randomInt(10000000, 99999999)}`,
                role: 'ADMIN'
            });

            await FoodAdmin.findByIdAndUpdate(admin._id, { password: hashedPassword });

            const city = manager.address.city;
            const isHr = dept.name === 'HR';
            const ctc = randomInt(dept.empSalaryRange[0], dept.empSalaryRange[1]);

            const emp = await HrmsEmployee.create({
                adminId: admin._id,
                employeeId: `EMP${employeeIdCounter++}`,
                hrmsRole: isHr ? 'HR' : 'Employee',
                department: dept.name,
                designation: randomItem(empDesignations),
                managerId: manager._id,
                employmentType: randomMath() > 0.8 ? 'Intern' : 'Full-Time',
                joiningDate: randomDate(new Date('2024-01-01'), new Date('2025-01-01')),
                officeLocation: city,
                ctc: ctc,
                documents: {
                    aadhaarNumber: randomAadhaar(),
                    panNumber: randomPAN()
                },
                bankDetails: {
                    accountHolderName: `${firstName} ${lastName}`,
                    accountNumber: `301${randomInt(1000000, 9999999)}`,
                    bankName: 'ICICI Bank',
                    ifscCode: 'ICIC0001234'
                },
                address: {
                    street: randomItem(streets),
                    city: city,
                    state: 'State',
                    pincode: '400002'
                },
                qualification: 'B.Tech',
                experience: '3 Years'
            });
            employees.push(emp);
        }

        const allEmployees = [...managers, ...employees];
        console.log(`Generated ${allEmployees.length} total employees.`);

        console.log('4. Generating Attendance...');
        const now = new Date();
        
        for (const emp of allEmployees) {
            for (let d = 1; d <= 15; d++) {
                const date = new Date(now.getFullYear(), now.getMonth(), d);
                if (date.getDay() === 0 || date.getDay() === 6) continue;
                
                const rand = Math.random();
                let status = 'Present';
                let checkIn = new Date(date);
                let checkOut = new Date(date);
                let workingHours = 0;
                
                if (rand > 0.9) {
                    status = 'Absent';
                    checkIn = null;
                    checkOut = null;
                } else if (rand > 0.8) {
                    status = 'Leave';
                    checkIn = null;
                    checkOut = null;
                } else {
                    const inHour = randomInt(9, 10);
                    const inMin = randomInt(0, 59);
                    checkIn.setHours(inHour, inMin);
                    
                    if (rand > 0.7) {
                        checkOut.setHours(inHour + 4, inMin);
                        status = 'Half-Day';
                        workingHours = 4;
                    } else {
                        const outHour = randomInt(18, 19);
                        const outMin = randomInt(0, 59);
                        checkOut.setHours(outHour, outMin);
                        workingHours = outHour - inHour + (outMin - inMin)/60;
                    }
                }

                await HrmsAttendance.create({
                    employeeId: emp._id,
                    date,
                    checkInTime: checkIn,
                    checkOutTime: checkOut,
                    workingHours: Number(workingHours.toFixed(2)),
                    status,
                    regularization: {
                        isRequested: rand > 0.95,
                        status: rand > 0.95 ? 'Pending' : 'Approved'
                    }
                });
            }
        }

        console.log('5. Generating Leaves...');
        for (const emp of allEmployees) {
            const numLeaves = randomInt(0, 3);
            for (let i = 0; i < numLeaves; i++) {
                const start = randomDate(new Date(now.getFullYear(), 0, 1), new Date(now.getFullYear(), 11, 31));
                const end = new Date(start);
                end.setDate(end.getDate() + randomInt(0, 2));
                
                await HrmsLeave.create({
                    employeeId: emp._id,
                    leaveType: randomItem(['Sick Leave', 'Casual Leave', 'Privilege Leave']),
                    startDate: start,
                    endDate: end,
                    totalDays: Math.round((end - start)/(1000*60*60*24)) + 1,
                    reason: 'Personal reasons',
                    status: randomItem(['Pending', 'Approved', 'Rejected'])
                });
            }
        }

        console.log('6. Generating Expenses...');
        for (const emp of allEmployees) {
            if (Math.random() > 0.5) {
                await HrmsExpense.create({
                    employeeId: emp._id,
                    visitDate: new Date(),
                    purpose: 'Client Meeting',
                    travelDistanceKm: 45,
                    travelCost: 500,
                    foodCost: 350,
                    status: randomItem(['Pending', 'Approved', 'Rejected'])
                });
            }
        }

        console.log('7. Generating Salary records...');
        for (const emp of allEmployees) {
            const month = now.getMonth() === 0 ? 12 : now.getMonth();
            const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
            
            await HrmsSalary.create({
                employeeId: emp._id,
                month,
                year,
                baseSalary: emp.monthlySalary,
                totalWorkingDays: 22,
                presentDays: 20,
                paidLeaveDays: 1,
                lopDays: 1,
                absentDays: 0,
                lopDeduction: (emp.monthlySalary / 30) * 1,
                netSalary: emp.monthlySalary - (emp.monthlySalary / 30 * 1),
                status: 'Paid'
            });
        }

        console.log('8. Generating Joining Requests...');
        for (let i = 0; i < 5; i++) {
            await HrmsJoiningRequest.create({
                requestId: `REQ${1000 + i}`,
                fullName: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
                email: `candidate${i}@itzodemo.com`,
                phone: `97${randomInt(10000000, 99999999)}`,
                password: 'password_placeholder',
                status: i < 3 ? 'Pending' : (i === 3 ? 'Approved' : 'Rejected'),
                preferredDepartment: randomItem(departments).name,
                preferredDesignation: 'Executive',
                rejectionReason: i === 4 ? 'Not enough experience' : ''
            });
        }

        console.log('✅ Demo HRMS data seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seedDatabase();
