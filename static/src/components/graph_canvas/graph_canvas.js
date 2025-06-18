/** @odoo-module */
import { useService } from "@web/core/utils/hooks";
const { Component, useRef, onMounted, onWillUpdateProps } = owl;

export class GraphCanvas extends Component {
    static props = ['title', 'type', 'width', 'height', 'data', 'isDarkMode'];

    setup() {
        this.graphPie = useRef("pie");
        this.chartInstance = null;
        this.orm = useService("orm");

        onMounted(() => this.renderChart());
        onWillUpdateProps(() => this.renderChart());
    }

    renderChart() {
    // Tunggu satu frame supaya canvas tersedia (penting saat switch dark mode cepat)
    requestAnimationFrame(() => {
        const ctx = this.graphPie.el;
        if (!ctx) return; // stop jika canvas belum siap

        const data = this.props.data || [];
        const isDarkMode = this.props.isDarkMode;

        const textColor = isDarkMode ? '#FFFFFF' : '#000000';
        const gridColorY = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(168, 85, 247, 0.1)';
        const gridColorX = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(168, 85, 247, 0.05)';

        const labels = data.map(d => d.name);
        const values = data.map(d => d.value);

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        if (this.props.height) {
            ctx.height = this.props.height;
        }

        const lightModeColors = ['#B332CD', '#CD329A', '#6532CD', '#32CD99', '#FFCC00', '#00B4D8'];
        const darkModeColors  = ['#FFD700', '#FF69B4', '#00CED1', '#7CFC00', '#FF8C00', '#1E90FF'];

        const backgroundColors = values.map((_, i) =>
            isDarkMode ? darkModeColors[i % darkModeColors.length] : lightModeColors[i % lightModeColors.length]
        );

        this.chartInstance = new Chart(ctx, {
            type: this.props.type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Hewan',
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors,
                    borderWidth: 1.5
                }]
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
                            color: textColor,
                            font: {
                                family: 'Poppins',
                                weight: 'normal'
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: this.props.title,
                        color: textColor,
                        font: {
                            size: 14,
                            weight: 'normal',
                            family: 'Poppins'
                        },
                        position: 'bottom'
                    }
                },
                scales: this.props.type === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor },
                        grid: { color: gridColorY }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColorX }
                    }
                } : {}
            }
        });
    });
}

}

GraphCanvas.template = "owl.GraphCanvas";
