/** @odoo-module */

const { Component, onWillStart, useState } = owl
import { useService } from "@web/core/utils/hooks";

export class LongKpi extends Component {

    static props = ['title', 'img', 'value']

    setup() {
        this.orm = useService("orm");
        this.state = useState({
            totalRevenue: 0,
            totalLoss: 0,
        });

        onWillStart(async () => {
            const products = await this.orm.searchRead("product.pet", [], ["subtotal"]);

            let totalRevenue = 0;
            for (const product of products) {
                totalRevenue += product.subtotal || 0;
            }
        });
    }
}

LongKpi.template = "owl.LongKpi"