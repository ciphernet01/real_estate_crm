import { Link, useLocation } from 'react-router-dom';

const breadcrumbLabelMap = {
  'leads': 'Leads',
  'properties': 'Properties',
  'clients': 'Clients',
  'deals': 'Deals',
  'reports': 'Reports',
  'settings': 'Settings',
  '': 'Overview'
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      {pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const label = breadcrumbLabelMap[segment] || segment;
        const isLast = index === pathSegments.length - 1;

        return (
          <span key={path}>
            <span>/</span>
            {isLast ? (
              <span>{label}</span>
            ) : (
              <Link to={path}>{label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
