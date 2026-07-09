const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_ARCHIVE_BASE_URL = 'https://coverartarchive.org';
const DEFAULT_SEARCH_LIMIT = 10;
const MAX_SEARCH_LIMIT = 25;
const MUSICBRAINZ_REQUEST_SPACING_MS = 1100;

const RELEASE_GROUP_LOOKUP_INCLUDES = 'artist-credits+genres+tags+releases';
const RELEASE_LOOKUP_INCLUDES = 'artist-credits+labels+recordings+release-groups+media';

const LABEL_OVERRIDES = {
  'avant-garde jazz': 'Avant-Garde Jazz',
  'hip hop': 'Hip-Hop',
  'hip-hop': 'Hip-Hop',
  'lo-fi': 'Lo-Fi',
  'post-bop': 'Post-Bop',
  'r&b': 'R&B',
};

export class MusicBrainzError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'MusicBrainzError';
    this.status = status;
    this.payload = payload;
  }
}

let queuedRequest = Promise.resolve();
let nextRequestAt = 0;

function clampLimit(limit) {
  const normalizedLimit = Number(limit);

  if (!Number.isFinite(normalizedLimit)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(MAX_SEARCH_LIMIT, Math.max(1, Math.floor(normalizedLimit)));
}

function createAbortError() {
  if (typeof DOMException !== 'undefined') {
    return new DOMException('The operation was aborted.', 'AbortError');
  }

  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw signal.reason || createAbortError();
  }
}

function delay(ms, { signal } = {}) {
  if (!ms) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    function onAbort() {
      cleanup();
      reject(signal.reason || createAbortError());
    }

    function cleanup() {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
    }

    if (signal) {
      if (signal.aborted) {
        cleanup();
        reject(signal.reason || createAbortError());
        return;
      }

      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

async function scheduleMusicBrainzRequest(work, { signal } = {}) {
  const run = async () => {
    throwIfAborted(signal);

    const waitMs = Math.max(0, nextRequestAt - Date.now());
    if (waitMs > 0) {
      await delay(waitMs, { signal });
    }

    try {
      throwIfAborted(signal);
      return await work();
    } finally {
      nextRequestAt = Date.now() + MUSICBRAINZ_REQUEST_SPACING_MS;
    }
  };

  const pending = queuedRequest.then(run, run);
  queuedRequest = pending.then(
    () => undefined,
    () => undefined
  );

  return pending;
}

function buildRequestUrl(baseUrl, path, query = {}, { includeJsonFormat = true } = {}) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBaseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  if (includeJsonFormat) {
    url.searchParams.set('fmt', 'json');
  }

  return url;
}

function safeJsonParse(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fetchJson(url, { signal, headers } = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    signal,
  });

  const responseText = await response.text();
  const payload = safeJsonParse(responseText);

  if (!response.ok) {
    const message =
      payload?.error ||
      payload?.message ||
      response.statusText ||
      'MusicBrainz request failed';

    throw new MusicBrainzError(message, response.status, payload);
  }

  return payload;
}

async function musicBrainzRequest(path, { query, signal } = {}) {
  const url = buildRequestUrl(MUSICBRAINZ_BASE_URL, path, query);

  return scheduleMusicBrainzRequest(() => fetchJson(url, { signal }), { signal });
}

