export const isEvent = (evt: any): evt is Event => {
  if (!evt) {
    return false;
  }

  if (typeof Event !== 'undefined' && typeof Event === 'function' && evt instanceof Event) {
    return true;
  }

  if (evt && evt.srcElement) {
    return true;
  }

  return false;
};

export function normalizeEventValue(value: unknown): any {
  if (!isEvent(value)) {
    return value;
  }

  const input = value.target as HTMLInputElement;
  // if (input.type === 'file' && input.files) {
  //   return toArray(input.files);
  // }

  return input.value;
}
