import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="page">
      <Empty title="Cette page n’existe pas">
        <Link to="/">Revenir à la vue d’ensemble</Link>
      </Empty>
    </div>
  );
}
