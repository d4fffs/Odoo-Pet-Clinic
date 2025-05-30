from odoo import models, fields

class ClinicAttendee(models.Model):
    _name = 'clinic.attendee'
    _description = 'Clinic Booking Attendee'

    partner_id = fields.Many2one('res.partner', string='Contact', required=True)
    booking_id = fields.Many2one('clinic.booking', string='Booking')
    email = fields.Char(related='partner_id.email', store=True)
    name = fields.Char(related='partner_id.name', store=True)

    def name_get(self):
        return [(rec.id, rec.partner_id.name) for rec in self]
