import { useState, useCallback, useEffect } from "react";
import { MapPin, Building2, Coffee, GraduationCap, Heart, Phone, Globe, ChevronDown, ChevronUp, Search, Mail, Navigation, Loader2 } from "lucide-react";
import { places, type PlaceCategory, type Place } from "@/data/places-data";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const categoryConfig: Record<PlaceCategory, { label: string; icon: typeof MapPin; color: string }> = {
  all: { label: "All Places", icon: MapPin, color: "text-primary" },
  institute: { label: "Institutes", icon: GraduationCap, color: "text-accent" },
  cafe: { label: "Cafés", icon: Coffee, color: "text-primary" },
  workplace: { label: "Workplaces", icon: Building2, color: "text-accent" },
  ngo: { label: "NGOs", icon: Heart, color: "text-destructive" },
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FitBounds({ places }: { places: Place[] }) {
  const map = useMap();
  useEffect(() => {
    if (places.length === 0) return;
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
  }, [places, map]);
  return null;
}

export default function Places() {
  const [category, setCategory] = useState<PlaceCategory>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(100);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }
    setLocationLoading(true); setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setNearbyMode(true); setLocationLoading(false); },
      (err) => { setLocationError(err.code === 1 ? "Location access denied." : "Could not detect location."); setLocationLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const getDistance = (place: Place): number | null => {
    if (!userLocation) return null;
    return haversineDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
  };

  const filtered = places
    .filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase()) || p.state.toLowerCase().includes(search.toLowerCase());
      if (nearbyMode && userLocation) {
        return matchCat && matchSearch && haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) <= nearbyRadius;
      }
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (nearbyMode && userLocation) return haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) - haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
      return 0;
    });

  return (
    <div className="font-sans bg-background min-h-full relative overflow-hidden">
      <div className="float-orb w-64 h-64 bg-primary/30 top-[-60px] right-[-40px]" />
      <div className="float-orb w-48 h-48 bg-accent/20 bottom-40 left-[-30px]" style={{ animation: "float-drift-reverse 9s ease-in-out infinite alternate" }} />

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6 relative z-10">
        {/* Map */}
        <div className="glass-card rounded-2xl overflow-hidden" style={{ height: 350 }}>
          <MapContainer center={[22.5, 78.5]} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds places={filtered} />
            {filtered.map((place) => (
              <Marker key={place.id} position={[place.lat, place.lng]}>
                <Popup>
                  <strong>{place.name}</strong><br />
                  <span className="text-xs">{place.city}, {place.state}</span><br />
                  <span className="text-xs capitalize">{place.category}</span>
                </Popup>
              </Marker>
            ))}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>📍 Your location</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Location Detection */}
        <div className="glass-card gradient-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Navigation className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 min-w-0">
            {nearbyMode && userLocation ? (
              <p className="text-sm text-foreground/90">📍 Showing places within <strong className="text-primary">{nearbyRadius} km</strong>, sorted by distance.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Enable location to find nearby deaf-friendly places sorted by distance.</p>
            )}
            {locationError && <p className="text-xs text-destructive mt-1">{locationError}</p>}
          </div>
          <div className="flex items-center gap-2">
            {nearbyMode ? (
              <>
                <select
                  value={nearbyRadius}
                  onChange={(e) => setNearbyRadius(Number(e.target.value))}
                  className="rounded-lg px-2 py-1.5 text-sm font-medium text-foreground border border-border bg-background focus:outline-none"
                >
                  {[25, 50, 100, 250, 500, 10000].map((v) => (
                    <option key={v} value={v}>{v === 10000 ? "All India" : `${v} km`}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setNearbyMode(false); setUserLocation(null); }}
                  className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground border border-border hover:bg-muted/50 transition-all"
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                onClick={detectLocation}
                disabled={locationLoading}
                className="rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2"
              >
                {locationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                {locationLoading ? "Detecting…" : "Find Nearby"}
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city or state..."
            className="w-full glass-card rounded-xl pl-10 pr-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryConfig) as PlaceCategory[]).map((cat) => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const count = cat === "all" ? places.length : places.filter((p) => p.category === cat).length;
            const isActive = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all active:scale-95 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "glass-card text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {cfg.label}
                <span className={`ml-1 text-xs ${isActive ? "opacity-80" : "opacity-60"}`}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Places list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No places found</p>
              <p className="text-sm mt-1">{nearbyMode ? "Try increasing the radius or disable nearby mode" : "Try a different category or search term"}</p>
            </div>
          )}
          {filtered.map((place) => {
            const cfg = categoryConfig[place.category as PlaceCategory];
            const Icon = cfg.icon;
            const isExpanded = expandedId === place.id;
            const dist = getDistance(place);
            return (
              <div key={place.id} className="glass-card tilt-card rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : place.id)} className="w-full px-5 py-4 flex items-start gap-4 text-left">
                  <div className="mt-0.5 h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className={`h-5 w-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{place.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-md font-medium capitalize bg-accent/15 text-accent">{place.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {place.city}, {place.state}
                      {dist !== null && (
                        <span className="ml-2 text-primary font-medium">• {dist < 1 ? `${Math.round(dist * 1000)}m` : `${Math.round(dist)} km`}</span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 mt-1 text-muted-foreground">{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-4 pt-0 space-y-3 animate-fade-up border-t border-border/40">
                    <p className="text-sm text-muted-foreground leading-relaxed">{place.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {place.highlights.map((h) => (
                        <span key={h} className="text-xs px-2 py-1 rounded-md font-medium bg-primary/10 text-primary">{h}</span>
                      ))}
                    </div>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> {place.address}</p>
                      {place.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><a href={`tel:${place.phone}`} className="hover:text-primary transition-colors">{place.phone}</a></p>}
                      {place.email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 shrink-0" /><a href={`mailto:${place.email}`} className="hover:text-primary transition-colors">{place.email}</a></p>}
                      {place.website && <p className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 shrink-0" /><a href={place.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors truncate">{place.website}</a></p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
