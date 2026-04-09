export function Logger(message: string, data?: unknown, type = "log") {
  const prefix = "BEAST:";
  const msg = `${prefix} ${message}`;
  switch (type) {
    case "log": {
      console.log(msg);
      break;
    }
  }

  if (data) {
    console.debug(prefix, data);
  }
}
