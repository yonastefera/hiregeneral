import type { JobSourceAdapter } from "../source";
import { fetchPlayrixJobs } from "./playrix";
import { fetchAvatureJobs } from "./avature";
import { fetchMCloudJobs } from "./mcloud";
import { fetchGoldmanHigherJobs } from "./goldman-higher";
import { fetchActivateJobs } from "./activate";
import { fetchEightfoldJobs } from "./eightfold";
import { fetchTargetJobs } from "./target";
import { fetchWalmartJobs } from "./walmart";
import { fetchYahooJobs } from "./yahoo";
import { fetchTalentBrewJobs } from "./talentbrew";
import { fetchStgHavasJobs } from "./stg-havas";
import { fetchAppcastJobs } from "./appcast";
import { fetchFoxJobs } from "./fox";
import { fetchAttraxJobs } from "./attrax";
import { fetchFedExPreloadJobs } from "./fedex-preload";
import { fetchParadoxPreloadJobs } from "./paradox-preload";
import { fetchJibeJobs } from "./jibe";
import { fetchKulaJobs } from "./kula";
import { fetchSuccessFactorsTileJobs } from "./successfactors-tile";
import { fetchNlxSolrJobs } from "./nlx-solr";
import { fetchCoveoJobs } from "./coveo";
import { fetchIcimsJobs } from "./icims";
import { fetchSouthernGlazersJobs } from "./southern-glazers";
import { fetchRokuJobs } from "./roku-careers";
import { fetchAtomFeedJobs } from "./atom-feed";

type ScraperFetcher = JobSourceAdapter["fetchJobs"];

export const scraperFetchers = new Map<string, ScraperFetcher>([
  ["playrix", fetchPlayrixJobs],
  ["avature", fetchAvatureJobs],
  ["mcloud", fetchMCloudJobs],
  ["goldman-higher", fetchGoldmanHigherJobs],
  ["activate", fetchActivateJobs],
  ["eightfold", fetchEightfoldJobs],
  ["target", fetchTargetJobs],
  ["walmart", fetchWalmartJobs],
  ["yahoo", fetchYahooJobs],
  ["talentbrew", fetchTalentBrewJobs],
  ["stg-havas", fetchStgHavasJobs],
  ["appcast", fetchAppcastJobs],
  ["fox", fetchFoxJobs],
  ["attrax", fetchAttraxJobs],
  ["fedex-preload", fetchFedExPreloadJobs],
  ["paradox-preload", fetchParadoxPreloadJobs],
  ["jibe", fetchJibeJobs],
  ["kula", fetchKulaJobs],
  ["successfactors-tile", fetchSuccessFactorsTileJobs],
  ["nlx-solr", fetchNlxSolrJobs],
  ["coveo", fetchCoveoJobs],
  ["icims", fetchIcimsJobs],
  ["southern-glazers", fetchSouthernGlazersJobs],
  ["roku-careers", fetchRokuJobs],
  ["atom-feed", fetchAtomFeedJobs],
]);

export const scraperAdapter: JobSourceAdapter = {
  type: "scraper",
  fetchJobs(source, context) {
    const configured = source.metadata.adapter ?? source.metadata.scraper;
    const adapter = typeof configured === "string" ? configured.trim() : "";
    const fetchJobs = scraperFetchers.get(adapter);

    if (!fetchJobs) {
      throw new Error(
        `No scraper adapter configured for ${source.companyName} (${source.sourceSlug})`,
      );
    }

    return fetchJobs(source, context);
  },
};
