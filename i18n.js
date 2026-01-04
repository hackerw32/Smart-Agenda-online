/**
 * Smart Agenda - Internationalization (i18n) Module
 * 
 * Supports: English, Greek (Ελληνικά), Russian (Русский)
 */

(function() {
    'use strict';

    const translations = {
        en: {
            // Navigation
            'nav.home': 'Home',
            'nav.clients': 'Clients',
            'nav.appointments': 'Appointments',
            'nav.tasks': 'Tasks',
            'nav.map': 'Map',
            'nav.finance': 'Finance',
            'nav.calendar': 'Calendar',
            'nav.interactions': 'Interactions',
            'nav.advanced': 'Advanced',
            'nav.settings': 'Settings',
            
            // Actions
            'actions.add': 'Add',
            'actions.edit': 'Edit',
            'actions.delete': 'Delete',
            'actions.save': 'Save',
            'actions.cancel': 'Cancel',
            'actions.filter': 'Filters',
            'actions.sort': 'Sort',
            'actions.search': 'Search',
            'actions.select': 'Select',
            'actions.export': 'Export',
            'actions.import': 'Import',
            'actions.view_all': 'View All',
            'actions.complete': 'Complete',
            'actions.incomplete': 'Pending',

            // Dashboard
            'dashboard.title': 'Dashboard',
            'dashboard.today': "Today's Overview",
            'dashboard.appointments': 'Appointments',
            'dashboard.tasks': 'Tasks',
            'dashboard.revenue': 'Revenue',
            'dashboard.upcoming_appointments': 'Upcoming Appointments',
            'dashboard.pending_tasks': 'Pending Tasks',
            'dashboard.recent_clients': 'Recent Clients',
            
            // Search placeholders
            'search.clients': 'Search clients...',
            'search.appointments': 'Search appointments...',
            'search.tasks': 'Search tasks...',
            'search.interactions': 'Search interactions and clients...',
            
            // Settings
            'settings.appearance': 'Appearance',
            'settings.theme': 'Theme',
            'settings.light': 'Light',
            'settings.dark': 'Dark',
            'settings.language': 'Language',
            'settings.currency': 'Currency',
            'settings.font_size': 'Font Size',
            'settings.font_small': 'Small',
            'settings.font_medium': 'Medium (Default)',
            'settings.font_large': 'Large',
            'settings.font_extra_large': 'Extra Large',
            'settings.enabled': 'Enabled',
            'settings.disabled': 'Disabled',
            'settings.client_types': 'Client Types',
            'settings.client_types_desc': 'Manage client categories',
            'settings.add_client_type': 'Add Client Type',
            'settings.modern': 'Modern',
            'settings.colorful': 'Colorful',
            'settings.theme_mode': 'Theme Mode',
            'settings.accent_color': 'Accent Color',
            'settings.data': 'Data Management',
            'settings.export': 'Export Data',
            'settings.import': 'Import Data',
            'settings.clear': 'Clear All Data',
            'settings.account': 'Account',
            'settings.signin': 'Sign In',
            'settings.create_account': 'Create Account',
            'settings.signout': 'Sign Out',
            'settings.backup': 'Backup to Cloud',
            'settings.restore': 'Restore from Cloud',
            'settings.about': 'About',

            // Google Drive
            'gdrive.connected': 'Connected successfully to Google Drive',
            'gdrive.connectionError': 'Connection failed: ',
            'gdrive.disconnect': 'Disconnect',
            'gdrive.disconnectTitle': 'Disconnect',
            'gdrive.disconnectMessage': 'Are you sure you want to disconnect from Google Drive? Automatic backup will be disabled.',
            'gdrive.pleaseSignIn': 'Please sign in to Google Drive first',
            'gdrive.noBackupsFound': 'No backups found in Google Drive',
            'gdrive.restoreError': 'Error during restore: ',
            'gdrive.selectBackup': 'Select the backup you want to restore:',
            'gdrive.warning': 'Warning:',
            'gdrive.warningMessage': 'Restore will replace all current data.',
            'gdrive.selectBackupTitle': 'Select Backup',
            'gdrive.clients': 'clients',
            'gdrive.appointments': 'appointments',
            'gdrive.tasks': 'tasks',
            'gdrive.withFiles': 'with files',

            // Notifications
            'notifications.title': 'Notifications',
            'notifications.description': 'Receive reminders before your appointments',
            'notifications.enabled': 'Enable Notifications',
            'notifications.remind_before': 'Remind me before',
            'notifications.10min': '10 minutes',
            'notifications.30min': '30 minutes',
            'notifications.1hour': '1 hour',
            'notifications.2hours': '2 hours',

            // Advanced Operations
            'advanced.title': 'Advanced Operations',
            'advanced.bulk_operations': 'Bulk Operations',
            'advanced.clients': 'Clients',
            'advanced.appointments': 'Appointments',
            'advanced.export_xls': 'Export XLS',
            'advanced.export_vcf': 'Export Contacts VCF',
            'advanced.delete_selected': 'Delete Selected',
            'advanced.update_type': 'Update Type',
            'advanced.update_status': 'Update Status',
            'advanced.data_management': 'Data Management',
            'advanced.database_stats': 'Database Statistics',
            'advanced.storage_usage': 'Storage Usage',

            // Dashboard Additional
            'dashboard.analytics': 'Analytics',
            'dashboard.top_clients': 'Top Clients by Revenue',
            'dashboard.revenue_chart': 'Revenue Overview (Last 7 Days)',
            'dashboard.revenue_forecast': 'Revenue Forecast (Next 30 Days)',

            // Map
            'map.route_button': 'Route',
            'map.appointments_button': 'Appointments',
            'map.filter_button': 'Filters',
            'map.gps_button': 'My Location',

            // Client fields
            'client.name': 'Name',
            'client.phone': 'Phone',
            'client.email': 'Email',
            'client.address': 'Address',
            'client.notes': 'Notes',
            'client.categories': 'Categories',
            'client.type': 'Type',
            'client.existing': 'Existing',
            'client.potential': 'Potential',
            
            // Appointment fields
            'appointment.client': 'Client',
            'appointment.date': 'Date',
            'appointment.time': 'Time',
            'appointment.description': 'Description',
            'appointment.amount': 'Amount',
            'appointment.priority': 'Priority',
            'appointment.status': 'Status',
            
            // Task fields
            'task.client': 'Client',
            'task.title': 'Title',
            'task.description': 'Description',
            'task.dueDate': 'Due Date',
            'task.priority': 'Priority',
            'task.completed': 'Completed',
            
            // Priority levels
            'priority.low': 'Low',
            'priority.medium': 'Medium',
            'priority.high': 'High',

            // Filter states
            'filter.all': 'Filter: All',
            'filter.client_types': 'Client Types',
            'filter.select_all': 'Select All',
            'filter.apply': 'Apply Filter',
            'filter.mode_or': 'OR',
            'filter.mode_and': 'AND',
            'filter.mode_or_and': 'OR+AND',
            'filter.or_description': 'Show clients with ANY of the selected types',
            'filter.and_description': 'Show clients with ALL of the selected types',
            'filter.or_and_description': 'First 2 types use OR, rest use AND',
            'filter.all_pending': 'All Pending',
            'filter.all_cancelled': 'All Cancelled',
            'filter.all_completed': 'All Completed',
            'filter.all_overdue': 'All Overdue',
            'filter.low_pending': 'Low Pending',
            'filter.low_cancelled': 'Low Cancelled',
            'filter.low_completed': 'Low Completed',
            'filter.low_overdue': 'Low Overdue',
            'filter.medium_pending': 'Medium Pending',
            'filter.medium_cancelled': 'Medium Cancelled',
            'filter.medium_completed': 'Medium Completed',
            'filter.medium_overdue': 'Medium Overdue',
            'filter.high_pending': 'High Pending',
            'filter.high_cancelled': 'High Cancelled',
            'filter.high_completed': 'High Completed',
            'filter.high_overdue': 'High Overdue',
            'filter.all_low': 'All Low',
            'filter.all_medium': 'All Medium',
            'filter.all_high': 'All High',
            
            // Status
            'status.pending': 'Pending',
            'status.completed': 'Completed',
            'status.overdue': 'Overdue',
            'status.cancelled': 'Cancelled',
            'status.all_active': 'All Active',
            'status.all_priorities': 'All Priorities',

            // Payment Status
            'payment.status': 'Payment Status',
            'payment.unpaid': 'Unpaid',
            'payment.paid': 'Paid',
            'payment.partial': 'Partially Paid',
            
            // Calendar stats
            'calendar.total': 'Total',
            'calendar.pending': 'Pending',
            'calendar.completed': 'Completed',
            'calendar.overdue': 'Overdue',
            'calendar.total_revenue': 'Total Revenue',
            'calendar.potential': 'Potential',

            // Messages
            'msg.saved': 'Saved successfully',
            'msg.deleted': 'Deleted successfully',
            'msg.error': 'An error occurred',
            'msg.confirm_delete': 'Are you sure you want to delete this item?',
            'msg.no_clients': 'No clients found',
            'msg.no_appointments': 'No appointments found',
            'msg.no_tasks': 'No tasks found',
            
            // Empty states
            'empty.clients.title': 'No Clients Yet',
            'empty.clients.message': 'Add your first client to get started',
            'empty.appointments.title': 'No Appointments',
            'empty.appointments.message': 'Create your first appointment',
            'empty.tasks.title': 'No Tasks',
            'empty.tasks.message': 'Add a task to stay organized',

            // Welcome Screen
            'welcome.title': 'Welcome to<br>Smart Agenda',
            'welcome.subtitle': 'Your professional CRM for clients, appointments, and tasks',
            'welcome.selectLanguage': 'Select Language',
            'welcome.gdriveText': 'Automatic Backup & Restore via Google Drive',
            'welcome.startTutorial': 'Start Tutorial',
            'welcome.skip': 'Skip for now',
            'welcome.footerText': 'You can always set up your backup or run the tutorial later at any time from the Settings',

            // Help Section
            'help.title': 'Help',
            'help.description': 'Learn how to use the application',
            'help.startTutorial': 'Start Tutorial',

            // Category Subtitles
            'category.appearance_subtitle': 'Theme, Language, Currency',
            'category.data_subtitle': 'Backup & Restore',
            'category.about_subtitle': 'Version & Developers',

            // Data Management
            'data.local_backup': 'Save Backup to Documents',
            'data.send_backup': 'Send Backup',
            'data.google_drive_title': 'Google Drive Backup',

            // About Section
            'about.description': 'Smart Agenda is a comprehensive customer management (CRM) application that helps you organize appointments, tasks, and client contacts in a simple and modern environment.',
            'about.createdBy': 'Created in collaboration by',
            'about.developers': 'George Tsouchnikas (EazyFix) and George Kouzmidis'
        },
        
        el: {
            // Πλοήγηση
            'nav.home': 'Αρχική',
            'nav.clients': 'Πελάτες',
            'nav.appointments': 'Ραντεβού',
            'nav.tasks': 'Εργασίες',
            'nav.map': 'Χάρτης',
            'nav.finance': 'Οικονομικά',
            'nav.calendar': 'Ημερολόγιο',
            'nav.interactions': 'Αλληλεπιδράσεις',
            'nav.advanced': 'Προχωρημένα',
            'nav.settings': 'Ρυθμίσεις',
            
            // Ενέργειες
            'actions.add': 'Προσθήκη',
            'actions.edit': 'Επεξεργασία',
            'actions.delete': 'Διαγραφή',
            'actions.save': 'Αποθήκευση',
            'actions.cancel': 'Ακύρωση',
            'actions.filter': 'Φίλτρα',
            'actions.sort': 'Ταξινόμηση',
            'actions.search': 'Αναζήτηση',
            'actions.select': 'Επιλογή',
            'actions.export': 'Εξαγωγή',
            'actions.import': 'Εισαγωγή',
            'actions.view_all': 'Προβολή Όλων',
            'actions.complete': 'Ολοκλήρωση',
            'actions.incomplete': 'Εκκρεμότητα',

            // Dashboard
            'dashboard.title': 'Αρχική',
            'dashboard.today': 'Επισκόπηση Σήμερα',
            'dashboard.appointments': 'Ραντεβού',
            'dashboard.tasks': 'Εργασίες',
            'dashboard.revenue': 'Έσοδα',
            'dashboard.upcoming_appointments': 'Επόμενα Ραντεβού',
            'dashboard.pending_tasks': 'Εκκρεμείς Εργασίες',
            'dashboard.recent_clients': 'Πρόσφατοι Πελάτες',
            
            // Αναζήτηση
            'search.clients': 'Αναζήτηση πελατών...',
            'search.appointments': 'Αναζήτηση ραντεβού...',
            'search.tasks': 'Αναζήτηση εργασιών...',
            'search.interactions': 'Αναζήτηση αλληλεπιδράσεων και πελατών...',
            
            // Ρυθμίσεις
            'settings.appearance': 'Εμφάνιση',
            'settings.theme': 'Θέμα',
            'settings.light': 'Φωτεινό',
            'settings.dark': 'Σκούρο',
            'settings.language': 'Γλώσσα',
            'settings.currency': 'Νόμισμα',
            'settings.font_size': 'Μέγεθος Γραμματοσειράς',
            'settings.font_small': 'Μικρό',
            'settings.font_medium': 'Μεσαίο (Προεπιλογή)',
            'settings.font_large': 'Μεγάλο',
            'settings.font_extra_large': 'Πολύ Μεγάλο',
            'settings.enabled': 'Ενεργοποιημένο',
            'settings.disabled': 'Απενεργοποιημένο',
            'settings.client_types': 'Τύποι Πελατών',
            'settings.client_types_desc': 'Διαχείριση κατηγορίας πελατών',
            'settings.add_client_type': 'Προσθήκη Τύπου Πελάτη',
            'settings.modern': 'Μοντέρνο',
            'settings.colorful': 'Χρωματιστό',
            'settings.theme_mode': 'Λειτουργία Θέματος',
            'settings.accent_color': 'Χρώμα Έμφασης',
            'settings.data': 'Διαχείριση Δεδομένων',
            'settings.export': 'Εξαγωγή Δεδομένων',
            'settings.import': 'Εισαγωγή Δεδομένων',
            'settings.clear': 'Διαγραφή Όλων',
            'settings.account': 'Λογαριασμός',
            'settings.signin': 'Σύνδεση',
            'settings.create_account': 'Δημιουργία Λογαριασμού',
            'settings.signout': 'Αποσύνδεση',
            'settings.backup': 'Αντίγραφο Ασφαλείας στο Cloud',
            'settings.restore': 'Επαναφορά από το Cloud',
            'settings.about': 'Σχετικά',

            // Google Drive
            'gdrive.connected': 'Συνδεθήκατε επιτυχώς στο Google Drive',
            'gdrive.connectionError': 'Αποτυχία σύνδεσης: ',
            'gdrive.disconnect': 'Αποσύνδεση',
            'gdrive.disconnectTitle': 'Αποσύνδεση',
            'gdrive.disconnectMessage': 'Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε από το Google Drive; Το αυτόματο backup θα απενεργοποιηθεί.',
            'gdrive.pleaseSignIn': 'Παρακαλώ συνδεθείτε πρώτα στο Google Drive',
            'gdrive.noBackupsFound': 'Δεν βρέθηκαν backups στο Google Drive',
            'gdrive.restoreError': 'Σφάλμα κατά την επαναφορά: ',
            'gdrive.selectBackup': 'Επιλέξτε το backup που θέλετε να επαναφέρετε:',
            'gdrive.warning': 'Προσοχή:',
            'gdrive.warningMessage': 'Η επαναφορά θα αντικαταστήσει όλα τα τρέχοντα δεδομένα.',
            'gdrive.selectBackupTitle': 'Επιλογή Backup',
            'gdrive.clients': 'πελάτες',
            'gdrive.appointments': 'ραντεβού',
            'gdrive.tasks': 'εργασίες',
            'gdrive.withFiles': 'με αρχεία',

            // Ειδοποιήσεις
            'notifications.title': 'Ειδοποιήσεις',
            'notifications.description': 'Λάβετε υπενθυμίσεις πριν από τα ραντεβού σας',
            'notifications.enabled': 'Ενεργοποίηση Ειδοποιήσεων',
            'notifications.remind_before': 'Υπενθύμιση πριν',
            'notifications.10min': '10 λεπτά',
            'notifications.30min': '30 λεπτά',
            'notifications.1hour': '1 ώρα',
            'notifications.2hours': '2 ώρες',

            // Προχωρημένες Λειτουργίες
            'advanced.title': 'Προχωρημένες Λειτουργίες',
            'advanced.bulk_operations': 'Μαζικές Ενέργειες',
            'advanced.clients': 'Πελάτες',
            'advanced.appointments': 'Ραντεβού',
            'advanced.export_xls': 'Εξαγωγή XLS',
            'advanced.export_vcf': 'Εξαγωγή Επαφών VCF',
            'advanced.delete_selected': 'Διαγραφή Επιλεγμένων',
            'advanced.update_type': 'Ενημέρωση Τύπου',
            'advanced.update_status': 'Ενημέρωση Κατάστασης',
            'advanced.data_management': 'Διαχείριση Δεδομένων',
            'advanced.database_stats': 'Στατιστικά Βάσης Δεδομένων',
            'advanced.storage_usage': 'Χρήση Αποθηκευτικού Χώρου',

            // Πρόσθετα Dashboard
            'dashboard.analytics': 'Αναλυτικά Στοιχεία',
            'dashboard.top_clients': 'Κορυφαίοι Πελάτες ανά Έσοδα',
            'dashboard.revenue_chart': 'Επισκόπηση Εσόδων (Τελευταίες 7 Ημέρες)',
            'dashboard.revenue_forecast': 'Πρόβλεψη Εσόδων (Επόμενες 30 Ημέρες)',

            // Χάρτης
            'map.route_button': 'Διαδρομή',
            'map.appointments_button': 'Ραντεβού',
            'map.filter_button': 'Φίλτρα',
            'map.gps_button': 'Η Τοποθεσία μου',

            // Πεδία πελάτη
            'client.name': 'Όνομα',
            'client.phone': 'Τηλέφωνο',
            'client.email': 'Email',
            'client.address': 'Διεύθυνση',
            'client.notes': 'Σημειώσεις',
            'client.categories': 'Κατηγορίες',
            'client.type': 'Τύπος',
            'client.existing': 'Υπάρχων',
            'client.potential': 'Δυνητικός',
            
            // Πεδία ραντεβού
            'appointment.client': 'Πελάτης',
            'appointment.date': 'Ημερομηνία',
            'appointment.time': 'Ώρα',
            'appointment.description': 'Περιγραφή',
            'appointment.amount': 'Ποσό',
            'appointment.priority': 'Προτεραιότητα',
            'appointment.status': 'Κατάσταση',
            
            // Πεδία εργασίας
            'task.title': 'Τίτλος',
            'task.description': 'Περιγραφή',
            'task.dueDate': 'Προθεσμία',
            'task.priority': 'Προτεραιότητα',
            'task.completed': 'Ολοκληρώθηκε',
            
            // Προτεραιότητες
            'priority.low': 'Χαμηλή',
            'priority.medium': 'Μεσαία',
            'priority.high': 'Υψηλή',

            // Καταστάσεις φίλτρου
            'filter.all': 'Φίλτρο: Όλα',
            'filter.client_types': 'Τύποι Πελατών',
            'filter.select_all': 'Επιλογή Όλων',
            'filter.apply': 'Εφαρμογή Φίλτρου',
            'filter.mode_or': 'Ή',
            'filter.mode_and': 'ΚΑΙ',
            'filter.mode_or_and': 'Ή+ΚΑΙ',
            'filter.or_description': 'Εμφάνιση πελατών με ΟΠΟΙΟΝΔΗΠΟΤΕ από τους επιλεγμένους τύπους',
            'filter.and_description': 'Εμφάνιση πελατών με ΟΛΟΥΣ τους επιλεγμένους τύπους',
            'filter.or_and_description': 'Οι πρώτοι 2 τύποι χρησιμοποιούν Ή, οι υπόλοιποι ΚΑΙ',
            'filter.all_pending': 'Όλα Εκκρεμή',
            'filter.all_cancelled': 'Όλα Ακυρωμένα',
            'filter.all_completed': 'Όλα Ολοκληρωμένα',
            'filter.all_overdue': 'Όλα Καθυστερημένα',
            'filter.low_pending': 'Χαμηλή Εκκρεμή',
            'filter.low_cancelled': 'Χαμηλή Ακυρωμένα',
            'filter.low_completed': 'Χαμηλή Ολοκληρωμένα',
            'filter.low_overdue': 'Χαμηλή Καθυστερημένα',
            'filter.medium_pending': 'Μεσαία Εκκρεμή',
            'filter.medium_cancelled': 'Μεσαία Ακυρωμένα',
            'filter.medium_completed': 'Μεσαία Ολοκληρωμένα',
            'filter.medium_overdue': 'Μεσαία Καθυστερημένα',
            'filter.high_pending': 'Υψηλή Εκκρεμή',
            'filter.high_cancelled': 'Υψηλή Ακυρωμένα',
            'filter.high_completed': 'Υψηλή Ολοκληρωμένα',
            'filter.high_overdue': 'Υψηλή Καθυστερημένα',
            'filter.all_low': 'Όλα Χαμηλή',
            'filter.all_medium': 'Όλα Μεσαία',
            'filter.all_high': 'Όλα Υψηλή',
            
            // Κατάσταση
            'status.pending': 'Εκκρεμεί',
            'status.completed': 'Ολοκληρώθηκε',
            'status.overdue': 'Καθυστερημένο',
            'status.cancelled': 'Ακυρωμένο',
            'status.all_active': 'Όλα Ενεργά',
            'status.all_priorities': 'Όλες Προτεραιότητες',

            // Κατάσταση Πληρωμής
            'payment.status': 'Κατάσταση Πληρωμής',
            'payment.unpaid': 'Απλήρωτο',
            'payment.paid': 'Πληρωμένο',
            'payment.partial': 'Μερικώς Πληρωμένο',

            // Στατιστικά ημερολογίου
            'calendar.total': 'Σύνολο',
            'calendar.pending': 'Εκκρεμή',
            'calendar.completed': 'ΟΛΟΚΛΗΡ.',
            'calendar.overdue': 'ΚΑΘΥΣΤΕΡ.',
            'calendar.total_revenue': 'ΕΣΟΔΑ',
            'calendar.potential': 'Δυνητικά',
            
            // Μηνύματα
            'msg.saved': 'Αποθηκεύτηκε επιτυχώς',
            'msg.deleted': 'Διαγράφηκε επιτυχώς',
            'msg.error': 'Παρουσιάστηκε σφάλμα',
            'msg.confirm_delete': 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το στοιχείο;',
            'msg.no_clients': 'Δεν βρέθηκαν πελάτες',
            'msg.no_appointments': 'Δεν βρέθηκαν ραντεβού',
            'msg.no_tasks': 'Δεν βρέθηκαν εργασίες',
            
            // Κενές καταστάσεις
            'empty.clients.title': 'Δεν Υπάρχουν Πελάτες',
            'empty.clients.message': 'Προσθέστε τον πρώτο σας πελάτη',
            'empty.appointments.title': 'Δεν Υπάρχουν Ραντεβού',
            'empty.appointments.message': 'Δημιουργήστε το πρώτο σας ραντεβού',
            'empty.tasks.title': 'Δεν Υπάρχουν Εργασίες',
            'empty.tasks.message': 'Προσθέστε μια εργασία για οργάνωση',

            // Welcome Screen
            'welcome.title': 'Καλώς ήρθατε στο<br>Smart Agenda',
            'welcome.subtitle': 'Το επαγγελματικό σας CRM για πελάτες, ραντεβού και εργασίες',
            'welcome.selectLanguage': 'Επιλογή Γλώσσας',
            'welcome.gdriveText': 'Αυτόματο Backup & Επαναφορά μέσω Google Drive',
            'welcome.startTutorial': 'Ξεκινήστε την Εκπαίδευση',
            'welcome.skip': 'Παράλειψη προς το παρόν',
            'welcome.footerText': 'Μπορείτε να ρυθμίσετε το αντίγραφο ασφαλείας ή να εκτελέσετε την εκπαίδευση αργότερα στις Ρυθμίσεις',

            // Help Section
            'help.title': 'Βοήθεια',
            'help.description': 'Μάθετε πώς να χρησιμοποιείτε την εφαρμογή',
            'help.startTutorial': 'Εκκίνηση Tutorial',

            // Category Subtitles
            'category.appearance_subtitle': 'Θέμα, Γλώσσα, Νόμισμα',
            'category.data_subtitle': 'Backup & Επαναφορά',
            'category.about_subtitle': 'Έκδοση & Developers',

            // Data Management
            'data.local_backup': 'Αποθήκευση Backup στα Documents',
            'data.send_backup': 'Αποστολή Backup',
            'data.google_drive_title': 'Google Drive Backup',

            // About Section
            'about.description': 'Το Smart Agenda είναι μια ολοκληρωμένη εφαρμογή διαχείρισης πελατών (CRM) που σας βοηθά να οργανώνετε ραντεβού, εργασίες, και επαφές με πελάτες σε ένα απλό και σύγχρονο περιβάλλον.',
            'about.createdBy': 'Δημιουργήθηκε σε συνεργασία των',
            'about.developers': 'Γιώργος Τσουχνικάς (EazyFix) και Γιώργος Κουζμίδης'
        },
        
        ru: {
            // Навигация
            'nav.home': 'Главная',
            'nav.clients': 'Клиенты',
            'nav.appointments': 'Встречи',
            'nav.tasks': 'Задачи',
            'nav.map': 'Карта',
            'nav.finance': 'Финансы',
            'nav.calendar': 'Календарь',
            'nav.interactions': 'Взаимодействия',
            'nav.advanced': 'Расширенные',
            'nav.settings': 'Настройки',
            
            // Действия
            'actions.add': 'Добавить',
            'actions.edit': 'Изменить',
            'actions.delete': 'Удалить',
            'actions.save': 'Сохранить',
            'actions.cancel': 'Отмена',
            'actions.filter': 'Фильтры',
            'actions.sort': 'Сортировка',
            'actions.search': 'Поиск',
            'actions.select': 'Выбрать',
            'actions.export': 'Экспорт',
            'actions.import': 'Импорт',
            'actions.view_all': 'Показать все',
            'actions.complete': 'Завершить',
            'actions.incomplete': 'Ожидание',

            // Dashboard
            'dashboard.title': 'Главная',
            'dashboard.today': 'Обзор сегодня',
            'dashboard.appointments': 'Встречи',
            'dashboard.tasks': 'Задачи',
            'dashboard.revenue': 'Доход',
            'dashboard.upcoming_appointments': 'Предстоящие встречи',
            'dashboard.pending_tasks': 'Невыполненные задачи',
            'dashboard.recent_clients': 'Недавние клиенты',
            
            // Поиск
            'search.clients': 'Поиск клиентов...',
            'search.appointments': 'Поиск встреч...',
            'search.tasks': 'Поиск задач...',
            'search.interactions': 'Поиск взаимодействий и клиентов...',
            
            // Настройки
            'settings.appearance': 'Внешний вид',
            'settings.theme': 'Тема',
            'settings.light': 'Светлая',
            'settings.dark': 'Темная',
            'settings.language': 'Язык',
            'settings.currency': 'Валюта',
            'settings.font_size': 'Размер шрифта',
            'settings.font_small': 'Маленький',
            'settings.font_medium': 'Средний (По умолчанию)',
            'settings.font_large': 'Большой',
            'settings.font_extra_large': 'Очень большой',
            'settings.enabled': 'Включено',
            'settings.disabled': 'Выключено',
            'settings.client_types': 'Типы клиентов',
            'settings.client_types_desc': 'Управление категориями клиентов',
            'settings.add_client_type': 'Добавить тип клиента',
            'settings.modern': 'Современный',
            'settings.colorful': 'Цветной',
            'settings.theme_mode': 'Режим темы',
            'settings.accent_color': 'Цвет акцента',
            'settings.data': 'Управление данными',
            'settings.export': 'Экспорт данных',
            'settings.import': 'Импорт данных',
            'settings.clear': 'Очистить все',
            'settings.account': 'Аккаунт',
            'settings.signin': 'Войти',
            'settings.create_account': 'Создать аккаунт',
            'settings.signout': 'Выйти',
            'settings.backup': 'Резервное копирование в облако',
            'settings.restore': 'Восстановить из облака',
            'settings.about': 'О программе',

            // Google Drive
            'gdrive.connected': 'Успешное подключение к Google Drive',
            'gdrive.connectionError': 'Ошибка подключения: ',
            'gdrive.disconnect': 'Отключить',
            'gdrive.disconnectTitle': 'Отключение',
            'gdrive.disconnectMessage': 'Вы уверены, что хотите отключиться от Google Drive? Автоматическое резервное копирование будет отключено.',
            'gdrive.pleaseSignIn': 'Пожалуйста, сначала войдите в Google Drive',
            'gdrive.noBackupsFound': 'Резервные копии не найдены в Google Drive',
            'gdrive.restoreError': 'Ошибка при восстановлении: ',
            'gdrive.selectBackup': 'Выберите резервную копию для восстановления:',
            'gdrive.warning': 'Внимание:',
            'gdrive.warningMessage': 'Восстановление заменит все текущие данные.',
            'gdrive.selectBackupTitle': 'Выбор резервной копии',
            'gdrive.clients': 'клиенты',
            'gdrive.appointments': 'встречи',
            'gdrive.tasks': 'задачи',
            'gdrive.withFiles': 'с файлами',

            // Уведомления
            'notifications.title': 'Уведомления',
            'notifications.description': 'Получайте напоминания перед встречами',
            'notifications.enabled': 'Включить уведомления',
            'notifications.remind_before': 'Напомнить за',
            'notifications.10min': '10 минут',
            'notifications.30min': '30 минут',
            'notifications.1hour': '1 час',
            'notifications.2hours': '2 часа',

            // Расширенные операции
            'advanced.title': 'Расширенные операции',
            'advanced.bulk_operations': 'Массовые операции',
            'advanced.clients': 'Клиенты',
            'advanced.appointments': 'Встречи',
            'advanced.export_xls': 'Экспорт XLS',
            'advanced.export_vcf': 'Экспорт контактов VCF',
            'advanced.delete_selected': 'Удалить выбранные',
            'advanced.update_type': 'Обновить тип',
            'advanced.update_status': 'Обновить статус',
            'advanced.data_management': 'Управление данными',
            'advanced.database_stats': 'Статистика базы данных',
            'advanced.storage_usage': 'Использование хранилища',

            // Дополнительные элементы панели
            'dashboard.analytics': 'Аналитика',
            'dashboard.top_clients': 'Топ клиенты по доходу',
            'dashboard.revenue_chart': 'Обзор дохода (Последние 7 дней)',
            'dashboard.revenue_forecast': 'Прогноз дохода (Следующие 30 дней)',

            // Карта
            'map.route_button': 'Маршрут',
            'map.appointments_button': 'Встречи',
            'map.filter_button': 'Фильтры',
            'map.gps_button': 'Мое местоположение',

            // Поля клиента
            'client.name': 'Имя',
            'client.phone': 'Телефон',
            'client.email': 'Email',
            'client.address': 'Адрес',
            'client.notes': 'Заметки',
            'client.categories': 'Категории',
            'client.type': 'Тип',
            'client.existing': 'Существующий',
            'client.potential': 'Потенциальный',
            
            // Поля встречи
            'appointment.client': 'Клиент',
            'appointment.date': 'Дата',
            'appointment.time': 'Время',
            'appointment.description': 'Описание',
            'appointment.amount': 'Сумма',
            'appointment.priority': 'Приоритет',
            'appointment.status': 'Статус',
            
            // Поля задачи
            'task.title': 'Название',
            'task.description': 'Описание',
            'task.dueDate': 'Срок',
            'task.priority': 'Приоритет',
            'task.completed': 'Завершено',
            
            // Приоритеты
            'priority.low': 'Низкий',
            'priority.medium': 'Средний',
            'priority.high': 'Высокий',

            // Состояния фильтра
            'filter.all': 'Фильтр: Все',
            'filter.client_types': 'Типы клиентов',
            'filter.select_all': 'Выбрать все',
            'filter.apply': 'Применить фильтр',
            'filter.mode_or': 'ИЛИ',
            'filter.mode_and': 'И',
            'filter.mode_or_and': 'ИЛИ+И',
            'filter.or_description': 'Показать клиентов с ЛЮБЫМ из выбранных типов',
            'filter.and_description': 'Показать клиентов со ВСЕМИ выбранными типами',
            'filter.or_and_description': 'Первые 2 типа используют ИЛИ, остальные И',
            'filter.all_pending': 'Все В ожидании',
            'filter.all_cancelled': 'Все Отменено',
            'filter.all_completed': 'Все Завершено',
            'filter.all_overdue': 'Все Просрочено',
            'filter.low_pending': 'Низкий В ожидании',
            'filter.low_cancelled': 'Низкий Отменено',
            'filter.low_completed': 'Низкий Завершено',
            'filter.low_overdue': 'Низкий Просрочено',
            'filter.medium_pending': 'Средний В ожидании',
            'filter.medium_cancelled': 'Средний Отменено',
            'filter.medium_completed': 'Средний Завершено',
            'filter.medium_overdue': 'Средний Просрочено',
            'filter.high_pending': 'Высокий В ожидании',
            'filter.high_cancelled': 'Высокий Отменено',
            'filter.high_completed': 'Высокий Завершено',
            'filter.high_overdue': 'Высокий Просрочено',
            'filter.all_low': 'Все Низкий',
            'filter.all_medium': 'Все Средний',
            'filter.all_high': 'Все Высокий',
            
            // Статус
            'status.pending': 'В ожидании',
            'status.completed': 'Завершено',
            'status.overdue': 'Просрочено',
            'status.cancelled': 'Отменено',
            'status.all_active': 'Все активные',
            'status.all_priorities': 'Все приоритеты',

            // Статус оплаты
            'payment.status': 'Статус оплаты',
            'payment.unpaid': 'Не оплачено',
            'payment.paid': 'Оплачено',
            'payment.partial': 'Частично оплачено',

            // Статистика календаря
            'calendar.total': 'Всего',
            'calendar.pending': 'В ожидании',
            'calendar.completed': 'Завершено',
            'calendar.overdue': 'Просрочено',
            'calendar.total_revenue': 'Общий доход',
            'calendar.potential': 'Потенциал',
            
            // Сообщения
            'msg.saved': 'Успешно сохранено',
            'msg.deleted': 'Успешно удалено',
            'msg.error': 'Произошла ошибка',
            'msg.confirm_delete': 'Вы уверены, что хотите удалить этот элемент?',
            'msg.no_clients': 'Клиенты не найдены',
            'msg.no_appointments': 'Встречи не найдены',
            'msg.no_tasks': 'Задачи не найдены',
            
            // Пустые состояния
            'empty.clients.title': 'Нет клиентов',
            'empty.clients.message': 'Добавьте первого клиента',
            'empty.appointments.title': 'Нет встреч',
            'empty.appointments.message': 'Создайте первую встречу',
            'empty.tasks.title': 'Нет задач',
            'empty.tasks.message': 'Добавьте задачу для организации',

            // Welcome Screen
            'welcome.title': 'Добро пожаловать в<br>Smart Agenda',
            'welcome.subtitle': 'Ваша профессиональная CRM для клиентов, встреч и задач',
            'welcome.selectLanguage': 'Выбор языка',
            'welcome.gdriveText': 'Авто-бэкап и восстановление (Google)',
            'welcome.startTutorial': 'Начать обучение',
            'welcome.skip': 'Пропустить',
            'welcome.footerText': 'Вы можете настроить резервное копирование или запустить обучение позже в Настройках',

            // Help Section
            'help.title': 'Помощь',
            'help.description': 'Узнайте, как пользоваться приложением',
            'help.startTutorial': 'Начать обучение',

            // Category Subtitles
            'category.appearance_subtitle': 'Тема, Язык, Валюта',
            'category.data_subtitle': 'Резервное копирование и восстановление',
            'category.about_subtitle': 'Версия и разработчики',

            // Data Management
            'data.local_backup': 'Сохранить резервную копию в документы',
            'data.send_backup': 'Отправить резервную копию',
            'data.google_drive_title': 'Резервное копирование Google Drive',

            // About Section
            'about.description': 'Smart Agenda - это комплексное приложение для управления клиентами (CRM), которое помогает организовать встречи, задачи и контакты с клиентами в простой и современной среде.',
            'about.createdBy': 'Создано в сотрудничестве',
            'about.developers': 'Георгиос Цухникас (EazyFix) и Георгиос Кузмидис'
        }
    };

    const I18n = {
        currentLanguage: 'en',
        
        init: function() {
            const savedLanguage = localStorage.getItem('language') || 'en';
            this.setLanguage(savedLanguage);
            this.bindEvents();
        },
        
        bindEvents: function() {
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.addEventListener('change', (e) => {
                    this.setLanguage(e.target.value);
                });
            }
        },
        
        setLanguage: function(language) {
            if (!translations[language]) {
                console.warn(`Language ${language} not found, falling back to English`);
                language = 'en';
            }
            
            this.currentLanguage = language;
            localStorage.setItem('language', language);
            
            // Update select value
            const languageSelect = document.getElementById('language-select');
            if (languageSelect) {
                languageSelect.value = language;
            }
            
            // Update document language
            document.documentElement.setAttribute('lang', language);
            
            // Update all i18n elements
            this.updateUI();
            
            // Emit language change event
            if (window.SmartAgenda) {
                window.SmartAgenda.EventBus.emit('language:change', language);
            }
        },
        
        translate: function(key) {
            const lang = translations[this.currentLanguage];
            return lang[key] || translations.en[key] || key;
        },
        
        updateUI: function() {
            // Update all elements with data-i18n attribute
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                element.textContent = this.translate(key);
            });
            
            // Update all elements with data-i18n-placeholder attribute
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                element.setAttribute('placeholder', this.translate(key));
            });
        }
    };

    // Initialize when app is ready
    if (window.SmartAgenda) {
        window.SmartAgenda.EventBus.on('app:ready', () => {
            I18n.init();
        });
        
        // Add to global API
        window.SmartAgenda.I18n = I18n;
    }

})();
