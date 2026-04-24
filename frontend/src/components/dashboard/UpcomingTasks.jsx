import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Spinner } from '../ui/Spinner';

export function UpcomingTasks() {
  const tasksQuery = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: async () => {
      const { data } = await api.get('/leads/reminders/upcoming?days=7');
      return data.data;
    },
  });

  return (
    <div>
      {tasksQuery.isLoading && <Spinner />}
      {tasksQuery.data && (
        <ul>
          {tasksQuery.data.map((task) => (
            <li key={task.id}>
              <strong>{task.title}</strong> - {new Date(task.dueAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
