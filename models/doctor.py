from odoo import fields, api, models

class Doctor(models.Model):
    _name = 'clinic.doctor'
    _description = 'Doktor Klinik Hewan'
    _rec_name = 'nama'

    _sql_constraint = [
        (
            'check_booking',
            'CHECK(booking_time)',
            'Dokter Ini Sudah Di Booking Di Tanggal Itu Atau Jam Itu',
        )
    ]

    nama = fields.Char(string="Dokter" ,required=True)
    booking_id = fields.One2many('clinic.booking', 'doctor_id')
    booking_time = fields.Datetime(string="Booking Terakhir", compute="_compute_booking_time", readonly=True)
    booking_finish = fields.Datetime(string="Booking Selesai", compute="_compute_booking_finish")

    def compute_total_doctors(self):
        return self.search_count([])

    @api.depends('booking_id')
    def _compute_booking_time(self):
        for record in self:
            if record.booking_id:
                latest_booking = max(record.booking_id, key=lambda b: b.delivery_hour or fields.Datetime.now())
                record.booking_time = latest_booking.delivery_hour
            else:
                record.booking_time = False
    def _compute_booking_finish(self):
        for record in self:
            if record.booking_id:
                finish_booking = max(record.booking_id, key=lambda b: b.finish_hour or fields.Datetime.now())
                record.booking_finish = finish_booking.finish_hour
            else:
                record.booking_finish = False

