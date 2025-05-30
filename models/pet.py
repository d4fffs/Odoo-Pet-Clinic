from odoo import models, fields

class Pet(models.Model):
    _name = 'vet.pet'
    _description = 'Pet'

    name = fields.Char(string='Name', required=True)
    species = fields.Selection([
        ('dog', 'Dog'),
        ('cat', 'Cat'),
        ('bird', 'Bird'),
        ('other', 'Other'),
    ], string='Species', required=True)
    birth_date = fields.Date(string='Birth Date')
    owner_id = fields.Many2one('res.partner', string='Owner')
    notes = fields.Text(string='Medical Notes')
