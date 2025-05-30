from odoo import fields, api, models

class Layanan(models.Model):
    _name = 'clinic.service'
    _description = 'Layanan Klinik Hewan'
    _rec_name = 'nama_layanan'

    nama_layanan = fields.Char(string="Nama Layanan", required=True)
    waktu_layanan = fields.Integer(string="Waktu Layanan (Menit)", required=True)
    harga = fields.Monetary(string="Harga", currency_field='mata_uang_id', required=True )
    mata_uang_id = fields.Many2one('res.currency', string="Mata Uang", required=True, default=lambda self: self.env.company.currency_id)
    booking_id = fields.One2many('clinic.booking', 'service_id', string="Booking", readonly=True)
    pet_id = fields.One2many('clinic.pet', 'layanan_id', string="Hewan", readonly=True)

    def compute_total_services(self):
        return self.search_count([])
    