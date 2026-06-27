import mongoose from 'mongoose';

const hrmsEmployeeSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodAdmin',
            required: true,
            unique: true
        },
        employeeId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        
        // 1. Professional Details
        department: { type: String, trim: true },
        designation: { type: String, trim: true },
        managerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'HrmsEmployee' 
        },
        employmentType: { 
            type: String, 
            enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'], 
            default: 'Full-Time' 
        },
        joiningDate: { type: Date, required: true },
        shift: { type: String, default: 'General' },
        officeLocation: { type: String, trim: true },
        zone: { type: String, trim: true },

        // 2. Compensation
        ctc: { type: Number, default: 0 },
        monthlySalary: { type: Number, default: 0 },

        // 3. KYC & Documents
        documents: {
            aadhaarNumber: { type: String, trim: true },
            aadhaarPhotoUrl: { type: String },
            panNumber: { type: String, trim: true },
            panPhotoUrl: { type: String },
            offerLetterUrl: { type: String },
            otherDocuments: [{
                name: { type: String },
                url: { type: String }
            }]
        },

        // 4. Bank Details
        bankDetails: {
            accountHolderName: { type: String, trim: true },
            accountNumber: { type: String, trim: true },
            bankName: { type: String, trim: true },
            ifscCode: { type: String, trim: true },
            upiId: { type: String, trim: true }
        },

        // 5. Personal & Emergency
        address: { type: String, trim: true },
        emergencyContact: {
            name: { type: String, trim: true },
            relation: { type: String, trim: true },
            phone: { type: String, trim: true }
        },

        status: {
            type: String,
            enum: ['Active', 'Suspended', 'Resigned', 'Terminated'],
            default: 'Active'
        }
    },
    {
        timestamps: true,
        collection: 'hrms_employees'
    }
);

// Indexes for fast querying
hrmsEmployeeSchema.index({ adminId: 1 });
hrmsEmployeeSchema.index({ managerId: 1 });
hrmsEmployeeSchema.index({ employeeId: 1 });

export const HrmsEmployee = mongoose.model('HrmsEmployee', hrmsEmployeeSchema, 'hrms_employees');
