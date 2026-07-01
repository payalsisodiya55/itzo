/**
 * Seed Script: Support Tickets, Messages, Daily Reports & Settings
 * 
 * Usage: node scripts/seedSupportAndReports.js
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Finds existing HRMS employees (requires at least 2)
 * 3. Creates/updates Support Settings with realistic Indian HR data
 * 4. Creates/updates Daily Report Settings
 * 5. Inserts support tickets with conversations
 * 6. Inserts daily reports with comments
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
import { HrmsEmployee } from '../src/modules/hrms/models/employee.model.js';
import { HrmsSupportTicket } from '../src/modules/hrms/models/supportTicket.model.js';
import { HrmsSupportMessage } from '../src/modules/hrms/models/supportMessage.model.js';
import { HrmsSupportSettings } from '../src/modules/hrms/models/supportSettings.model.js';
import { HrmsDailyReport } from '../src/modules/hrms/models/dailyReport.model.js';
import { HrmsDailyReportComment } from '../src/modules/hrms/models/dailyReportComment.model.js';
import { HrmsDailyReportSettings } from '../src/modules/hrms/models/dailyReportSettings.model.js';
import { getNextSequence } from '../src/modules/hrms/models/counter.model.js';
// FoodAdmin must be imported so mongoose registers the schema for populate()
import '../src/core/admin/admin.model.js';

// ─── HELPERS ─────────────────────────────────────────────────
const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

const log = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);

// ─── SEED SUPPORT SETTINGS ──────────────────────────────────
const seedSupportSettings = async () => {
    const data = {
        hrContact: {
            name: 'Priya Sharma',
            email: 'hr@itzofood.in',
            mobile: '+91 98765 43210',
            companySupportEmail: 'support@itzofood.in',
            companySupportNumber: '+91 80 4567 8900',
            officeAddress: 'Tower B, 4th Floor, Prestige Tech Park, Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560103',
            workingDays: 'Monday to Friday',
            workingHours: '10:00 AM - 07:00 PM IST'
        },
        ticketConfig: {
            categories: [
                'Salary & Payroll',
                'Leave & Attendance',
                'PF & ESI',
                'IT & Equipment',
                'Policy Clarification',
                'Workplace Issue',
                'Transfer Request',
                'Document Request',
                'General Query'
            ],
            priorities: ['Low', 'Medium', 'High', 'Urgent'],
            defaultStatus: 'Open',
            autoReplyMessage: 'Namaste! 🙏 Thank you for reaching out to ITZO HR Support. Your ticket has been received and our HR team will review it within 24 working hours. For urgent matters, please call our support line at +91 80 4567 8900. - ITZO HR Team',
            maxAttachmentSizeMB: 5
        }
    };

    await HrmsSupportSettings.findOneAndUpdate({}, { $set: data }, { upsert: true, new: true });
    log('Support Settings seeded with Indian HR contact info');
};

// ─── SEED DAILY REPORT SETTINGS ─────────────────────────────
const seedDailyReportSettings = async () => {
    const data = {
        requireMetrics: true,
        requireAttachments: false,
        requireTomorrowPlan: true,
        maxAttachments: 5,
        maxUploadSizeMB: 5,
        categories: [
            'General',
            'Restaurant Visit',
            'Client Meeting',
            'Lead Generation',
            'Delivery Ops',
            'Market Research',
            'Training',
            'Documentation',
            'Support'
        ],
        allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf', 'image/webp']
    };

    await HrmsDailyReportSettings.findOneAndUpdate({}, { $set: data }, { upsert: true, new: true });
    log('Daily Report Settings seeded with categories');
};

// ─── SEED SUPPORT TICKETS ───────────────────────────────────
const seedSupportTickets = async (employees) => {
    // Clear old seeded data
    await HrmsSupportMessage.deleteMany({});
    await HrmsSupportTicket.deleteMany({});
    log('Cleared existing support tickets & messages');

    const emp1 = employees[0];
    const emp2 = employees[1] || employees[0];
    const emp3 = employees[2] || employees[0];

    const ticketsData = [
        {
            employeeId: emp1._id,
            subject: 'Salary credited less than expected for June',
            category: 'Salary & Payroll',
            priority: 'High',
            status: 'Open',
            description: 'Hi HR Team,\n\nMy June salary was credited as ₹28,450 but as per my CTC breakup it should be ₹32,000 per month after deductions. The difference of ₹3,550 is not accounted for in the payslip.\n\nCould you please check and confirm? Attaching my appointment letter for reference.\n\nThanks,\n' + (emp1.adminId?.name || 'Employee'),
            daysAgo: 2,
            adminReply: 'Hi,\n\nThank you for bringing this to our notice. We have forwarded this to our payroll team for verification. The discrepancy might be due to the PF contribution adjustment that was applied from this month onwards.\n\nWe\'ll share the detailed breakup within 2 working days.\n\nRegards,\nPriya Sharma\nHR Team',
            unreadByAdmin: true,
            unreadByEmployee: false
        },
        {
            employeeId: emp2._id,
            subject: 'Work from home request - medical reason',
            category: 'Leave & Attendance',
            priority: 'Medium',
            status: 'In Progress',
            description: 'Dear HR,\n\nI have a follow-up appointment at Apollo Hospital, Koramangala on Thursday. Post the procedure, the doctor has advised 3 days rest. I would like to request work from home from Thursday to Monday.\n\nI\'ll be available on calls and Slack during working hours.\n\nPlease approve at your earliest convenience.\n\nRegards,\n' + (emp2.adminId?.name || 'Employee'),
            daysAgo: 5,
            adminReply: 'Hi,\n\nThank you for informing us. Please submit your medical certificate on Keka/HRMS portal and mark the days as "WFH - Medical" in the attendance system.\n\nYour manager has been informed. Wishing you a speedy recovery! 🙏\n\nRegards,\nPriya Sharma',
            unreadByAdmin: false,
            unreadByEmployee: true
        },
        {
            employeeId: emp1._id,
            subject: 'PF account not linked with UAN',
            category: 'PF & ESI',
            priority: 'High',
            status: 'Open',
            description: 'Hello,\n\nI checked my EPFO passbook on the Umang app and my PF contributions from ITZO are not reflecting against my UAN: 1017XXXXXXXX. It seems the company PF account is not linked.\n\nThis is causing issues with my home loan application as the bank requires PF statements.\n\nCan someone from the accounts team help resolve this urgently?\n\nThanks.',
            daysAgo: 1,
            adminReply: null,
            unreadByAdmin: true,
            unreadByEmployee: false
        },
        {
            employeeId: emp3._id,
            subject: 'Laptop replacement request - screen flickering',
            category: 'IT & Equipment',
            priority: 'Medium',
            status: 'Resolved',
            description: 'Hi IT Team,\n\nMy Dell Latitude 5420 (Asset Tag: ITZ-LAP-0234) has been having screen flickering issues for the past week. I\'ve tried updating drivers and adjusting display settings but the issue persists.\n\nIt\'s affecting my productivity during client calls. Request for a replacement or repair.\n\nLocation: Bengaluru Office, Desk B-24\n\nThanks.',
            daysAgo: 10,
            adminReply: 'Hi,\n\nWe\'ve raised a service request with Dell support. In the meantime, a temporary replacement laptop has been arranged. Please collect it from the IT desk (2nd floor) along with your employee ID.\n\nAsset swap form attached.\n\n- IT Support Team',
            unreadByAdmin: false,
            unreadByEmployee: false
        },
        {
            employeeId: emp2._id,
            subject: 'Clarification on new leave encashment policy',
            category: 'Policy Clarification',
            priority: 'Low',
            status: 'Closed',
            description: 'Dear HR,\n\nThe new leave encashment policy circular mentions "earned leaves above 15 days will be encashed at basic salary rate". Could you clarify:\n\n1. Is this per calendar year or financial year?\n2. Does it include carry-forward leaves from 2025?\n3. When is the encashment payout processed?\n\nThank you.',
            daysAgo: 15,
            adminReply: 'Hello,\n\nGreat questions! Here are the clarifications:\n\n1. It\'s per financial year (April to March)\n2. Yes, carry-forward leaves from FY2025 are included in the count\n3. Encashment is processed in the April salary along with the annual increment cycle\n\nThe detailed policy document has been uploaded to the HRMS portal under Company Policies > Leave Policy v3.2.\n\nLet us know if you need anything else!\n\nBest,\nPriya Sharma',
            unreadByAdmin: false,
            unreadByEmployee: false
        },
        {
            employeeId: emp1._id,
            subject: 'Request for experience letter and relieving letter',
            category: 'Document Request',
            priority: 'Low',
            status: 'In Progress',
            description: 'Hi HR Team,\n\nI need the following documents for my housing loan application:\n\n1. Experience Certificate / Employment Verification Letter\n2. Current month salary slip (stamped copy)\n3. Form 16 for AY 2025-26\n\nBank deadline is 15th of this month. Kindly process it as soon as possible.\n\nThank you.',
            daysAgo: 3,
            adminReply: 'Hello,\n\nWe\'ve noted your request. The experience letter and salary slip will be ready by tomorrow. For Form 16, please check your registered email — it was sent on 15th June.\n\nWe\'ll courier the stamped hard copies to your desk.\n\nRegards,\nHR Documentation Team',
            unreadByAdmin: false,
            unreadByEmployee: true
        },
        {
            employeeId: emp3._id,
            subject: 'Cab facility request for late shift',
            category: 'General Query',
            priority: 'Medium',
            status: 'Open',
            description: 'Dear Admin,\n\nI\'ve been assigned to the evening shift (2 PM - 10 PM) starting next week. My home is in Electronic City Phase 2 which is about 18 km from the office.\n\nIs the company cab facility available for the 10 PM drop? If yes, what is the process to register?\n\nAlso, is the food allowance of ₹150/day applicable for evening shift employees?\n\nThanks.',
            daysAgo: 0,
            adminReply: null,
            unreadByAdmin: true,
            unreadByEmployee: false
        }
    ];

    for (const td of ticketsData) {
        const seq = await getNextSequence('supportTicketId');
        const ticketId = `TKT-${String(seq).padStart(4, '0')}`;

        const ticket = new HrmsSupportTicket({
            ticketId,
            employeeId: td.employeeId,
            subject: td.subject,
            category: td.category,
            priority: td.priority,
            status: td.status,
            unreadByAdmin: td.unreadByAdmin,
            unreadByEmployee: td.unreadByEmployee,
            createdAt: daysAgo(td.daysAgo),
            updatedAt: daysAgo(td.daysAgo)
        });
        await ticket.save();

        // Employee's initial message (description)
        const empMsg = new HrmsSupportMessage({
            ticketId: ticket._id,
            senderType: 'Employee',
            senderId: td.employeeId,
            message: td.description,
            attachments: [],
            createdAt: daysAgo(td.daysAgo),
            updatedAt: daysAgo(td.daysAgo)
        });
        await empMsg.save();

        // Admin reply if exists
        if (td.adminReply) {
            const adminMsg = new HrmsSupportMessage({
                ticketId: ticket._id,
                senderType: 'Admin',
                senderId: td.employeeId, // Satisfies required ObjectId; frontend renders by senderType
                message: td.adminReply,
                attachments: [],
                isRead: td.status === 'Closed' || td.status === 'Resolved',
                createdAt: daysAgo(Math.max(0, td.daysAgo - 1)),
                updatedAt: daysAgo(Math.max(0, td.daysAgo - 1))
            });
            await adminMsg.save();
        }
    }

    log(`${ticketsData.length} support tickets with conversations seeded`);
};

// ─── SEED DAILY REPORTS ─────────────────────────────────────
const seedDailyReports = async (employees) => {
    // Clear old seeded data
    await HrmsDailyReportComment.deleteMany({});
    await HrmsDailyReport.deleteMany({});
    log('Cleared existing daily reports & comments');

    const emp1 = employees[0];
    const emp2 = employees[1] || employees[0];
    const emp3 = employees[2] || employees[0];
    const manager = employees.find(e => e.hrmsRole === 'Manager') || emp1;

    const reportsData = [
        {
            employeeId: emp1._id,
            managerId: manager._id,
            reportDate: daysAgo(0),
            status: 'Submitted',
            tasks: [
                { title: 'Visited Meghana Foods, Koramangala for onboarding demo', category: 'Restaurant Visit', status: 'Completed' },
                { title: 'Follow-up call with Paradise Biryani, Indiranagar branch', category: 'Client Meeting', status: 'Completed' },
                { title: 'Prepared onboarding documents for 3 new restaurants', category: 'Documentation', status: 'In Progress' }
            ],
            workSummary: 'Visited 2 restaurants in South Bengaluru zone. Meghana Foods confirmed onboarding for next week. Paradise Biryani requested a revised commission structure — need manager approval. Completed 3 out of 5 onboarding doc sets.',
            metrics: { restaurantsVisited: 2, meetingsConducted: 3, callsMade: 8, leadsGenerated: 1, ordersCompleted: 0 },
            travelSummary: { distanceKm: 45, vehicleUsed: 'Personal Bike (Activa)', travelCost: 225, foodExpense: 180, hotelExpense: 0, otherExpense: 0 },
            achievements: 'Secured verbal confirmation from Meghana Foods for ITZO Food platform onboarding — potential ₹50K/month GMV.',
            problemsFaced: 'Paradise Biryani management is comparing our commission rates with Swiggy/Zomato. Need competitive pricing approval from BD head.',
            pendingWork: 'Complete remaining 2 onboarding document sets and send them for review.',
            tomorrowPlan: 'Visit MTR restaurant, Lalbagh Road and Empire Restaurant, Church Street for new business pitch.',
            remarks: 'Koramangala area has high potential — suggest dedicating a full-time BD exec here.',
            comment: null
        },
        {
            employeeId: emp2._id,
            managerId: manager._id,
            reportDate: daysAgo(0),
            status: 'Submitted',
            tasks: [
                { title: 'Resolved 12 delivery partner escalations from HSR Layout zone', category: 'Support', status: 'Completed' },
                { title: 'Conducted training session for 8 new delivery partners at hub', category: 'Training', status: 'Completed' },
                { title: 'Updated delivery zone mapping for Electronic City Phase 1 & 2', category: 'General', status: 'In Progress' }
            ],
            workSummary: 'Focused on delivery ops support. Handled partner escalations — most were about payment delays. Training session went well, 8/8 partners cleared assessment. Zone mapping for EC Phase 1 is complete, Phase 2 in progress.',
            metrics: { restaurantsVisited: 0, meetingsConducted: 1, callsMade: 15, leadsGenerated: 0, ordersCompleted: 12 },
            travelSummary: { distanceKm: 22, vehicleUsed: 'Company Cab', travelCost: 0, foodExpense: 150, hotelExpense: 0, otherExpense: 50 },
            achievements: 'All 8 new delivery partners cleared onboarding assessment on first attempt — 100% pass rate.',
            problemsFaced: 'Delivery partners in HSR Layout facing GPS accuracy issues in apartment complexes. Need to flag to tech team.',
            pendingWork: 'Complete EC Phase 2 zone mapping by EOD tomorrow.',
            tomorrowPlan: 'Hub visit at Whitefield for delivery partner gear distribution and ride-along with 2 new partners.',
            remarks: '',
            comment: null
        },
        {
            employeeId: emp1._id,
            managerId: manager._id,
            reportDate: daysAgo(1),
            status: 'Approved',
            tasks: [
                { title: 'Meeting with Third Wave Coffee, HSR Layout for partnership', category: 'Client Meeting', status: 'Completed' },
                { title: 'Generated 5 new leads from Indiranagar restaurant walk-ins', category: 'Lead Generation', status: 'Completed' },
                { title: 'Updated CRM with all interactions and follow-up dates', category: 'Documentation', status: 'Completed' }
            ],
            workSummary: 'Productive day in field. Third Wave Coffee meeting went very well — they want to list their food menu (not just beverages) on ITZO. Generated 5 solid leads in Indiranagar — all interested in ITZO Food listing. CRM updated with all notes.',
            metrics: { restaurantsVisited: 6, meetingsConducted: 2, callsMade: 12, leadsGenerated: 5, ordersCompleted: 0 },
            travelSummary: { distanceKm: 38, vehicleUsed: 'Personal Bike (Activa)', travelCost: 190, foodExpense: 250, hotelExpense: 0, otherExpense: 30 },
            achievements: 'Third Wave Coffee partnership deal — premium brand addition to the ITZO platform.',
            problemsFaced: 'Two restaurants in Indiranagar already exclusive with competitor platforms. Need sales team input on counter-offers.',
            pendingWork: 'Send follow-up emails to all 5 new leads.',
            tomorrowPlan: 'Focus on Koramangala zone — target 4 restaurants for demos.',
            remarks: 'Indiranagar has high footfall restaurants but strong competitor presence.',
            comment: {
                senderType: 'Admin',
                message: 'Excellent work! The Third Wave Coffee lead is very promising. Please coordinate with the BD head for the partnership agreement template. 5 leads in one day is outstanding performance. Keep it up! 👏'
            }
        },
        {
            employeeId: emp2._id,
            managerId: manager._id,
            reportDate: daysAgo(1),
            status: 'Approved',
            tasks: [
                { title: 'Audited delivery times for top 20 restaurants in BTM Layout', category: 'Market Research', status: 'Completed' },
                { title: 'Coordinated with kitchen team on order packaging standards', category: 'General', status: 'Completed' },
                { title: 'Conducted mid-month performance review of delivery partners', category: 'Documentation', status: 'Completed' }
            ],
            workSummary: 'Completed delivery time audit for BTM Layout zone. Average delivery time: 32 mins (target: 30 mins). Identified 3 restaurants with consistently high preparation times. Packaging standards meeting was productive.',
            metrics: { restaurantsVisited: 4, meetingsConducted: 2, callsMade: 10, leadsGenerated: 0, ordersCompleted: 20 },
            travelSummary: { distanceKm: 15, vehicleUsed: 'Auto Rickshaw', travelCost: 280, foodExpense: 120, hotelExpense: 0, otherExpense: 0 },
            achievements: 'Identified actionable improvements that can reduce average delivery time by 3-4 minutes in BTM Layout.',
            problemsFaced: 'Some restaurants not following packaging guidelines. Need enforcement mechanism.',
            pendingWork: 'Share audit report with operations head.',
            tomorrowPlan: 'Delivery partner escalation handling and new partner training session.',
            remarks: '',
            comment: {
                senderType: 'Admin',
                message: 'Good analysis on the delivery time audit. Please share the detailed report with the ops team by EOD. The packaging compliance issue needs to be escalated — mark it for the weekly review meeting.'
            }
        },
        {
            employeeId: emp3._id,
            managerId: manager._id,
            reportDate: daysAgo(2),
            status: 'Rejected',
            tasks: [
                { title: 'Office work', category: 'General', status: 'Completed' }
            ],
            workSummary: 'Regular office work.',
            metrics: { restaurantsVisited: 0, meetingsConducted: 0, callsMade: 0, leadsGenerated: 0, ordersCompleted: 0 },
            travelSummary: { distanceKm: 0, vehicleUsed: '', travelCost: 0, foodExpense: 0, hotelExpense: 0, otherExpense: 0 },
            achievements: '',
            problemsFaced: '',
            pendingWork: '',
            tomorrowPlan: 'Will plan accordingly.',
            remarks: '',
            comment: {
                senderType: 'Admin',
                message: 'This report lacks sufficient detail. Please provide specific tasks completed, meetings attended, and measurable outcomes. Resubmit with proper details as per the daily report guidelines shared in the employee handbook.'
            }
        },
        {
            employeeId: emp1._id,
            managerId: manager._id,
            reportDate: daysAgo(3),
            status: 'Approved',
            tasks: [
                { title: 'Onboarded Vidyarthi Bhavan, Basavanagudi to ITZO platform', category: 'Restaurant Visit', status: 'Completed' },
                { title: 'Resolved menu pricing discrepancy for Brahmin\'s Coffee Bar', category: 'Support', status: 'Completed' },
                { title: 'Area-wise competitor analysis report for South Bengaluru', category: 'Market Research', status: 'Completed' }
            ],
            workSummary: 'Successfully onboarded the iconic Vidyarthi Bhavan — this will be great for brand visibility. Fixed pricing issues at Brahmin\'s Coffee Bar. Completed the South Bengaluru competitor analysis — report attached.',
            metrics: { restaurantsVisited: 3, meetingsConducted: 1, callsMade: 6, leadsGenerated: 2, ordersCompleted: 1 },
            travelSummary: { distanceKm: 52, vehicleUsed: 'Personal Bike (Activa)', travelCost: 260, foodExpense: 200, hotelExpense: 0, otherExpense: 40 },
            achievements: 'Onboarded Vidyarthi Bhavan — heritage restaurant with massive brand pull. Expected 200+ orders/month.',
            problemsFaced: 'Basavanagudi area has poor internet connectivity, causing issues with restaurant tablet setup.',
            pendingWork: 'Upload competitor analysis report to shared drive.',
            tomorrowPlan: 'Follow up with 3 pending leads from last week.',
            remarks: 'South Bengaluru is underserved by competitors — good opportunity for expansion.',
            comment: {
                senderType: 'Admin',
                message: 'Vidyarthi Bhavan onboarding is a big win! 🎉 Please ensure their menu photos are professionally taken — coordinate with the content team. Great competitor analysis too.'
            }
        },
        {
            employeeId: emp3._id,
            managerId: manager._id,
            reportDate: daysAgo(1),
            status: 'Revision Requested',
            tasks: [
                { title: 'Attended client call with Adiga\'s restaurant chain', category: 'Client Meeting', status: 'Completed' },
                { title: 'Updated sales pipeline in CRM', category: 'Documentation', status: 'In Progress' }
            ],
            workSummary: 'Had a call with Adiga\'s management about multi-outlet onboarding. They want a bulk deal.',
            metrics: { restaurantsVisited: 0, meetingsConducted: 1, callsMade: 4, leadsGenerated: 0, ordersCompleted: 0 },
            travelSummary: { distanceKm: 0, vehicleUsed: '', travelCost: 0, foodExpense: 0, hotelExpense: 0, otherExpense: 0 },
            achievements: '',
            problemsFaced: '',
            pendingWork: 'Complete CRM updates.',
            tomorrowPlan: 'Continue Adiga\'s follow up.',
            remarks: '',
            comment: {
                senderType: 'Admin',
                message: 'Please add more details about the Adiga\'s call — what was discussed, what are their requirements for bulk onboarding, expected timeline, and pricing expectations. Also mention the specific CRM fields updated.'
            }
        },
        {
            employeeId: emp2._id,
            managerId: manager._id,
            reportDate: daysAgo(3),
            status: 'Approved',
            tasks: [
                { title: 'Coordinated bulk delivery gear distribution at Whitefield hub', category: 'Delivery Ops', status: 'Completed' },
                { title: 'Ride-along with 3 new delivery partners for quality check', category: 'Training', status: 'Completed' },
                { title: 'Submitted weekly ops report to zonal manager', category: 'Documentation', status: 'Completed' },
                { title: 'Resolved payment dispute for partner DP-1847', category: 'Support', status: 'Completed' }
            ],
            workSummary: 'Distributed ITZO-branded delivery bags, helmets and rain gear to 15 delivery partners at Whitefield hub. Did ride-alongs with 3 new partners — all performing well. Weekly ops report submitted. Payment dispute for DP-1847 resolved (was a bank transfer delay, not system issue).',
            metrics: { restaurantsVisited: 2, meetingsConducted: 0, callsMade: 8, leadsGenerated: 0, ordersCompleted: 15 },
            travelSummary: { distanceKm: 35, vehicleUsed: 'Company Cab', travelCost: 0, foodExpense: 200, hotelExpense: 0, otherExpense: 100 },
            achievements: 'Completed gear distribution for entire Whitefield zone — all 15 partners fully equipped.',
            problemsFaced: 'Some delivery bags have quality issues (stitching coming apart). Need to raise with vendor.',
            pendingWork: 'File vendor complaint for defective bags.',
            tomorrowPlan: 'HSR Layout zone — delivery partner escalation handling and training.',
            remarks: 'Whitefield zone delivery fleet is now at full strength with 42 active partners.',
            comment: {
                senderType: 'Admin',
                message: 'Well organized gear distribution! Please document the bag quality issues with photos and raise a formal complaint with the procurement team. Good to see Whitefield at full fleet strength.'
            }
        }
    ];

    for (const rd of reportsData) {
        const report = new HrmsDailyReport({
            employeeId: rd.employeeId,
            managerId: rd.managerId,
            reportDate: rd.reportDate,
            status: rd.status,
            tasks: rd.tasks,
            workSummary: rd.workSummary,
            metrics: rd.metrics,
            travelSummary: rd.travelSummary,
            achievements: rd.achievements,
            problemsFaced: rd.problemsFaced,
            pendingWork: rd.pendingWork,
            tomorrowPlan: rd.tomorrowPlan,
            remarks: rd.remarks,
            submittedAt: rd.status !== 'Draft' ? rd.reportDate : undefined,
            reviewedAt: ['Approved', 'Rejected', 'Revision Requested'].includes(rd.status) ? new Date(rd.reportDate.getTime() + 86400000) : undefined,
            reviewedBy: ['Approved', 'Rejected', 'Revision Requested'].includes(rd.status) ? rd.managerId : undefined,
            createdAt: rd.reportDate,
            updatedAt: rd.reportDate
        });
        await report.save();

        // Add comment if exists
        if (rd.comment) {
            const comment = new HrmsDailyReportComment({
                reportId: report._id,
                senderType: rd.comment.senderType,
                senderId: rd.managerId,
                message: rd.comment.message,
                attachments: [],
                createdAt: new Date(rd.reportDate.getTime() + 3600000 * 4), // 4 hours after report
                updatedAt: new Date(rd.reportDate.getTime() + 3600000 * 4)
            });
            await comment.save();
        }
    }

    log(`${reportsData.length} daily reports with comments seeded`);
};

// ─── MAIN ───────────────────────────────────────────────────
const main = async () => {
    console.log('\n🚀 ITZO HRMS - Support & Daily Reports Seeder\n');
    console.log('━'.repeat(50));

    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ MONGODB_URI not found in .env file');
            process.exit(1);
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        log('Connected to MongoDB');

        // Find existing employees with populated adminId
        const employees = await HrmsEmployee.find({ status: 'Active' })
            .populate('adminId', 'name email phone profileImage')
            .sort({ createdAt: 1 })
            .limit(5)
            .lean();

        if (employees.length === 0) {
            console.error('❌ No active HRMS employees found! Please create employees first.');
            console.error('   Run the employee/HRMS seeder before running this script.');
            process.exit(1);
        }

        console.log(`\n👥 Found ${employees.length} active employees:`);
        employees.forEach((e, i) => {
            console.log(`   ${i + 1}. ${e.adminId?.name || 'Unknown'} (${e.employeeId}) - ${e.department || 'N/A'} - ${e.hrmsRole}`);
        });
        console.log('');

        // Seed everything
        await seedSupportSettings();
        await seedDailyReportSettings();
        await seedSupportTickets(employees);
        await seedDailyReports(employees);

        console.log('\n━'.repeat(50));
        console.log('🎉 All seed data inserted successfully!\n');
        console.log('📊 Summary:');
        console.log('   • Support Settings: ✅ Indian HR contact info');
        console.log('   • Daily Report Settings: ✅ Categories configured');
        console.log('   • Support Tickets: ✅ 7 tickets with conversations');
        console.log('   • Daily Reports: ✅ 8 reports with comments');
        console.log('   • Statuses covered: Open, In Progress, Resolved, Closed, Submitted, Approved, Rejected, Revision Requested');
        console.log('');

    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        log('Disconnected from MongoDB');
    }
};

main();
