import { memo, useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import statesTopo from "us-atlas/states-10m.json";

import reliefUrl from "@/assets/us-shaded-relief.png";
import { pad, stateProps, type MapView } from "@/lib/map-click";
import { MAP_HEIGHT, MAP_WIDTH, reliefImageProps } from "@/lib/relief";

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
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        style={{ width: "100%", height: "auto" }}
      >
        {/*
          Shaded relief under the states, which multiply onto it (T-043). A
          bundled PNG warped once outside the repo from Natural Earth; its
          provenance, and why no repo command regenerates it, is
          engineering-decisions.md E-32. A sibling before the states, not a
          parent: the paths never wait on it.
        */}
        <image {...reliefImageProps(reliefUrl)} />
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
