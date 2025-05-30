from odoo import fields, api, models

class PetCategory(models.Model):
    _name = 'clinic.pet.category'
    _description = 'Kategori Hewan'
    _rec_name = 'jenis_hewan'

    jenis_hewan = fields.Char(string="Jenis Hewan")
    rate = fields.Float(string="Rate")
    
    def compute_total_pets_category(self):
        return self.search_count([])