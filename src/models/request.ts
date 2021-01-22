import {Response} from "./response";

/**
 * Interface für Klassen die einen Request implementieren.
 */
export interface Request {
  /**
   * Eindeutige ID der Anfrage.
   */
  id: String;

  /**
   * Menge der Source IDs von Validierungsmeldungen, die
   * bei der Ausführung unterdrückt werden sollen (vom Anwender "quittiert").
   */
  omitValidationSourceIds: string[];

  /**
   * Gibt das Ergebnis zurück, falls die Anfrage ausgeführt wurde.
   * Bei Mehrfachausführung das letzte Ergebnis.
   * @returns Das letzte Ergebnis.
   */
  getResponse(): Response;
}
