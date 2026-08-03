import { memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import statesTopo from "us-atlas/states-10m.json";

export type MapMode = "quiz" | "progress";

interface UsMapProps {
  highlightFips?: string | undefined;
  correctFips?: string | undefined;
  masteredFips?: Set<string> | undefined;
  className?: string | undefined;
}

/** Geometry is bundled at build time — the app never makes a network request. */
const geography = statesTopo as unknown as Record<string, unknown>;

function pad(id: string) {
  return id.padStart(2, "0");
}

function UsMapBase({ highlightFips, correctFips, masteredFips, className }: UsMapProps) {
  const highlight = highlightFips ? pad(highlightFips) : undefined;
  const correct = correctFips ? pad(correctFips) : undefined;
  const mastered = useMemo(
    () => new Set(Array.from(masteredFips ?? []).map(pad)),
    [masteredFips],
  );

  return (
    <div className={className}>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        width={800}
        height={500}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geography}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = pad(String(geo.id));
              const isCorrect = correct === fips;
              const isHighlight = highlight === fips;
              const isMastered = mastered.has(fips);
              const fill = isCorrect
                ? "var(--map-correct)"
                : isHighlight
                  ? "var(--map-highlight)"
                  : isMastered
                    ? "var(--map-mastered)"
                    : "var(--map-land)";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="var(--map-stroke)"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: "none", transition: "fill 320ms ease" },
                    hover: { outline: "none", fill },
                    pressed: { outline: "none", fill },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}

export const UsMap = memo(UsMapBase);
