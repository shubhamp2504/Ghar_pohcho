-- GharPahucho — Phase 2: Traffic Intelligence & PostGIS Database Schema
-- Migration: 20261104_traffic_intelligence.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. COMMUNITY TRAFFIC REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.traffic_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type VARCHAR(50) NOT NULL, -- 'HEAVY_TRAFFIC', 'ACCIDENT', 'WATERLOGGING', 'ROAD_CLOSURE', 'CONSTRUCTION', 'TOLL_QUEUE', 'HAZARD'
    road_name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_geom GEOGRAPHY(Point, 4326),
    reporter_device_hash VARCHAR(64) NOT NULL,
    confidence_score INT DEFAULT 1,
    confirm_count INT DEFAULT 0,
    cleared_count INT DEFAULT 0,
    worse_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLEARED', 'EXPIRED', 'FLAGGED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 minutes')
);

-- Automatically populate geography column from lat/lng
CREATE OR REPLACE FUNCTION update_traffic_report_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location_geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_traffic_reports_geom ON public.traffic_reports;
CREATE TRIGGER trg_traffic_reports_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.traffic_reports
FOR EACH ROW EXECUTE FUNCTION update_traffic_report_geom();

-- Spatial & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_traffic_reports_geom ON public.traffic_reports USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_traffic_reports_status_expires ON public.traffic_reports (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_traffic_reports_reporter ON public.traffic_reports (reporter_device_hash, created_at);

-- 2. COMMUNITY CONFIRMATIONS TABLE
CREATE TABLE IF NOT EXISTS public.traffic_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.traffic_reports(id) ON DELETE CASCADE,
    confirmation_type VARCHAR(20) NOT NULL CHECK (confirmation_type IN ('STILL_HERE', 'CLEARED', 'WORSE')),
    device_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (report_id, device_hash)
);

CREATE INDEX IF NOT EXISTS idx_confirmations_report ON public.traffic_confirmations (report_id);

-- Trigger to recalculate confidence score & counts on confirmation
CREATE OR REPLACE FUNCTION update_report_confidence()
RETURNS TRIGGER AS $$
DECLARE
    r_confirm INT;
    r_worse INT;
    r_cleared INT;
    new_confidence INT;
BEGIN
    SELECT 
        COUNT(*) FILTER (WHERE confirmation_type = 'STILL_HERE'),
        COUNT(*) FILTER (WHERE confirmation_type = 'WORSE'),
        COUNT(*) FILTER (WHERE confirmation_type = 'CLEARED')
    INTO r_confirm, r_worse, r_cleared
    FROM public.traffic_confirmations
    WHERE report_id = NEW.report_id;

    new_confidence := 1 + (r_confirm * 1) + (r_worse * 2) - (r_cleared * 2);

    UPDATE public.traffic_reports
    SET 
        confirm_count = r_confirm,
        worse_count = r_worse,
        cleared_count = r_cleared,
        confidence_score = new_confidence,
        status = CASE 
            WHEN r_cleared >= 3 AND r_cleared > (r_confirm + r_worse) THEN 'CLEARED'
            WHEN new_confidence <= -2 THEN 'CLEARED'
            ELSE status
        END
    WHERE id = NEW.report_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_confirmations_update ON public.traffic_confirmations;
CREATE TRIGGER trg_confirmations_update
AFTER INSERT ON public.traffic_confirmations
FOR EACH ROW EXECUTE FUNCTION update_report_confidence();

-- 3. ABUSE REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.abuse_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.traffic_reports(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    reporter_device_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (report_id, reporter_device_hash)
);

CREATE INDEX IF NOT EXISTS idx_abuse_report ON public.abuse_reports (report_id);

-- 4. ROUTE SEARCH CACHE TABLE (Cost Control)
CREATE TABLE IF NOT EXISTS public.route_search_cache (
    cache_key VARCHAR(128) PRIMARY KEY,
    origin_name TEXT NOT NULL,
    dest_name TEXT NOT NULL,
    route_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_route_cache_expires ON public.route_search_cache (expires_at);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.traffic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_search_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read of active unexpired reports
DROP POLICY IF EXISTS "Public can view active traffic reports" ON public.traffic_reports;
CREATE POLICY "Public can view active traffic reports"
ON public.traffic_reports FOR SELECT
USING (status = 'ACTIVE' AND expires_at > NOW());

-- Allow anyone to submit a report
DROP POLICY IF EXISTS "Public can insert traffic reports" ON public.traffic_reports;
CREATE POLICY "Public can insert traffic reports"
ON public.traffic_reports FOR INSERT
WITH CHECK (true);

-- Allow anyone to confirm a report
DROP POLICY IF EXISTS "Public can insert confirmations" ON public.traffic_confirmations;
CREATE POLICY "Public can insert confirmations"
ON public.traffic_confirmations FOR INSERT
WITH CHECK (true);

-- Allow anyone to flag abuse
DROP POLICY IF EXISTS "Public can flag abuse" ON public.abuse_reports;
CREATE POLICY "Public can flag abuse"
ON public.abuse_reports FOR INSERT
WITH CHECK (true);

-- Allow backend service role full access to cache
DROP POLICY IF EXISTS "Public read route cache" ON public.route_search_cache;
CREATE POLICY "Public read route cache"
ON public.route_search_cache FOR SELECT
USING (expires_at > NOW());

DROP POLICY IF EXISTS "Insert route cache" ON public.route_search_cache;
CREATE POLICY "Insert route cache"
ON public.route_search_cache FOR INSERT
WITH CHECK (true);
