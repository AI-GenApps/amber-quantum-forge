export interface SaveKeys {
  main: string;
  pending: string;
  backup: string;
  corrupt: string;
}

/** Storage keys: the save, the new copy while a write is in flight, the last good copy, and a damaged one. */
export function saveKeys(prefix = "city-drive.save"): SaveKeys {
  return {
    main: prefix,
    pending: `${prefix}.tmp`,
    backup: `${prefix}.bak`,
    corrupt: `${prefix}.corrupt`,
  };
}
