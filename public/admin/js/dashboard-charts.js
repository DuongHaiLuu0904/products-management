// Dashboard Statistics JavaScript
class DashboardCharts {
    constructor() {
        this.chart = null;
        this.init();
    }

    async init() {
        // Đợi DOM load xong
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initAfterDOM());
        } else {
            this.initAfterDOM();
        }
    }

    async initAfterDOM() {
        await this.loadStatistics('month');
        this.setupEventListeners();
    }

    async loadStatistics(period = 'month') {
        try {
            const response = await fetch(`/admin/dashboard/statistics?period=${period}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (Object.keys(data).length === 0) {
                this.createDemoChart(period);
            } else {
                this.renderChart(data, period);
            }
            
        } catch (error) {
            this.createDemoChart(period);
        }
    }

    createDemoChart(period) {
        // Hiển thị thông báo không có dữ liệu thay vì dữ liệu demo
        this.displayNoDataMessage(period);
    }

    renderChart(data, period) {
        // Chuẩn bị dữ liệu cho biểu đồ
        const dates = Object.keys(data).sort();
        const orderData = dates.map(date => data[date].orders);
        const revenueData = dates.map(date => Math.round(data[date].revenue));

        this.createChart(dates, orderData, revenueData, period);
    }

    createChart(labels, orderData, revenueData, period) {
        // Tạo container cho chart nếu chưa có
        let chartContainer = document.getElementById('revenue-chart-container');
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.id = 'revenue-chart-container';
            chartContainer.innerHTML = `
                <div class="mt-5 mb-4">
                    <h3 class="text-center">📊 Biểu đồ Doanh thu và Đơn hàng</h3>
                </div>
                <div class="chart-controls mb-3 text-center">
                    <button class="btn btn-sm btn-outline-primary period-btn" data-period="week">📅 Tuần</button>
                    <button class="btn btn-sm btn-primary period-btn" data-period="month">📅 Tháng</button>
                    <button class="btn btn-sm btn-outline-primary period-btn" data-period="year">📅 Năm</button>
                </div>
                <div class="chart-wrapper" style="height: 400px; position: relative; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    <canvas id="revenueChart"></canvas>
                </div>
                <div id="chart-summary" class="mt-3"></div>
            `;
            
            // Thêm vào trang
            const dashboardElement = document.querySelector('.dashboard-stats-row');
            if (dashboardElement) {
                dashboardElement.parentNode.insertBefore(chartContainer, dashboardElement.nextSibling);
            }
        }

        // Active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
            if (btn.dataset.period === period) {
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-primary');
            }
        });

        // Kiểm tra xem Chart.js có được load không
        if (typeof Chart !== 'undefined') {
            this.renderChartJS(labels, orderData, revenueData, period);
        } else {
            this.displaySimpleChart(labels, orderData, revenueData);
        }
    }

    renderChartJS(labels, orderData, revenueData, period) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) {
            return;
        }

        // Destroy existing chart if exists
        if (this.chart) {
            this.chart.destroy();
        }

        // Format labels for display
        const formattedLabels = labels.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
        });

        // Create gradient for revenue area
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(75, 192, 192, 0.8)');
        gradient.addColorStop(1, 'rgba(75, 192, 192, 0.1)');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedLabels,
                datasets: [
                    {
                        label: 'Doanh thu (VNĐ)',
                        data: revenueData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: gradient,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgb(75, 192, 192)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        yAxisID: 'y1'
                    },
                    {
                        label: 'Số đơn hàng',
                        data: orderData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4,
                        pointBackgroundColor: 'rgb(255, 99, 132)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Thống kê doanh thu và đơn hàng (${this.getPeriodLabel(period)})`,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Doanh thu: ${context.parsed.y.toLocaleString('vi-VN')} VNĐ`;
                                } else {
                                    return `Đơn hàng: ${context.parsed.y} đơn`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Ngày',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: '#2c3e50'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Số đơn hàng',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: 'rgb(255, 99, 132)'
                        },
                        grid: {
                            color: 'rgba(255, 99, 132, 0.1)'
                        },
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                return Number.isInteger(value) ? value : '';
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Doanh thu (VNĐ)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            color: 'rgb(75, 192, 192)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('vi-VN');
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    getPeriodLabel(period) {
        const labels = {
            'week': '7 ngày qua',
            'month': '1 tháng qua', 
            'year': '1 năm qua'
        };
        return labels[period] || 'Tất cả thời gian';
    }

    displaySimpleChart(labels, orderData, revenueData) {
        const chartSummary = document.getElementById('chart-summary');
        if (!chartSummary) return;

        let tableHTML = `
            <div class="simple-chart">
                <h4>📊 Thống kê theo ngày</h4>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>📅 Ngày</th>
                                <th>📦 Số đơn hàng</th>
                                <th>💰 Doanh thu (VNĐ)</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        labels.forEach((date, index) => {
            const formattedDate = new Date(date).toLocaleDateString('vi-VN');
            const revenue = revenueData[index].toLocaleString('vi-VN');
            tableHTML += `
                <tr>
                    <td>${formattedDate}</td>
                    <td class="text-center">${orderData[index]}</td>
                    <td class="text-end">${revenue}</td>
                </tr>
            `;
        });

        tableHTML += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        chartSummary.innerHTML = tableHTML;
    }

    displayNoDataMessage(period) {
        // Tạo container cho thông báo không có dữ liệu
        let chartContainer = document.getElementById('revenue-chart-container');
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.id = 'revenue-chart-container';
            
            // Thêm vào trang
            const dashboardElement = document.querySelector('.dashboard-stats-row');
            if (dashboardElement) {
                dashboardElement.parentNode.insertBefore(chartContainer, dashboardElement.nextSibling);
            }
        }

        chartContainer.innerHTML = `
            <div class="mt-5 mb-4">
                <h3 class="text-center">📊 Biểu đồ Doanh thu và Đơn hàng</h3>
            </div>
            <div class="chart-controls mb-3 text-center">
                <button class="btn btn-sm btn-outline-primary period-btn" data-period="week">📅 Tuần</button>
                <button class="btn btn-sm btn-primary period-btn" data-period="month">📅 Tháng</button>
                <button class="btn btn-sm btn-outline-primary period-btn" data-period="year">📅 Năm</button>
            </div>
            <div class="chart-wrapper text-center" style="height: 400px; position: relative; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;">
                <div>
                    <i class="fas fa-chart-bar fa-3x text-muted mb-3"></i>
                    <h4 class="text-muted">Không có dữ liệu để hiển thị</h4>
                    <p class="text-muted">Hiện tại chưa có dữ liệu thống kê cho ${this.getPeriodLabel(period)}</p>
                </div>
            </div>
        `;

        // Active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
            if (btn.dataset.period === period) {
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-primary');
            }
        });
    }

    setupEventListeners() {
        // Lắng nghe sự kiện click trên các nút thời gian
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('period-btn')) {
                const period = e.target.dataset.period;
                this.loadStatistics(period);
            }
        });
    }
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    new DashboardCharts();
});

// Export cho việc sử dụng khác
if (typeof window !== 'undefined') {
    window.DashboardCharts = DashboardCharts;
}
