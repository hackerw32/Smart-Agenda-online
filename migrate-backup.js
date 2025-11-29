#!/usr/bin/env node

/**
 * Migration Script for SmartAgenda Backup Files
 *
 * This script updates old backup files to be compatible with the new app version.
 *
 * Changes:
 * 1. Clients: Add clientTypes and primaryType based on categories/customerType
 * 2. Appointments: Add status field, update payment tracking (paid/amountPaid)
 * 3. Tasks: Ensure referenceCode and checklist fields exist
 * 4. General: Update version metadata
 */

const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = process.argv[2] || 'backup-2025-11-15.json';
const OUTPUT_FILE = process.argv[3] || 'backup-2025-11-15-migrated.json';

console.log('SmartAgenda Backup Migration Tool');
console.log('==================================\n');
console.log(`Input:  ${INPUT_FILE}`);
console.log(`Output: ${OUTPUT_FILE}\n`);

// Read the backup file
let data;
try {
    const fileContent = fs.readFileSync(INPUT_FILE, 'utf8');
    data = JSON.parse(fileContent);
    console.log('✓ Successfully loaded backup file');
} catch (error) {
    console.error('✗ Error reading backup file:', error.message);
    process.exit(1);
}

// Migration counters
const stats = {
    clients: { total: 0, updated: 0 },
    appointments: { total: 0, updated: 0 },
    tasks: { total: 0, updated: 0 }
};

// ============================================================================
// CLIENT MIGRATION
// ============================================================================

function migrateClient(client) {
    let updated = false;

    // Convert old categories to new clientTypes system
    if (!client.clientTypes) {
        // Initialize clientTypes array
        client.clientTypes = [];

        // Copy existing categories (excluding customerType)
        if (client.categories && Array.isArray(client.categories)) {
            client.clientTypes = [...client.categories];
        }

        updated = true;
    }

    // Set primaryType based on customerType or first category
    if (!client.primaryType) {
        if (client.customerType) {
            client.primaryType = client.customerType;
        } else if (client.clientTypes && client.clientTypes.length > 0) {
            client.primaryType = client.clientTypes[0];
        } else {
            client.primaryType = 'existing'; // Default
        }
        updated = true;
    }

    // Ensure all contact fields exist (for consistency)
    const defaultFields = {
        phone2: '',
        phone2Type: 'work',
        email: '',
        emailType: 'personal',
        email2: '',
        email2Type: 'work',
        addressType: 'σπίτι',
        desc: '',
        lastContact: null,
        nextFollowUp: null
    };

    for (const [key, value] of Object.entries(defaultFields)) {
        if (client[key] === undefined) {
            client[key] = value;
            updated = true;
        }
    }

    return updated;
}

// ============================================================================
// APPOINTMENT MIGRATION
// ============================================================================

function migrateAppointment(appointment) {
    let updated = false;

    // Add status field based on completed flag
    if (!appointment.status) {
        if (appointment.completed) {
            appointment.status = 'completed';
        } else {
            appointment.status = 'pending';
        }
        updated = true;
    }

    // Add payment tracking fields
    if (!appointment.paid) {
        if (appointment.amount && appointment.amount > 0) {
            // If there's an amount but no paid status, assume unpaid
            appointment.paid = 'unpaid';
        } else {
            // No amount means no payment required
            appointment.paid = 'unpaid';
        }
        updated = true;
    }

    // Add amountPaid field for partial payments
    if (appointment.amountPaid === undefined) {
        if (appointment.paid === 'paid' && appointment.amount) {
            // If marked as paid, set amountPaid to full amount
            appointment.amountPaid = appointment.amount;
        } else {
            appointment.amountPaid = 0;
        }
        updated = true;
    }

    // Ensure isStandalone flag exists
    if (appointment.isStandalone === undefined) {
        appointment.isStandalone = !appointment.client || appointment.client === null;
        updated = true;
    }

    // Ensure priority exists
    if (!appointment.priority) {
        appointment.priority = 'medium';
        updated = true;
    }

    // Ensure desc exists
    if (appointment.desc === undefined) {
        appointment.desc = '';
        updated = true;
    }

    return updated;
}

