/** @odoo-module **/

import { Component, onWillStart, onMounted, useRef, useEffect } from "@odoo/owl";
import { loadJS } from "@web/core/assets";
import { useService } from "@web/core/utils/hooks";

export class ChartRenderer extends Component {
    static props = ['data', 'type', 'title'];

    setup() {
        this.chartRef = useRef("graph");
        this.chartInstance = null;
        this.actionService = useService("action");

        onWillStart(() =>
            loadJS("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js")
        );

        onMounted(() => this.renderChart());
        useEffect(() => this.renderChart(), () => [this.props.data]);
    }

    renderChart() {
        const canvas = this.chartRef.el;
        if (!canvas) return console.warn("Canvas belum tersedia");

        const ctx = canvas.getContext("2d");

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const data = Array.isArray(this.props.data) ? this.props.data : [];
        if (data.length === 0) {
            canvas.parentElement.innerHTML = "<p style='text-align:center;'>Tidak ada data untuk ditampilkan</p>";
            return;
        }

        const labels = data.map(d => d.name ?? "Tanpa Nama");
        const values = data.map(d => d.bookings ?? 0);

        const { backgroundColor, borderColor } = this.getColorScheme(data.length);

        this.chartInstance = new Chart(ctx, {
            type: this.props.type,
            data: {
                labels,
                datasets: [{
                    label: this.props.title || "Grafik",
                    data: values,
                    backgroundColor: this.props.type === "line" ? "transparent" : backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 2,
                    tension: this.props.type === "line" ? 0.4 : 0,
                    fill: false,
                }],
            },
            options: this.getChartOptions(labels),
        });
    }

    getColorScheme(length) {
        const PURPLE_TONES = [
            'rgba(125, 60, 152, 0.7)',   // ungu medium
            'rgba(155, 89, 182, 0.7)',   // ungu cerah
            'rgba(108, 52, 131, 0.7)',   // ungu tua
            'rgba(142, 68, 173, 0.7)',   // lavender deep
            'rgba(170, 122, 204, 0.7)',  // lavender soft
            'rgba(187, 143, 206, 0.7)',  // lavender muda
        ];

        const PURPLE_SOLID = PURPLE_TONES.map(c => c.replace('0.7', '1'));

        return {
            backgroundColor: Array.from({ length }, (_, i) =>
                this.props.type === "line" ? "transparent" : PURPLE_TONES[i % PURPLE_TONES.length]
            ),
            borderColor: Array.from({ length }, (_, i) => PURPLE_SOLID[i % PURPLE_SOLID.length]),
        };
    }

    getChartOptions(labels) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeOutQuart',
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: this.props.title || "Grafik",
                    position: "bottom",
                    color: '#7D3C98',
                    font: {
                        size: 16,
                        weight: 'bold',
                    },
                },
            },
            scales: this.props.type === "pie" ? {} : {
                y: {
                    beginAtZero: true,
                    precision: 0,
                    ticks: { color: '#5A2D82' },
                },
                x: {
                    ticks: { color: '#5A2D82' },
                },
            },
        };
    }
}

ChartRenderer.template = "owl.ChartRenderer";
