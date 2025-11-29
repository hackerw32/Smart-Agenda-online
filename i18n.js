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
            'nav.settings': 'Settings',
            
            // Actions
            'actions.add': 'Add',
            'actions.edit': 'Edit',
            'actions.delete': 'Delete',
            'actions.save': 'Save',
            'actions.cancel': 'Cancel',
            'actions.filter': 'Filters',
            'actions.search': 'Search',
            'actions.select': 'Select',
            'actions.export': 'Export',
            'actions.import': 'Import',
            'actions.view_all': 'View All',
            'actions.complete': 'Complete',
            
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
            
            // Settings
            'settings.appearance': 'Appearance',
            'settings.theme': 'Theme',
            'settings.light': 'Light',
            'settings.dark': 'Dark',
            'settings.language': 'Language',
            'settings.currency': 'Currency',
            'settings.font_size': 'Font Size',
            'settings.client_types': 'Client Types',
            'settings.client_types_desc': 'Manage custom client types and colors (up to 6 types)',
            'settings.add_client_type': 'Add Client Type',
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
            'empty.tasks.message': 'Add a task to stay organized'
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
            'nav.settings': 'Ρυθμίσεις',
            
            // Ενέργειες
            'actions.add': 'Προσθήκη',
            'actions.edit': 'Επεξεργασία',
            'actions.delete': 'Διαγραφή',
            'actions.save': 'Αποθήκευση',
            'actions.cancel': 'Ακύρωση',
            'actions.filter': 'Φίλτρα',
            'actions.search': 'Αναζήτηση',
            'actions.select': 'Επιλογή',
            'actions.export': 'Εξαγωγή',
            'actions.import': 'Εισαγωγή',
            'actions.view_all': 'Προβολή Όλων',
            'actions.complete': 'Ολοκλήρωση',
            
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
            
            // Ρυθμίσεις
            'settings.appearance': 'Εμφάνιση',
            'settings.theme': 'Θέμα',
            'settings.light': 'Φωτεινό',
            'settings.dark': 'Σκούρο',
            'settings.language': 'Γλώσσα',
            'settings.currency': 'Νόμισμα',
            'settings.font_size': 'Μέγεθος Γραμματοσειράς',
            'settings.client_types': 'Τύποι Πελατών',
            'settings.client_types_desc': 'Διαχείριση προσαρμοσμένων τύπων πελατών και χρωμάτων (έως 6 τύπους)',
            'settings.add_client_type': 'Προσθήκη Τύπου Πελάτη',
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
            'calendar.completed': 'Ολοκληρωμένα',
            'calendar.overdue': 'Καθυστερημένα',
            'calendar.total_revenue': 'Συνολικά Έσοδα',
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
            'empty.tasks.message': 'Προσθέστε μια εργασία για οργάνωση'
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
            'nav.settings': 'Настройки',
            
            // Действия
            'actions.add': 'Добавить',
            'actions.edit': 'Изменить',
            'actions.delete': 'Удалить',
            'actions.save': 'Сохранить',
            'actions.cancel': 'Отмена',
            'actions.filter': 'Фильтры',
            'actions.search': 'Поиск',
            'actions.select': 'Выбрать',
            'actions.export': 'Экспорт',
            'actions.import': 'Импорт',
            'actions.view_all': 'Показать все',
            'actions.complete': 'Завершить',
            
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
            
            // Настройки
            'settings.appearance': 'Внешний вид',
            'settings.theme': 'Тема',
            'settings.light': 'Светлая',
            'settings.dark': 'Темная',
            'settings.language': 'Язык',
            'settings.currency': 'Валюта',
            'settings.font_size': 'Размер шрифта',
            'settings.client_types': 'Типы клиентов',
            'settings.client_types_desc': 'Управление пользовательскими типами клиентов и цветами (до 6 типов)',
            'settings.add_client_type': 'Добавить тип клиента',
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
            'empty.tasks.message': 'Добавьте задачу для организации'
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
