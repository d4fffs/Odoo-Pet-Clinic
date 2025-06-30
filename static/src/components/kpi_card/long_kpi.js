/** @odoo-module */

const { Component, onWillStart, useState } = owl;
import { useService } from "@web/core/utils/hooks";

export class LongKpi extends Component {
    static props = ['title', 'img', 'value'];

    setup() {
        this.orm = useService("orm");
        this.state = useState({
            totalRevenue: 0,
            totalLoss: 0,
        });

        onWillStart(async () => {
            // 1. Cari booking yang sudah dibayar
            const paidBookingIds = await this.orm.search("clinic.booking", [
                ["payment_status", "=", "paid"]
            ]);

            // 2. Ambil semua product.pet yang berelasi dengan booking sudah dibayar
            const products = await this.orm.searchRead("product.pet", [
                ["booking_id", "in", paidBookingIds]
            ], ["subtotal"]);

            // 3. Hitung totalnya
            let totalRevenue = 0;
            for (const product of products) {
                totalRevenue += product.subtotal || 0;
            }

            this.state.totalRevenue = totalRevenue;
        });
    }
}

LongKpi.template = "owl.LongKpi";