import { useEffect, useState } from "react";
import { buildReleasesApiUrl, type PlatformDownloadSpec } from "@spe/shared";
import type { DeploymentLinks } from "./useDeploymentLinks";

export interface ReleaseAsset {
  name: string;
  browserDownloadUrl: string;
  size: number;
}

export interface ResolvedPlatformDownload {
  spec: PlatformDownloadSpec;
  href: string;
  available: boolean;
  assetName?: string;
}

interface ReleaseState {
  loading: boolean;
  tagName: string | null;
  assets: ReleaseAsset[];
  platforms: ResolvedPlatformDownload[];
}

function matchAsset(
  assets: ReleaseAsset[],
  pattern: string | undefined,
): ReleaseAsset | undefined {
  if (!pattern) return undefined;
  const re = new RegExp(pattern, "i");
  return assets.find((a) => re.test(a.name));
}

function resolvePlatforms(
  specs: PlatformDownloadSpec[],
  assets: ReleaseAsset[],
  base: DeploymentLinks,
): ResolvedPlatformDownload[] {
  return specs.map((spec) => {
    const asset = matchAsset(assets, spec.assetPattern);
    if (asset) {
      return {
        spec,
        href: asset.browserDownloadUrl,
        available: true,
        assetName: asset.name,
      };
    }
    const fallback = spec.fallbackHref?.({
      pagesUrl: base.pagesUrl,
      repoUrl: base.repoUrl,
      actionsUrl: base.actionsUrl,
      owner: base.owner,
      repo: base.repo,
    });
    return {
      spec,
      href: fallback ?? base.repoUrl,
      available: spec.id === "web" || spec.id === "ios",
      assetName: undefined,
    };
  });
}

export function useReleaseAssets(
  deployLinks: DeploymentLinks | null,
  platformSpecs: PlatformDownloadSpec[],
): ReleaseState {
  const [state, setState] = useState<ReleaseState>({
    loading: true,
    tagName: null,
    assets: [],
    platforms: [],
  });

  useEffect(() => {
    if (!deployLinks) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const apiUrl = buildReleasesApiUrl(deployLinks.owner, deployLinks.repo);

    void fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error("sin release");
        return res.json() as Promise<{
          tag_name: string;
          assets: Array<{ name: string; browser_download_url: string; size: number }>;
        }>;
      })
      .then((data) => {
        const assets: ReleaseAsset[] = data.assets.map((a) => ({
          name: a.name,
          browserDownloadUrl: a.browser_download_url,
          size: a.size,
        }));
        setState({
          loading: false,
          tagName: data.tag_name,
          assets,
          platforms: resolvePlatforms(platformSpecs, assets, deployLinks),
        });
      })
      .catch(() => {
        setState({
          loading: false,
          tagName: null,
          assets: [],
          platforms: resolvePlatforms(platformSpecs, [], deployLinks),
        });
      });
  }, [deployLinks, platformSpecs]);

  return state;
}