// ============================================================================
// TASK MIGRATION
// ============================================================================

function migrateTask(task) {
    let updated = false;

    // Add referenceCode if missing
    if (!task.referenceCode) {
        // Generate a reference code based on task date and ID
        const taskDate = new Date(task.date || task.id);
        const year = taskDate.getFullYear();
        const month = String(taskDate.getMonth() + 1).padStart(2, '0');
        const day = String(taskDate.getDate()).padStart(2, '0');
        const randomPart = task.id.toString().slice(-4);
        task.referenceCode = `TSK-${year}${month}${day}-${randomPart}`;
        updated = true;
    }

    // Add checklist if missing
    if (!task.checklist) {
        task.checklist = [];
        updated = true;
    }

    // Ensure isStandalone flag exists
    if (task.isStandalone === undefined) {
        task.isStandalone = !task.client || task.client === null;
        updated = true;
    }

    // Ensure priority exists
    if (!task.priority) {
        task.priority = 'medium';
        updated = true;
    }

    // Ensure completed flag exists
    if (task.completed === undefined) {
        task.completed = false;
        updated = true;
    }

    // Ensure amount exists
    if (task.amount === undefined) {
        task.amount = 0;
        updated = true;
    }

    // Ensure desc exists
    if (task.desc === undefined) {
        task.desc = '';
        updated = true;
    }

    return updated;
}

// ============================================================================
// RUN MIGRATIONS
// ============================================================================

console.log('\nMigrating data...\n');

// Migrate Clients
if (data.clients && Array.isArray(data.clients)) {
    stats.clients.total = data.clients.length;
    data.clients.forEach(client => {
        if (migrateClient(client)) {
            stats.clients.updated++;
        }
    });
    console.log(`✓ Clients: ${stats.clients.updated}/${stats.clients.total} updated`);
}

// Migrate Appointments
if (data.appointments && Array.isArray(data.appointments)) {
    stats.appointments.total = data.appointments.length;
    data.appointments.forEach(appointment => {
        if (migrateAppointment(appointment)) {
            stats.appointments.updated++;
        }
    });
    console.log(`✓ Appointments: ${stats.appointments.updated}/${stats.appointments.total} updated`);
}

// Migrate Tasks
if (data.tasks && Array.isArray(data.tasks)) {
    stats.tasks.total = data.tasks.length;
    data.tasks.forEach(task => {
        if (migrateTask(task)) {
            stats.tasks.updated++;
        }
    });
    console.log(`✓ Tasks: ${stats.tasks.updated}/${stats.tasks.total} updated`);
}

// Update metadata
if (!data.version) {
    data.version = '2.0.0';
}

if (!data.lastBackup) {
    data.lastBackup = new Date().toISOString();
}

// Ensure clientCategories field exists (renamed from categories)
if (data.categories && !data.clientCategories) {
    data.clientCategories = data.categories;
}

// ============================================================================
// SAVE MIGRATED DATA
// ============================================================================

try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n✓ Successfully saved migrated backup to: ${OUTPUT_FILE}`);
} catch (error) {
    console.error('\n✗ Error saving migrated backup:', error.message);
    process.exit(1);
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n==================================');
console.log('Migration Summary');
console.log('==================================');
console.log(`Clients:      ${stats.clients.updated}/${stats.clients.total} updated`);
console.log(`Appointments: ${stats.appointments.updated}/${stats.appointments.total} updated`);
console.log(`Tasks:        ${stats.tasks.updated}/${stats.tasks.total} updated`);
console.log(`Version:      ${data.version}`);
console.log('==================================\n');

console.log('✓ Migration completed successfully!');
console.log(`\nYou can now import "${OUTPUT_FILE}" into the new app version.\n`);
