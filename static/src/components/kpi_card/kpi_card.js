/** @odoo-module */

const {Component, onWillStart, useState} = owl
import { useService } from "@web/core/utils/hooks";

export class KpiCard extends Component {
    
    static props = ['title', 'img', 'value', 'model', 'domain']

    setup() {
        this.action = useService("action");
        this.orm = useService("orm");
        this.state = useState({ 
            totalDoctors: 0,
            totalBookings: 0,
            totalPets: 0,
        });

        onWillStart(async () => {
            const doctorCount = await this.orm.call("clinic.doctor", "search_count", [[]]);
            const bookingCount = await this.orm.call("clinic.booking", "search_count", [[]]);
            const petCount = await this.orm.call("clinic.pet", "search_count", [[]]);
            this.state.totalDoctors = doctorCount;
            this.state.totalBookings = bookingCount;
            this.state.totalPets = petCount;
        }); 

        this.onCardClick = () => {
            if (this.props.model) {
                this.action.doAction({
                    type: "ir.actions.act_window",
                    name: this.props.title,
                    res_model: this.props.model,
                    view_mode: "list,tree,form,kanban",
                    views: [
                        [false, "tree"],
                        [false, "form"]
                    ],
                    domain: Array.isArray(this.props.domain) ? this.props.domain : [],
                });
            }
        };

    }
}   

KpiCard.template = "owl.KpiCard"    