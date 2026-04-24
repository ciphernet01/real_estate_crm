import { useQuery } from '@tanstack/react-query';
import { Chart } from 'chart.js';
import { useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Spinner } from '../ui/Spinner';

export function SalesChart() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const reportsQuery = useQuery({
    queryKey: ['reports-overview'],
    queryFn: async () => {
      const { data } = await api.get('/reports/overview');
      return data.data;
    },
  });

  useEffect(() => {
    if (reportsQuery.data && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: reportsQuery.data.revenueByMonth.map((item) => item.month),
          datasets: [
            {
              label: 'Revenue',
              data: reportsQuery.data.revenueByMonth.map((item) => item.revenue),
              borderColor: '#818cf8',
              backgroundColor: 'rgba(129, 140, 248, 0.2)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              grid: {
                display: false,
              },
            },
            y: {
              grid: {
                color: '#374151',
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [reportsQuery.data]);

  return (
    <div>
      {reportsQuery.isLoading && <Spinner />}
      <canvas ref={chartRef} />
    </div>
  );
}
