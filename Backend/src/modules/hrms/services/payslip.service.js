import puppeteer from 'puppeteer';
import { HrmsSalary } from '../models/salary.model.js';
import { HrmsEmployee } from '../models/employee.model.js';
import { HrmsSettings } from '../models/settings.model.js';
import { uploadPdfBuffer } from '../../../services/cloudinary.service.js';

/**
 * Generate HTML template for payslip
 */
const generatePayslipHtml = (salary, employee, settings) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[salary.month - 1];
    
    // Mask account number
    const acctStr = employee.accountNumber || '';
    const maskedAccount = acctStr.length > 4 ? `XXXX-XXXX-${acctStr.slice(-4)}` : (acctStr || 'N/A');

    const companyName = settings?.companyInfo?.companyName || 'ItzoFood';
    const companyAddress = settings?.companyInfo?.companyAddress || '123 Tech Park, Bangalore, India';
    const companyLogo = settings?.companyInfo?.companyLogoUrl || '';
    const currency = settings?.companyInfo?.currencySymbol || '₹';

    const totalDeductions = (salary.shortHourDeduction || 0) + (salary.lopDeduction || 0);
    const totalAllowances = (salary.overtimeBonus || 0) + (salary.reimbursements || 0);
    const basePayForDays = salary.netSalary - totalAllowances + totalDeductions;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; font-size: 11px; color: #334155; margin: 0; padding: 40px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0 0 5px 0; color: #0f172a; font-size: 24px; font-weight: 700; }
            .company-info p { margin: 0; color: #64748b; font-size: 12px; }
            .logo { max-height: 50px; max-width: 150px; }
            .payslip-title { text-align: center; font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px; }
            
            .grid-2 { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 30px; }
            .info-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            .info-title { background: #f8fafc; padding: 8px 12px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
            .info-content { padding: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
            .info-item { display: flex; flex-direction: column; }
            .info-label { color: #64748b; font-size: 10px; text-transform: uppercase; }
            .info-value { font-weight: 500; color: #0f172a; }
            
            .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .salary-table th, .salary-table td { padding: 10px 12px; border: 1px solid #e2e8f0; text-align: left; }
            .salary-table th { background: #f8fafc; font-weight: 600; color: #0f172a; font-size: 11px; }
            .salary-table td.amount { text-align: right; font-family: monospace; font-size: 12px; }
            .salary-table tr.total th { background: #f1f5f9; font-weight: 700; font-size: 12px; }
            .salary-table tr.total td { background: #f1f5f9; font-weight: 700; text-align: right; font-family: monospace; font-size: 12px; }
            
            .net-pay-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 40px; }
            .net-pay-title { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 5px; }
            .net-pay-amount { font-size: 28px; font-weight: 700; color: #10b981; }
            
            .footer { text-align: center; color: #94a3b8; font-size: 10px; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 50px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-info">
                <h1>${companyName}</h1>
                <p>${companyAddress}</p>
            </div>
            ${companyLogo ? `<img src="${companyLogo}" alt="Company Logo" class="logo" />` : ''}
        </div>
        
        <div class="payslip-title">Payslip for the month of ${monthName} ${salary.year}</div>
        
        <div class="grid-2">
            <div class="info-box">
                <div class="info-title">Employee Details</div>
                <div class="info-content">
                    <div class="info-item">
                        <span class="info-label">Employee ID</span>
                        <span class="info-value">${employee.employeeId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Name</span>
                        <span class="info-value">${employee.adminId?.name || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Designation</span>
                        <span class="info-value">${employee.designation || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Department</span>
                        <span class="info-value">${employee.department || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Date of Joining</span>
                        <span class="info-value">${employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="info-box">
                <div class="info-title">Financial & Attendance Details</div>
                <div class="info-content">
                    <div class="info-item">
                        <span class="info-label">PAN</span>
                        <span class="info-value">${employee.documents?.panNumber || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Bank Name</span>
                        <span class="info-value">${employee.bankName || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Account No</span>
                        <span class="info-value">${maskedAccount}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Days</span>
                        <span class="info-value">${salary.totalWorkingDays}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Paid Days</span>
                        <span class="info-value">${salary.presentDays + salary.paidLeaveDays}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">LOP / Absent Days</span>
                        <span class="info-value">${salary.lopDays + salary.absentDays}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <table class="salary-table">
            <thead>
                <tr>
                    <th style="width: 35%">Earnings</th>
                    <th style="width: 15%">Amount</th>
                    <th style="width: 35%">Deductions</th>
                    <th style="width: 15%">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Basic Pay (Prorated)</td>
                    <td class="amount">${currency}${basePayForDays.toLocaleString()}</td>
                    <td>Loss of Pay (LOP)</td>
                    <td class="amount">${currency}${(salary.lopDeduction || 0).toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Overtime Bonus</td>
                    <td class="amount">${currency}${(salary.overtimeBonus || 0).toLocaleString()}</td>
                    <td>Short Hour Deduction</td>
                    <td class="amount">${currency}${(salary.shortHourDeduction || 0).toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Reimbursements</td>
                    <td class="amount">${currency}${(salary.reimbursements || 0).toLocaleString()}</td>
                    <td></td>
                    <td class="amount"></td>
                </tr>
                <!-- Padding row to make things even -->
                <tr>
                    <td></td><td class="amount"></td>
                    <td></td><td class="amount"></td>
                </tr>
                <tr class="total">
                    <th>Total Earnings</th>
                    <td>${currency}${(basePayForDays + totalAllowances).toLocaleString()}</td>
                    <th>Total Deductions</th>
                    <td>${currency}${totalDeductions.toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="net-pay-box">
            <div class="net-pay-title">Net Payable Amount</div>
            <div class="net-pay-amount">${currency}${salary.netSalary.toLocaleString()}</div>
        </div>
        
        <div class="footer">
            <p>This is a system-generated payslip and does not require a physical signature.</p>
            <p>Generated on: ${new Date().toLocaleString()} (Version: ${salary.payslipVersion || 1})</p>
        </div>
    </body>
    </html>
    `;
};

/**
 * Generate PDF buffer for a salary record
 */
export const generatePayslipPdf = async (salaryId) => {
    let browser = null;
    try {
        const salary = await HrmsSalary.findById(salaryId).populate({
            path: 'employeeId',
            populate: { path: 'adminId', select: 'name email' }
        });

        if (!salary) throw new Error('Salary record not found');

        const settings = await HrmsSettings.findOne().lean();
        const html = generatePayslipHtml(salary, salary.employeeId, settings);

        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });
        
        await browser.close();

        const pdfUrl = await uploadPdfBuffer(pdfBuffer, 'hrms/payslips');

        salary.payslipUrl = pdfUrl;
        salary.payslipVersion = (salary.payslipVersion || 0) + 1;
        salary.payslipGeneratedAt = new Date();
        await salary.save();

        return salary;
    } catch (error) {
        console.error('Payslip PDF Generation Error:', error);
        if (browser) await browser.close();
        throw error;
    }
};

/**
 * Background worker to generate PDFs for multiple salaries
 */
export const generateBulkPayslipsBackground = async (salaryIds) => {
    // Generate sequentially to avoid spawning too many Puppeteer instances
    for (const id of salaryIds) {
        try {
            await generatePayslipPdf(id);
        } catch (error) {
            console.error(`Failed to generate payslip for salary ${id}:`, error);
        }
    }
};
