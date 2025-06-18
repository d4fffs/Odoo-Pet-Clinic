{
    "name": "Klinik Hewan",
    "version": "1.0",
    "author": "Daffa",
    "category": "clinic",
    "summary": "Mengatur sistem klinik hewan",
    "depends": ["base", "contacts", "calendar", "stock", "sale", "board", "account"],
    "data" : [
        "security/ir.model.access.csv",
        "data/ir.sequence.xml",
        "views/clinic_booking.xml",
        "views/clinic_doctor.xml",
        "views/clinic_dashboard.xml",
        "views/clinic_pet.xml",
        "views/clinic_service.xml",
        "views/clinic_pet_category.xml",
        "views/clinic_calendar.xml",
        "views/clinic_animal.xml",
        "views/clinic_product.xml",
        'views/payment_wizard_view.xml',
        "views/menu.xml",
    ],
    "assets" : {
    "web.assets_backend" : [
        "klinik_hewan/static/src/components/**/*.js",
        "klinik_hewan/static/src/components/**/*.xml",
        "klinik_hewan/static/src/scss/**/*.scss",
        "klinik_hewan/static/src/img/**/*.png"
        ]
    },
    "installable": True,
    "application": True,    
}