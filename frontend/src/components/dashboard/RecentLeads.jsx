import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Spinner } from '../ui/Spinner';

export function RecentLeads() {
  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await api.get('/leads?limit=5&sortBy=createdAt:desc');
      return data.data;
    },
  });

  return (
    <div>
      {leadsQuery.isLoading && <Spinner />}
      {leadsQuery.data && (
        <ul>
          {leadsQuery.data.map((lead) => (
            <li key={lead.id}>
              <strong>{lead.name}</strong> - {lead.source}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
