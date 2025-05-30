from odoo import api, fields, models

class Hewan(models.Model):
    _name = 'clinic.pet'
    _description = 'Hewan Peliharaan'   
    _rec_name = 'nama_hewan'

    nama_hewan = fields.Many2one('clinic.animal', string="Nama Hewan", required=True)
    umur = fields.Char(string="Umur Hewan", required=True)
    pemilik = fields.Many2one('res.partner', string="Pemilik", required=True)
    kategori_id = fields.Many2one('clinic.pet.category', string="Jenis Hewan")
    layanan_id = fields.Many2one('clinic.service', string="Layanan")
    harga_layanan = fields.Monetary(string="Harga Layanan", currency_field="mata_uang_id", readonly=True)
    waktu_layanan = fields.Integer(related='layanan_id.waktu_layanan', string="Waktu Layanan", readonly=True)
    rate_layanan = fields.Float(related='kategori_id.rate', string="Rate", readonly=True)
    mata_uang_id = fields.Many2one('res.currency', string="Mata Uang", required=True, default=lambda self: self.env.company.currency_id)
    booking_id = fields.Many2one('clinic.booking', string="booking")
    booking_ids = fields.Char(related='booking_id.booking_id', string="booking")
    waktu_rate = fields.Integer(string="Waktu Layanan", compute="_compute_rate_time", store=True, readonly=True)
    jumlah_booking = fields.Integer(
    string="Jumlah Booking",
    compute="_compute_jumlah_booking",
    store=True,
    )   

    def compute_total_pets(self):
        return self.search_count([])

    @api.depends('waktu_layanan', 'rate_layanan')
    def _compute_rate_time(self):
        for record in self:
            if record.waktu_layanan and record.rate_layanan:
                after_duration = record.waktu_layanan * record.rate_layanan
                record.waktu_rate = after_duration
            else:
                record.waktu_rate = False
    