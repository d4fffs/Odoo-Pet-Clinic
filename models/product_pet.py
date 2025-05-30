from odoo import fields, api, models

class ProductPet(models.Model):
    _name = 'product.pet'
    _description = 'Produk Peliharaan'
    _rec_name = 'product_id'

    id_pet = fields.Many2one('clinic.pet', string="Nama Hewan")
    booking_id = fields.Many2one('clinic.booking')
    product_id = fields.Many2one('product.product', string="Produk")
    name = fields.Char(related='product_id.name', String="Nama Produk")
    stock = fields.Float(related='product_id.qty_available', String="Stok")
    price_unit = fields.Float(string="Harga Satuan", related='product_id.list_price', store=True)
    quantity = fields.Integer(string="Jumlah", default=1, required=True)
    buy_product = fields.Integer(string="Jumlah")
    subtotal = fields.Float(string="Subtotal", compute="_compute_subtotal", store=True)

    @api.depends('quantity', 'price_unit')
    def _compute_subtotal(self):
        for rec in self:
            rec.subtotal = rec.quantity * rec.price_unit

    def compute_total_product(self):
        return self.search_count([])