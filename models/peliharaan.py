from odoo import fields, models, api

class Peliharaan(models.Model):
    _name = 'clinic.animal'
    _description = 'Animal'
    _rec_name = 'nama_hewan'

    nama_hewan = fields.Char(string="Nama Hewan")
    pet_id = fields.One2many('clinic.pet', 'nama_hewan', string="Hewan", readonly=True)
    booking_id = fields.One2many('clinic.booking', 'animal_id', readonly=True)