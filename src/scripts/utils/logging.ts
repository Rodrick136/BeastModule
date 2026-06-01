export function Logger(message: string, data?: unknown, type: "log" | "error" = "log") {
  if (window.BeastEphemeralData.debug === false) {
    return;
  }

  const prefix = "BEAST:" as const;
  const msg = `${prefix} ${message}`;
  switch (type) {
    case "log": {
      console.log(msg);
      break;
    }
    case "error": {
      console.error(msg);
      break;
    }
  }

  if (data !== undefined) {
    console.debug(prefix, data);
  }
}
