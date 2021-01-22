import {ResponseMessage} from "./response-message";

/**
 * Interface für Response-Daten.
 */
export interface Response {
  /**
   * Eindeutige ID der Antwort.
   */
  id: String;

  /**
   * Rückmeldungen.
   */
  messages: ResponseMessage[];

  /**
   * Status ob der Request ausgeführt wurde.
   */
  executed: boolean;

  /**
   * Status ob der Request nicht erfolgreich ausgeführt wurde.
   */
  failed: boolean;
}
