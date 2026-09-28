import type { EndpointStats } from '../data/simulation';
import { EndpointTable } from '../components/EndpointTable';

export interface EndpointsPageProps {
  endpoints: EndpointStats[];
}

export function EndpointsPage({ endpoints }: EndpointsPageProps) {
  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Endpoints</h1>
        <p className="page-subtitle">Request volume, latency, and error rate per route.</p>
      </header>
      <section aria-label="Endpoints">
        <EndpointTable endpoints={endpoints} />
      </section>
    </>
  );
}
