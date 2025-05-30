from odoo import fields, models, api
from odoo.exceptions import ValidationError, UserError
from datetime import datetime, timedelta

class Booking(models.Model):
    _name = 'clinic.booking'
    _description = 'Booking'
    _rec_name = 'customer_id'

    customer_id = fields.Many2one('res.partner', string='Customer', required=True)
    booking_id = fields.Char(string='Booking ID', readonly=True, copy=False, default='New')
    no_telpon_client = fields.Char(related='customer_id.phone', string="Nomor Telepon")
    alamat_client = fields.Char(related='customer_id.street', string="Alamat")
    email_client = fields.Char(related='customer_id.email', string="Email")

    booking_date = fields.Date(default=fields.Datetime.now, string="Jadwal Booking")
    delivery_hour = fields.Datetime(default=fields.Datetime.now, string="Jam Antar")
    doctor_id = fields.Many2one('clinic.doctor', string="Dokter")
    finish_hour = fields.Datetime(string="Jam Selesai", compute='_compute_end_time', store=True, readonly=True)
    description = fields.Char(string="Deskripsi")
    status = fields.Selection(
        selection=[
            ('menunggu', 'Menunggu'),
            ('terkonfirmasi', 'Terkonfirmasi'),
            ('dibatalkan', 'Dibatalkan')
        ],
        default='menunggu'
    )

    pet_id = fields.One2many('clinic.pet', 'booking_id', string="Peliharaan", required=True)
    animal_id = fields.Many2one('clinic.animal', required=True)
    product = fields.One2many('product.pet', 'booking_id', string="Produk")
    total_revenue = fields.Float(string="Pendapatan", compute="_compute_total_revenue", store=True)
    service_id = fields.Many2one('clinic.service')

    @api.depends('product.subtotal')
    def _compute_total_revenue(self):
        for rec in self:
            rec.total_revenue = sum(line.subtotal for line in rec.product)

    def compute_total_bookings(self):
        return self.search_count([])

    def action_konfirmasi(self):
        for booking in self:
            if booking.status == 'terkonfirmasi':
                continue

            for line in booking.product:
                product = line.product_id
                if not product:
                    raise UserError("Produk belum dipilih.")
                quantity = line.quantity or 1
                stock_quant = self.env['stock.quant'].search([
                    ('product_id', '=', product.id),
                    ('location_id', '=', self.env.ref('stock.stock_location_stock').id),
                ], limit=1)

                if stock_quant and stock_quant.quantity >= quantity:
                    stock_quant.quantity -= quantity
                else:
                    raise UserError(f"Stok tidak mencukupi untuk {product.name}.")
            booking.status = 'terkonfirmasi'

    def action_batal(self):
        return self.write({"status": "dibatalkan"})

    @api.constrains('doctor_id', 'delivery_hour', 'finish_hour')
    def _check_doctor_availability(self):
        for visit in self:
            if not visit.delivery_hour or not visit.finish_hour:
                continue
            overlapping_visits = self.search([
                ('id', '!=', visit.id),
                ('doctor_id', '=', visit.doctor_id.id),
                ('delivery_hour', '<', visit.finish_hour),
                ('finish_hour', '>', visit.delivery_hour),
            ])
            if overlapping_visits:
                raise ValidationError(
                    f"Dokter {visit.doctor_id.name} sudah memiliki booking lain dalam waktu tersebut."
                )

    @api.model
    def create(self, vals):
        if vals.get('booking_id', 'New') == 'New':
            vals['booking_id'] = self.env['ir.sequence'].next_by_code('clinic.booking') or '/'
        return super().create(vals)

    def get_booking_count_by_customer(self):
        bookings = self.read_group(domain=[], fields=['customer_id'], groupby=['customer_id'])
        result = []
        for record in bookings:
            customer = self.env['res.partner'].browse(record['customer_id'][0])
            result.append({
                'name': customer.name,
                'bookings': record['customer_id_count'],
            })
        return result

    def get_booking_by_customer(self, start_date, end_date):
        domain = [("booking_date", ">=", start_date), ("booking_date", "<=", end_date)]
        bookings = self.read_group(domain=domain, fields=["customer_id"], groupby=["customer_id"], orderby="__count desc", limit=10)
        result = []
        for rec in bookings:
            customer = self.env["res.partner"].browse(rec["customer_id"][0])
            result.append({
                "name": customer.name,
                "value": rec["customer_id_count"],
            })
        return result

    @api.depends('delivery_hour', 'pet_id.waktu_layanan')
    def _compute_end_time(self):
        for record in self:
            if record.delivery_hour and record.pet_id.waktu_layanan:
                duration = timedelta(minutes=record.pet_id.waktu_layanan)
                record.finish_hour = record.delivery_hour + duration
            else:
                record.finish_hour = False

    def confirm_booking(self):
        self.status = 'terkonfirmasi'
        for product in self.product_ids:
            quant = self.env['stock.quant'].search([
                ('product_id', '=', product.id),
                ('location_id', '=', self.env.ref('stock.stock_location_stock').id)
            ])
            for q in quant:
                if q.quantity >= 1:
                    q.write({'quantity': q.quantity - 1})
                else:
                    raise ValueError(f"Stok untuk {product.name} tidak mencukupi.")

    # ✅ Tambahan Method untuk Chart Status Booking
    @api.model
    def get_booking_status_count(self, start_date, end_date):
        domain = [
            ('booking_date', '>=', start_date),
            ('booking_date', '<=', end_date)
        ]
        data = self.read_group(
            domain=domain,
            fields=['status'],
            groupby=['status']
        )
        status_map = dict(self._fields['status'].selection)
        result = []
        for rec in data:
            result.append({
                'name': status_map.get(rec['status'], 'Tidak diketahui'),
                'value': rec['status_count'],
            })
        return result
