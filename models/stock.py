from odoo import models

class StockQuant(models.Model):
    _inherit = "stock.quant"

    def compute_total_stock(self):
        total = sum(self.search([]).mapped("available_quantity"))
        return total
