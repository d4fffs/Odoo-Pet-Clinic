/** @odoo-module **/

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { KpiCard } from "./kpi_card/kpi_card";
import { LongKpi } from "./kpi_card/long_kpi";
import { BookingTable } from "./table/booking_table";
import { loadJS } from "@web/core/assets";
import { GraphCanvas } from "./graph_canvas/graph_canvas";


const { Component, onWillStart, onWillUnmount, useState } = owl;

export class OwlSalesDashboard extends Component {
    setup() {
        this.orm = useService("orm");
        this.action = useService("action");

        this.toggleDarkMode = () => {
            this.state.isDarkMode = !this.state.isDarkMode;
            document.documentElement.classList.toggle("dark-mode", this.state.isDarkMode);
        };


        this.onTableNewClick = () => {
            this.action.doAction({
                type: "ir.actions.act_window",
                name: 'Booking',
                res_model: 'clinic.booking',
                view_mode: "form",
                views: [
                    [false, "form"]
                ],
            });
        };

        this.onOpenPetListClick = () => {
            this.action.doAction({
                type: "ir.actions.act_window",
                name: "Daftar Hewan",
                res_model: "clinic.pet",
                view_mode: "tree,form",
                views: [[false, "tree"], [false, "form"]],
            });
        };

        this.onOpenServiceListClick = () => {
            this.action.doAction({
                type: "ir.actions.act_window",
                name: "Layanan",
                res_model: "clinic.service",
                view_mode: "tree,form",
                views: [[false, "tree"], [false, "form"]],
            });
        };

        this.state = useState({
            totalBookings: 0,
            totalPets: 0,
            totalDoctors: 0,
            totalServices: 0,
            totalRevenue: 0,
            totalLoss: 0,
            petsCall: [],
            doctorsCall: [],
            servicesCall: [],
            statusCall: [],
            selectedFilter: "today",
            isAutoRefreshing: false,
            isRefreshing: false,
            isDarkMode: false
        });

        this.getDateRange = (filter) => {
            const today = new Date();
            let start, end;
            const day = today.getDay() || 7;

            switch (filter) {
                case "yesterday":
                    start = new Date(today);
                    start.setDate(today.getDate() - 1);
                    end = new Date(start);
                    break;

                case "this_week":
                    start = new Date(today);
                    start.setDate(today.getDate() - day + 1);
                    end = new Date(today);
                    break;

                case "last_week":
                    start = new Date(today);
                    start.setDate(today.getDate() - day - 6);
                    end = new Date(start);
                    end.setDate(start.getDate() + 6);
                    break;

                case "this_month":
                    start = new Date(today.getFullYear(), today.getMonth(), 1);
                    end = new Date(today);
                    break;

                case "last_month":
                    start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    end = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month
                    break;

                case "this_year":
                    start = new Date(today.getFullYear(), 0, 1);
                    end = new Date(today);
                    break;

                case "last_year":
                    start = new Date(today.getFullYear() - 1, 0, 1);
                    end = new Date(today.getFullYear() - 1, 11, 31);
                    break;

                default: // "today"
                    start = new Date(today);
                    end = new Date(today);
                    break;
            }

            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            return [start.toISOString(), end.toISOString()];
        };



        const rupiahFormat = new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        });

        this.refreshData = async () => {
            this.state.isRefreshing = true;
            try {
                const [startDate, endDate] = this.getDateRange(this.state.selectedFilter);

                const dateDomain = [["booking_date", ">=", startDate], ["booking_date", "<=", endDate]];
                const commonDomain = [["booking_id.booking_date", ">=", startDate], ["booking_id.booking_date", "<=", endDate]];

                // KPI COUNT
                this.state.totalBookings = await this.orm.call("clinic.booking", "search_count", [dateDomain]);
                this.state.hasBookingData = this.state.totalBookings > 0;
                this.state.totalPets = await this.orm.call("clinic.pet", "search_count", [commonDomain]);
                this.state.totalDoctors = await this.orm.call("clinic.doctor", "search_count", [commonDomain]);
                this.state.totalServices = await this.orm.call("clinic.service", "search_count", [commonDomain]);

                // KPI TOTAL REVENUE & LOSS
                const productPets = await this.orm.searchRead("product.pet", commonDomain, ["subtotal"]);
                let totalRevenue = 0;
                let totalLoss = 0;

                for (const p of productPets) {
                    const val = p.subtotal || 0;
                    totalRevenue += val;
                    // Contoh logika: anggap biaya tetap 20% sebagai kerugian
                    totalLoss += val * 0.2;
                }

                this.state.totalRevenue = totalRevenue;
                this.state.totalRevenueFormatted = rupiahFormat.format(totalRevenue);

                this.state.totalLoss = totalLoss;
                this.state.totalLossFormatted = rupiahFormat.format(totalLoss);

                // CHART DATA
                const [bookings, doctors, pets, services] = await Promise.all([
                    this.orm.searchRead("clinic.booking", dateDomain, ["customer_id", "pet_id"]),
                    this.orm.searchRead("clinic.doctor", commonDomain, ["nama", "booking_id"]),
                    this.orm.searchRead("clinic.animal", [], ["nama_hewan", "pet_id"]),
                    this.orm.searchRead("clinic.service", [], ["nama_layanan", "pet_id"]),
                ]);

                this.state.petsCall = pets.map(b => ({
                    name: b.nama_hewan || "Tanpa Nama",
                    value: Array.isArray(b.pet_id) ? b.pet_id.length : 0,
                }));

                this.state.doctorsCall = doctors.map(d => ({
                    name: d.nama || "Tidak Diketahui",
                    value: Array.isArray(d.booking_id) ? d.booking_id.length : 0,
                }));

                this.state.servicesCall = services.map(s => ({
                    name: s.nama_layanan || "Tanpa Nama",
                    value: Array.isArray(s.pet_id) ? s.pet_id.length : 0,
                }));

                // === TAMBAHAN: Data Status Booking untuk Chart ===
                const statusResult = await this.orm.call("clinic.booking", "get_booking_status_count", [startDate, endDate]);
                console.log("Status Booking Data:", statusResult);
                this.state.statusCall = statusResult;

            } catch (err) {
                console.error("Gagal memuat data:", err);
            } finally {
                this.state.isRefreshing = false;
            }
        };


        this.onDateFilterChange = (ev) => {
            this.state.selectedFilter = ev.target.value;
            this.refreshData();
        };

        this.toggleAutoRefresh = () => {
            if (this.state.isAutoRefreshing) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            } else {
                this.intervalId = setInterval(this.refreshData, 5000);
            }
            this.state.isAutoRefreshing = !this.state.isAutoRefreshing;
        };

        onWillStart(async () => {
            await loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js");
            await this.refreshData();
        });

        onWillUnmount(() => {
            if (this.intervalId) clearInterval(this.intervalId);
        });
    }
}

OwlSalesDashboard.template = "owl.OwlSalesDashboard";
OwlSalesDashboard.components = { KpiCard, LongKpi, GraphCanvas, BookingTable };
registry.category("actions").add("owl.sales_dashboard", OwlSalesDashboard);
