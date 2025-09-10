import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { ExcelProject } from "@shared/excel-schema";

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ProjectMapProps {
  projects: ExcelProject[];
}

interface ParsedLocation {
  lat: number;
  lng: number;
  projectCode: number;
  division: string;
  description: string;
}

// Division colors
const divisionColors = {
  'Instrumentation': '#3B82F6', // Blue
  'Electrical': '#EF4444', // Red
  'Mechanical': '#10B981', // Green
  'Civil': '#F59E0B', // Amber
  'Construction': '#8B5CF6', // Purple
  'Engineering': '#EC4899', // Pink
  'Safety': '#F97316', // Orange
  'default': '#6B7280' // Gray
};

function parseLocationString(locationStr: string): { lat: number; lng: number }[] {
  if (!locationStr || locationStr.trim() === '') return [];
  
  try {
    // Remove extra whitespace and parse the array-like string
    const cleanStr = locationStr.trim();
    
    // Handle different formats: "[(lat, lng), (lat, lng)]" or "[lat, lng]"
    if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
      const content = cleanStr.slice(1, -1);
      
      // Split by ), ( to get individual coordinate pairs
      const pairs = content.split(/\),\s*\(/).map(pair => 
        pair.replace(/[()]/g, '').trim()
      );
      
      return pairs.map(pair => {
        const [lat, lng] = pair.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
        return null;
      }).filter(Boolean) as { lat: number; lng: number }[];
    }
  } catch (error) {
    console.error('Error parsing location:', locationStr, error);
  }
  
  return [];
}

function createCustomIcon(division: string): L.DivIcon {
  const color = divisionColors[division as keyof typeof divisionColors] || divisionColors.default;
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

function MapBounds({ locations }: { locations: ParsedLocation[] }) {
  const map = useMap();
  
  useMemo(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [locations, map]);
  
  return null;
}

export function ProjectMap({ projects }: ProjectMapProps) {
  const locations = useMemo(() => {
    const parsedLocations: ParsedLocation[] = [];
    
    projects.forEach(project => {
      if (project.location) {
        const coords = parseLocationString(project.location);
        coords.forEach(coord => {
          parsedLocations.push({
            lat: coord.lat,
            lng: coord.lng,
            projectCode: project.projectCode,
            division: project.division || 'default',
            description: project.description
          });
        });
      }
    });
    
    return parsedLocations;
  }, [projects]);

  const divisionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    locations.forEach(loc => {
      counts[loc.division] = (counts[loc.division] || 0) + 1;
    });
    return counts;
  }, [locations]);

  if (locations.length === 0) {
    return (
      <Card data-testid="card-project-map">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Project Locations Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No location data available for projects
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-project-map">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Project Locations Map ({locations.length} locations)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(divisionCounts).map(([division, count]) => (
              <Badge
                key={division}
                variant="outline"
                className="flex items-center gap-1"
                style={{
                  borderColor: divisionColors[division as keyof typeof divisionColors] || divisionColors.default
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: divisionColors[division as keyof typeof divisionColors] || divisionColors.default
                  }}
                />
                {division} ({count})
              </Badge>
            ))}
          </div>

          {/* Map */}
          <div className="h-96  rounded-lg overflow-hidden border">
            <MapContainer
              center={[0, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%' }}
              data-testid="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapBounds locations={locations} />
              
              {locations.map((location, index) => (
                <Marker
                  key={`${location.projectCode}-${index}`}
                  position={[location.lat, location.lng]}
                  icon={createCustomIcon(location.division)}
                >
                  <Popup>
                    <div className="space-y-2 min-w-48">
                      <div className="font-semibold text-sm">
                        Project {location.projectCode}
                      </div>
                      <div className="text-xs text-gray-600">
                        {location.description}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: divisionColors[location.division as keyof typeof divisionColors] || divisionColors.default
                        }}
                      >
                        {location.division}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}