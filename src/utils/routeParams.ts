export function decodeRouteParam(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function decodeRouteSegments(segments: string[]) {
  return segments.map(decodeRouteParam).join("/");
}
