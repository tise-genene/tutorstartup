"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState } from "react";

export type GoogleMapPickerValue = {
  lat: number;
  lng: number;
  locationText?: string;
};

export function GoogleMapPicker(props: {
  initialCenter?: { lat: number; lng: number };
  value?: {
    lat?: number | null;
    lng?: number | null;
    locationText?: string | null;
  };
  onChange: (v: GoogleMapPickerValue) => void;
  height?: number;
  className?: string;
  enableSearch?: boolean;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const height = props.height ?? 320;

  const initialCenter = useMemo(() => {
    const lat = props.value?.lat;
    const lng = props.value?.lng;
    if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
    return props.initialCenter ?? { lat: 9.03, lng: 38.74 }; // Addis Ababa fallback
  }, [props.initialCenter, props.value?.lat, props.value?.lng]);

  useEffect(() => {
    if (!apiKey || apiKey.trim().length === 0) {
      setErr("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return;
    }

    let cancelled = false;
    setOptions({
      key: apiKey,
      v: "weekly",
      libraries: props.enableSearch ? ["places"] : undefined,
    });

    const init = async () => {
      try {
        await importLibrary("maps");
        if (props.enableSearch) await importLibrary("places");
        if (cancelled) return;
        if (!mapRef.current) return;

        const google = window.google;
        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const marker = new google.maps.Marker({
          position: initialCenter,
          map,
          draggable: true,
        });

        const emit = (
          pos: { lat: number; lng: number },
          locationText?: string,
        ) => {
          props.onChange({ lat: pos.lat, lng: pos.lng, locationText });
        };

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          marker.setPosition(pos);
          emit(pos);
        });

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          if (!p) return;
          emit({ lat: p.lat(), lng: p.lng() });
        });

        if (props.enableSearch && inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(
            inputRef.current,
            {
              fields: ["geometry", "formatted_address", "name"],
            },
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const loc = place.geometry?.location;
            if (!loc) return;
            const pos = { lat: loc.lat(), lng: loc.lng() };
            map.panTo(pos);
            map.setZoom(15);
            marker.setPosition(pos);
            const text =
              place.formatted_address ?? place.name ?? inputRef.current?.value;
            emit(pos, text);
          });
        }

        setReady(true);
      } catch (e) {
        setErr((e as Error).message);
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, props.enableSearch]);

  useEffect(() => {
    // If parent provides a new explicit lat/lng, we can’t reliably update without
    // holding map instances; for now this component is “set-once”.
    // This keeps it simple and avoids hard-to-debug Google Maps lifecycle issues.
  }, [props.value?.lat, props.value?.lng]);

  return (
    <div className={props.className}>
      {props.enableSearch && (
        <input
          ref={inputRef}
          className="ui-field"
          placeholder="Search location (optional)"
          defaultValue={props.value?.locationText ?? ""}
        />
      )}
      <div
        ref={mapRef}
        className="mt-3 overflow-hidden rounded-2xl border"
        style={{
          height,
          borderColor: "var(--divider)",
          background: "rgba(255,255,255,0.03)",
        }}
      />
      {!ready && !err && <p className="mt-2 text-xs ui-muted">Loading map…</p>}
      {err && <p className="mt-2 text-xs ui-muted">Map error: {err}</p>}
    </div>
  );
}
