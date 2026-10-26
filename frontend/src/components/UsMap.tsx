import { memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import statesTopo from "us-atlas/states-10m.json";

import { pad, stateProps, type MapView } from "@/lib/map-click";

export type MapMode = "quiz" | "progress";

interface UsMapProps {
  highlightFips?: string | undefined;
  correctFips?: string | undefined;
  masteredFips?: Set<string> | undefined;
  /**
   * The state the child tapped on a wrong `map_click` answer, drawn apart from
   * the answer and from every untapped state.
   */
  tappedFips?: string | undefined;
  /**
   * Makes every state a button (`map_click`, engineering-decisions.md E-29). A
   * tap, Enter or Space reports the state's geometry id, padded to two digits.
   * Without it no state is focusable or announced as a control.
   */
  onTap?: ((geometryId: string) => void) | undefined;
  className?: string | undefined;
}

/** Geometry is bundled at build time — the app never makes a network request. */
const geography = statesTopo as unknown as Record<string, unknown>;

function UsMapBase({
  highlightFips,
  correctFips,
  masteredFips,
  tappedFips,
  onTap,
  className,
}: UsMapProps) {
  const mastered = useMemo(() => new Set(Array.from(masteredFips ?? []).map(pad)), [masteredFips]);
  const view: MapView = {
    highlight: highlightFips ? pad(highlightFips) : undefined,
    correct: correctFips ? pad(correctFips) : undefined,
    tapped: tappedFips ? pad(tappedFips) : undefined,
    mastered,
    onTap,
  };

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
            // The territories in us-atlas fall outside geoAlbersUsa and project to
            // no path; drawing them would leave invisible tab stops on a tap map.
            geographies
              .filter((geo) => Boolean(geo.svgPath))
              .map((geo) => (
                <Geography key={geo.rsmKey} geography={geo} {...stateProps(String(geo.id), view)} />
              ))
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}

export const UsMap = memo(UsMapBase);
