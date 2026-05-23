import { normalizePhoneNumber } from '../src/modules/food/user/utils/phone.js';
import {
    validateUserContactImportDto,
    validateUserContactPermissionStatusDto
} from '../src/modules/food/user/validators/userContact.validator.js';

let failed = 0;
let passed = 0;

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${message} (Expected: ${expected}, Got: ${actual})`);
        failed++;
    }
}

function assertThrows(fn, expectedMessageSub, message) {
    try {
        fn();
        console.error(`❌ FAIL: ${message} (Expected error containing: "${expectedMessageSub}", but it succeeded)`);
        failed++;
    } catch (error) {
        if (error.message && error.message.includes(expectedMessageSub)) {
            console.log(`✅ PASS: ${message} (Threw expected error: "${error.message}")`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message} (Expected error containing: "${expectedMessageSub}", but got: "${error.message}")`);
            failed++;
        }
    }
}

console.log("=== RUNNING PHONE NORMALIZATION TESTS ===");
assertEqual(normalizePhoneNumber("+91 98765 43210"), "+919876543210", "Standard with +91 and spaces");
assertEqual(normalizePhoneNumber("+91 (987) 654-3210"), "+919876543210", "Standard with +91, brackets, and dashes");
assertEqual(normalizePhoneNumber("98765-43210"), "+919876543210", "10-digit number with dashes");
assertEqual(normalizePhoneNumber("09876543210"), "+919876543210", "Number starting with 0");
assertEqual(normalizePhoneNumber("919876543210"), "+919876543210", "Number starting with 91 (no plus)");
assertEqual(normalizePhoneNumber("9876543210"), "+919876543210", "Standard 10-digit number");
assertEqual(normalizePhoneNumber("+14155552671"), "+14155552671", "International number starting with +1");
assertEqual(normalizePhoneNumber("123"), null, "Too short");
assertEqual(normalizePhoneNumber("abcdef"), null, "Alphabetical string");
assertEqual(normalizePhoneNumber(12345), null, "Invalid type (number)");

console.log("\n=== RUNNING CONTACT IMPORT VALIDATION TESTS ===");
// Test Valid Import DTO
const validPayload = {
    contacts: [
        { name: "John Doe", phone: "+91 98765-43210" },
        { name: "Alice", phone: "9876543210" }
    ],
    isLastChunk: true
};
try {
    const validated = validateUserContactImportDto(validPayload);
    assertEqual(validated.isLastChunk, true, "Valid import payload - isLastChunk field");
    assertEqual(validated.contacts.length, 2, "Valid import payload - contacts array length");
    assertEqual(validated.contacts[0].name, "John Doe", "Valid import payload - name trimming check");
} catch (e) {
    console.error("❌ FAIL: Valid import payload failed validation:", e.message);
    failed++;
}

// Test Invalid Import: Empty Contacts
assertThrows(
    () => validateUserContactImportDto({ contacts: [], isLastChunk: false }),
    "At least one contact is required",
    "Import payload: Empty contacts array"
);

// Test Invalid Import: Batch size limit exceeded (501 items)
const excessiveContacts = Array.from({ length: 501 }, (_, i) => ({
    name: `User ${i}`,
    phone: "9876543210"
}));
assertThrows(
    () => validateUserContactImportDto({ contacts: excessiveContacts, isLastChunk: true }),
    "Batch size exceeds the maximum limit of 500 contacts",
    "Import payload: Over 500 contacts batch limit"
);

// Test Invalid Import: Missing name in item
assertThrows(
    () => validateUserContactImportDto({
        contacts: [{ name: "", phone: "9876543210" }],
        isLastChunk: true
    }),
    "Contact name is required",
    "Import payload item: Missing contact name"
);

// Test Invalid Import: Phone too long
assertThrows(
    () => validateUserContactImportDto({
        contacts: [{ name: "Test User", phone: "a".repeat(51) }],
        isLastChunk: true
    }),
    "Contact phone is too long",
    "Import payload item: Contact phone exceeds max length"
);

// Test Invalid Import: Missing isLastChunk
assertThrows(
    () => validateUserContactImportDto({
        contacts: [{ name: "Test User", phone: "9876543210" }]
    }),
    "isLastChunk is required",
    "Import payload: Missing isLastChunk boolean field"
);

console.log("\n=== RUNNING PERMISSION STATUS VALIDATION TESTS ===");
// Test Valid Statuses
try {
    const deniedVal = validateUserContactPermissionStatusDto({ status: "DENIED" });
    assertEqual(deniedVal.status, "DENIED", "Valid permission status: DENIED");

    const skippedVal = validateUserContactPermissionStatusDto({ status: "SKIPPED" });
    assertEqual(skippedVal.status, "SKIPPED", "Valid permission status: SKIPPED");
} catch (e) {
    console.error("❌ FAIL: Valid status payload failed validation:", e.message);
    failed++;
}

// Test Invalid Statuses
assertThrows(
    () => validateUserContactPermissionStatusDto({ status: "ALLOWED" }),
    "Status must be either DENIED or SKIPPED",
    "Permission status: ALLOWED should be rejected"
);

assertThrows(
    () => validateUserContactPermissionStatusDto({ status: "PENDING" }),
    "Status must be either DENIED or SKIPPED",
    "Permission status: PENDING should be rejected"
);

assertThrows(
    () => validateUserContactPermissionStatusDto({ status: "INVALID" }),
    "Status must be either DENIED or SKIPPED",
    "Permission status: Arbitrary string should be rejected"
);

console.log(`\n=== TESTS SUMMARY ===`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
