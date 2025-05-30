/** @odoo-module */
import { useService } from "@web/core/utils/hooks";
const { Component, useRef, onMounted, onWillUpdateProps } = owl;

export class GraphCanvas extends Component {
    static props = ['title', 'type', 'width', 'height', 'data'];

    setup() {
        this.graphPie = useRef("pie");
        this.chartInstance = null;
        this.orm = useService("orm");

        onMounted(() => this.renderChart());
        onWillUpdateProps(() => this.renderChart());
    }

    renderChart() {
        const ctx = this.graphPie.el;
        const data = this.props.data || [];

        const labels = data.map(d => d.name);
        const values = data.map(d => d.value);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Set canvas height from props
        if (this.props.height) {
            ctx.height = this.props.height;
        }
        const pastelShades = [
            '#B332CD', // Ungu terang
            '#CD329A', // Magenta
            '#6532CD', // Ungu tua

            // Warna kontras
            '#32CD99', // Hijau mint terang
            '#FFCC00', // Kuning terang
            '#00B4D8', // Biru kehijauan terang
        ];


        const backgroundColors = values.map((_, i) => pastelShades[i % pastelShades.length]);
        const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

        this.chartInstance = new Chart(ctx, {
            type: this.props.type,
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Hewan',
                        data: values,
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutBounce'
                },
                plugins: {
                    legend: {
                        display: this.props.type !== 'bar',
                        position: 'bottom',
                        labels: {
                            padding: 24,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            color: '#000000',
                            font: {
                                weight: 'semibold'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: this.props.title,
                        color: '#000000',
                        font: {
                            size: 24,
                            weight: 'semibold',
                            family: 'Poppins'
                        },
                        position: 'bottom'
                    }
                },
                scales: this.props.type === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#6B21A8'
                        },
                        grid: {
                            color: 'rgba(168, 85, 247, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#6B21A8'
                        },
                        grid: {
                            color: 'rgba(168, 85, 247, 0.05)'
                        }
                    }
                } : {}
            }
        });
    }
}

GraphCanvas.template = "owl.GraphCanvas";