async function coverArtArchiveRequest(path, { signal } = {}) {
  const url = buildRequestUrl(COVER_ART_ARCHIVE_BASE_URL, path, {}, {
    includeJsonFormat: false,
  });

  try {
    return await fetchJson(url, { signal });
  } catch (error) {
    if (error instanceof MusicBrainzError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function formatLabel(value) {
  if (!value) {
    return '';
  }

  const normalized = value.trim().toLowerCase();
  if (LABEL_OVERRIDES[normalized]) {
    return LABEL_OVERRIDES[normalized];
  }

  return normalized
    .split(/([\s/-]+)/)
    .map((segment) => {
      if (!segment || /[\s/-]+/.test(segment)) {
        return segment;
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join('');
}

function formatArtistCredit(artistCredit = []) {
  if (!Array.isArray(artistCredit) || artistCredit.length === 0) {
    return 'Unknown Artist';
  }

  const formatted = artistCredit
    .map((credit) => `${credit?.name || credit?.artist?.name || ''}${credit?.joinphrase || ''}`)
    .join('')
    .trim();

  return formatted || 'Unknown Artist';
}

function normalizeGenres(entity) {
  const entries = Array.isArray(entity?.genres) && entity.genres.length > 0
    ? entity.genres
    : Array.isArray(entity?.tags)
      ? entity.tags
      : [];

  const seen = new Set();

  return entries
    .filter((entry) => entry?.name)
    .sort(
      (left, right) =>
        (right?.count || 0) - (left?.count || 0) ||
        left.name.localeCompare(right.name)
    )
    .map((entry) => formatLabel(entry.name))
    .filter((label) => {
      const normalized = label.toLowerCase();
      if (!label || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
}

function normalizeRelease(release = {}) {
  return {
    id: release.id,
    title: release.title || null,
    artist: Array.isArray(release['artist-credit'])
      ? formatArtistCredit(release['artist-credit'])
      : null,
    status: release.status || null,
    country: release.country || null,
    release_date: release.date || null,
    track_count: release['track-count'] ?? null,
  };
}

function getPrimaryCoverImage(coverArt) {
  if (!coverArt?.images?.length) {
    return null;
  }

  return (
    coverArt.images.find((image) => image.front) ||
    coverArt.images[0]
  );
}

function getCoverImageUrl(image, preferredSize = 500) {
  if (!image) {
    return null;
  }

  const preferredKey = String(preferredSize);

  return (
    image?.thumbnails?.[preferredKey] ||
    image?.thumbnails?.large ||
    image?.thumbnails?.small ||
    image?.image ||
    null
  );
}

function normalizeCoverArt(coverArt) {
  if (!coverArt) {
    return null;
  }

  const primaryImage = getPrimaryCoverImage(coverArt);

  return {
    release: coverArt.release || null,
    image_count: Array.isArray(coverArt.images) ? coverArt.images.length : 0,
    primary_image_url: getCoverImageUrl(primaryImage, 500),
    thumbnail_url: getCoverImageUrl(primaryImage, 250),
    images: Array.isArray(coverArt.images)
      ? coverArt.images.map((image) => ({
          id: image.id,
          front: Boolean(image.front),
          back: Boolean(image.back),
          approved: Boolean(image.approved),
          comment: image.comment || '',
          image_url: image.image || null,
          thumbnail_250_url: image?.thumbnails?.['250'] || image?.thumbnails?.small || null,
          thumbnail_500_url: image?.thumbnails?.['500'] || image?.thumbnails?.large || null,
          thumbnail_1200_url: image?.thumbnails?.['1200'] || null,
          types: Array.isArray(image.types) ? image.types : [],
        }))
      : [],
  };
}

export function buildMusicBrainzReleaseGroupCoverArtUrl(releaseGroupId, size = 500) {
  if (!releaseGroupId) {
    return null;
  }

  return `${COVER_ART_ARCHIVE_BASE_URL}/release-group/${releaseGroupId}/front-${size}`;
}

export function buildMusicBrainzReleaseCoverArtUrl(releaseId, size = 500) {
  if (!releaseId) {
    return null;
  }

  return `${COVER_ART_ARCHIVE_BASE_URL}/release/${releaseId}/front-${size}`;
}

export function mapMusicBrainzReleaseGroupToAlbumSummary(releaseGroup = {}) {
  return {
    id: releaseGroup.id,
    mbid: releaseGroup.id,
    title: releaseGroup.title || 'Untitled release',
    artist: formatArtistCredit(releaseGroup['artist-credit']),
    release_date: releaseGroup['first-release-date'] || null,
    genres: normalizeGenres(releaseGroup),
    avg_rating: null,
    cover_url: null,
    metadata_source: 'musicbrainz',
    type: releaseGroup['primary-type'] || 'Album',
    secondary_types: Array.isArray(releaseGroup['secondary-types'])
      ? releaseGroup['secondary-types']
      : [],
    disambiguation: releaseGroup.disambiguation || null,
    release_count: releaseGroup['release-count'] ?? null,
  };
}

export function mapMusicBrainzReleaseGroupToAlbumDetail(releaseGroup = {}, { coverArt } = {}) {
  const summary = mapMusicBrainzReleaseGroupToAlbumSummary(releaseGroup);
  const normalizedCoverArt = normalizeCoverArt(coverArt);

  return {
    ...summary,
    cover_url: normalizedCoverArt?.primary_image_url || null,
    releases: Array.isArray(releaseGroup.releases)
      ? releaseGroup.releases.map(normalizeRelease)
      : [],
    cover_art: normalizedCoverArt,
  };
}

export async function searchMusicBrainzReleaseGroups(
  query,
  { limit = DEFAULT_SEARCH_LIMIT, offset = 0, signal } = {}
) {
  const trimmedQuery = String(query || '').trim();

  if (!trimmedQuery) {
    return [];
  }

  const data = await musicBrainzRequest('/release-group', {
    query: {
      query: trimmedQuery,
      limit: clampLimit(limit),
      offset: Math.max(0, Number(offset) || 0),
    },
    signal,
  });

  return Array.isArray(data?.['release-groups']) ? data['release-groups'] : [];
}

export async function searchMusicBrainzAlbums(query, options) {
  const releaseGroups = await searchMusicBrainzReleaseGroups(query, options);
  return releaseGroups.map(mapMusicBrainzReleaseGroupToAlbumSummary);
}

export async function getMusicBrainzReleaseGroup(id, { signal } = {}) {
  return musicBrainzRequest(`/release-group/${id}`, {
    query: {
      inc: RELEASE_GROUP_LOOKUP_INCLUDES,
    },
    signal,
  });
}

export async function getMusicBrainzRelease(id, { signal } = {}) {
  return musicBrainzRequest(`/release/${id}`, {
    query: {
      inc: RELEASE_LOOKUP_INCLUDES,
    },
    signal,
  });
}

export async function getMusicBrainzReleaseGroupCoverArt(id, { signal } = {}) {
  return coverArtArchiveRequest(`/release-group/${id}`, { signal });
}

export async function getMusicBrainzAlbumById(
  id,
  { includeCoverArt = true, signal } = {}
) {
  const [releaseGroup, coverArt] = await Promise.all([
    getMusicBrainzReleaseGroup(id, { signal }),
    includeCoverArt ? getMusicBrainzReleaseGroupCoverArt(id, { signal }) : null,
  ]);

  return mapMusicBrainzReleaseGroupToAlbumDetail(releaseGroup, { coverArt });
}
