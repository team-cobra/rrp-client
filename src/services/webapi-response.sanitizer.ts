
/**
 * Wendet Regeln zur Bereinigung von technischen Besonderheiten
 * in Objekten an, die von einer WebApi-Schnittstelle empfangen wurden.
 */
export class WebApiResponseSanitizer {
  /**
   * Regex zum Erkennen von Datumswerten, die von der WebApi als Strings ausgeliefert werden.
   * @description
   * Infos zur Problematik mit WebApi-Datumswerten, da JSON keinen Datumstyp kennt:
   * https://www.hanselman.com/blog/OnTheNightmareThatIsJSONDatesPlusJSONNETAndASPNETWebAPI.aspx
   * Regex von (leicht angepasst für Millisekunden):
   * https://stackoverflow.com/questions/25568134/regex-to-verify-utc-date-time-format
   */
  private static readonly dateTimeRegex: RegExp = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?(Z|[+-][0-9]{2}:[0-9]{2})$/;

  /**
   * Bereinigt technische Besonderheiten in Objekten,
   * die von der WebApi-Schnittstelle empfangen wurden.
   * @param value Objekt, das von der WebApi-Schnittstelle empfangen wurde.
   * @returns Bereinigtes Objekt.
   */
  public static sanitizeWebApiValue(value: any): any {
    // Ausstieg bei null / undefined usw.
    if (!value) { return value; }

    // Arrays werden als Tupel von Typ und Werten serialisiert.
    // Das wird aufgehoben und auf die Werte reduziert.
    if (value.$values) {
      value = value.$values;
    }

    // Datumswerte werden als Strings serialisiert, da JSON keinen Datumstypen kennt.
    // Datumswerte werden hier über eine Regex erkannt und entsprechend geparsed.
    // TODO: Typinfo aus TRequest extrahieren? Leider verschwindet Typinfo bei Übersetzung in Javascript.
    if (typeof value === 'string' && this.dateTimeRegex.test(value)) {
      value = new Date(value);
    }

    // Werte rekursiv bereinigen, wenn es sich um ein Array oder Objekt handelt.
    if (value instanceof Array) {
      for (let i = 0; i < value.length; i++) {
        value[i] = this.sanitizeWebApiValue(value[i]);
      }
    } else if (typeof value === 'object') {
      for (const key of Object.keys(value)) {
        value[key] = this.sanitizeWebApiValue(value[key]);
      }
    }

    // Bereinigten Wert zurückgeben.
    return value;
  }
}
