import { useEffect, useState } from "react";

export interface DeploymentLinks {
  owner: string;
  repo: string;
  pagesBase: string;
  pagesUrl: string;
  workerBase: string;
  workerUrl: string;
  masterBase: string;
  masterUrl: string;
  repoUrl: string;
  actionsUrl: string;
  guiaUrl: string;
  descargasUrl?: string;
  releasesUrl?: string;
}

export function useDeploymentLinks(): DeploymentLinks | null {
  const [links, setLinks] = useState<DeploymentLinks | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}deployment.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DeploymentLinks | null) => setLinks(data))
      .catch(() => setLinks(null));
  }, []);

  return links;
}
