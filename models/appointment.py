from odoo import models, fields, api

class Appointment(models.Model):
    _name = 'vet.appointment'
    _description = 'Vet Appointment'

    pet_id = fields.Many2one('vet.pet', string='Pet', required=True)
    owner_id = fields.Many2one(related='pet_id.owner_id', string='Owner', store=True)
    vet_id = fields.Many2one('res.partner', string='Veterinarian')
    datetime = fields.Datetime(string='Appointment Date & Time', required=True)
    description = fields.Text(string='Symptoms / Notes')
    calendar_event_id = fields.Many2one('calendar.event', string='Calendar Event', readonly=True)

    @api.model
    def create(self, vals):
        appointment = super().create(vals)
        event = self.env['calendar.event'].create({
            'name': "Vet Appointment - {appointment.pet_id.name}",
            'start': appointment.datetime,
            'stop': appointment.datetime,
            'partner_ids': [(6, 0, [appointment.owner_id.id, appointment.vet_id.id])],
            'description': appointment.description,
        })
        appointment.calendar_event_id = event.id
        return appointment
