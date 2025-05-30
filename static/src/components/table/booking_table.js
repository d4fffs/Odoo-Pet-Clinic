/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class BookingTable extends Component {
    setup() {
        this.action = useService("action");
        this.orm = useService("orm");

        this.statusLabels = {
            menunggu: "Menunggu",
            terkonfirmasi: "Terkonfirmasi",
            dibatalkan: "Dibatalkan",
        };

        this.getStatusClass = function (status) {
            return {
                menunggu: "status-menunggu",
                terkonfirmasi: "status-terkonfirmasi",
                dibatalkan: "status-dibatalkan",
            }[status] || "status-menunggu";
        };

        this.onTableNewClick = () => {
            this.action.doAction({
                type: "ir.actions.act_window",
                name: "Booking Baru",
                res_model: "clinic.booking",
                view_mode: "form",
                views: [[false, "form"]],
            });
        };

        this.bookings = useState({ data: [] });

        onWillStart(async () => {
            const records = await this.orm.searchRead(
                "clinic.booking",
                [],
                ["customer_id", "booking_date", "status", "doctor_id", "delivery_hour", "finish_hour"]
            );

            
            records.sort((a, b) => new Date(b.booking_date) - new Date(a.booking_date));

            this.bookings.data = records;
        });
    }
}

BookingTable.template = "owl.BookingTable";
