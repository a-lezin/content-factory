export interface ScoredVideo {
  video_id: string
  url: string
  platform: string
  geo: string
  views: number
  likes: number
  shares: number
  saves: number
  comments: number
  posted_at: string
  author_handle: string
  author_fans: number
  author_total_likes: number
  author_total_videos: number
  author_median_views: number
  caption: string
  search_query: string
  hashtags: string[]
  transcript: string | null
  comments_data: null
  outlier_score: number
  outlier_score_norm: number
  save_share_rate: number
  save_share_rate_norm: number
  velocity: number
  velocity_norm: number
  pain_density: number
  niche_score: number
}

export interface ScoreComponents {
  monetization: number
  outlier: number
  saveShare: number
  velocity: number
  painDensity: number
}

export interface VideoExtraction {
  video_url: string
  hook: string
  hook_type: string
  structure: string[]
  format: string
  novelty_element: string
  product_in_frame: string | null
  cta: string
  pacing: string
  sound_role: string
  template_replicability: number
  pain_points: string[]
  views: number
  shares: number
  saves: number
  author: string
  analyzed_at: string
}

export interface NicheDetail {
  project: string
  slug: string
  videos: ScoredVideo[]
  extractions: VideoExtraction[]
  report: string
  topScore: number | null
  medianScore: number | null
  topOutlier: number | null
  components: ScoreComponents | null
}

export interface NicheSummary {
  project: string
  slug: string
  topScore: number | null
  videoCount: number
  topOutlier: number | null
  hasData: boolean
}

export interface ProjectSummary {
  slug: string
  niches: NicheSummary[]
}
