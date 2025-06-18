from odoo import models, fields, api
from odoo.exceptions import UserError


class ClinicBookingPaymentWizard(models.TransientModel):
    _name = "clinic.booking.payment.wizard"
    _description = "Wizard Pembayaran Booking Klinik"

    booking_id = fields.Many2one("clinic.booking", string="Booking", required=True)
    customer_id = fields.Many2one(
        related="booking_id.customer_id", string="Customer", readonly=True
    )
    booking_date = fields.Date(
        related="booking_id.booking_date", string="Tanggal Booking", readonly=True
    )
    delivery_hour = fields.Datetime(
        related="booking_id.delivery_hour", string="Jam Antar", readonly=True
    )
    finish_hour = fields.Datetime(
        related="booking_id.finish_hour", string="Jam Selesai", readonly=True
    )

    pet_ids = fields.One2many(related="booking_id.pet_id", string="Peliharaan")
    product_ids = fields.One2many(related="booking_id.product", string="Produk")

    total_booking_amount = fields.Float(
        string="Total Tagihan",
        related="booking_id.total_revenue",
        readonly=True,
    )

    amount = fields.Float(
        string="Jumlah yang Dibayarkan",
        required=True,
    )

    payment_method = fields.Selection(
        [
            ("cash", "Tunai"),
            ("transfer", "Transfer Bank"),
            ("qris", "QRIS"),
        ],
        string="Metode Pembayaran",
        required=True,
    )

    @api.model
    def default_get(self, fields_list):
        res = super().default_get(fields_list)
        active_id = self.env.context.get("active_id")
        if active_id:
            res["booking_id"] = active_id
        if "payment_method" in fields_list:
            res["payment_method"] = "cash"
        return res

    def action_confirm_payment(self):
        if self.booking_id.payment_status == "paid":
            raise UserError("Booking ini sudah dibayar.")

        if self.amount <= 0:
            raise UserError("Jumlah bayar tidak valid.")

        total_tagihan = self.booking_id.total_revenue

        if self.amount < total_tagihan:
            raise UserError(
                f"Jumlah bayar kurang dari total tagihan!\n"
                f"Total tagihan: Rp {total_tagihan:,.0f}, Jumlah bayar: Rp {self.amount:,.0f}"
            )

        # 1. Buat Invoice
        invoice = self.env["account.move"].create({
            "move_type": "out_invoice",
            "partner_id": self.booking_id.customer_id.id,
            "invoice_date": fields.Date.context_today(self),
            "invoice_origin": self.booking_id.booking_id,
            "invoice_line_ids": [(0, 0, {
                "name": f"Pembayaran Booking: {self.booking_id.booking_id}",
                "quantity": 1.0,
                "price_unit": self.booking_id.total_revenue,
                "account_id": self.env["account.account"]
                    .search([("account_type", "=", "income")], limit=1)
                    .id,
            })],
        })

        # 2. Post invoice
        invoice.action_post()

        # 3. Register payment otomatis
        journal = self.env["account.journal"].search([
            ("type", "=", "cash" if self.payment_method == "cash" else "bank")
        ], limit=1)

        if not journal:
            raise UserError("Journal untuk metode pembayaran tidak ditemukan.")

        payment_method_line = self.env["account.payment.method.line"].search([
            ("journal_id", "=", journal.id),
            ("payment_method_id.name", "=", "Manual")
        ], limit=1)

        if not payment_method_line:
            raise UserError("Metode pembayaran tidak ditemukan di jurnal tersebut.")

        payment_register = self.env["account.payment.register"].with_context(
            active_model="account.move",
            active_ids=invoice.ids
        ).create({
            "amount": invoice.amount_total,
            "payment_date": fields.Date.context_today(self),
            "journal_id": journal.id,
            "payment_method_line_id": payment_method_line.id,
        })

        payment_register.action_create_payments()

        # 4. Update status booking + tautkan invoice
        self.booking_id.write({
            "payment_status": "paid",
            "payment_method": self.payment_method,
            "invoice_id": invoice.id,
        })

        # 5. Hitung kembaliany
        kembalian = self.amount - total_tagihan
        if kembalian == 0:
            message = "Pembayaran berhasil!\nUang pas, tidak ada kembalian."
        else:
            message = f"Pembayaran berhasil!\nKembalian: Rp {kembalian:,.0f}"

        # 6. Tampilkan notifikasi
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": "Pembayaran Sukses",
                "message": message,
                "type": "success",
                "sticky": False,
            },
        }