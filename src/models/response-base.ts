import {Response} from "./response";
import {ResponseMessage} from "./response-message";

/**
 * Basisklasse für Rückmeldungen.
 */
export class ResponseBase implements Response {
  /**
   * Eindeutige Id der Antwort.
   */
  public id: String;

  /**
   * Rückmeldungen.
   */
  public messages: ResponseMessage[];

  /**
   * Status ob der Request ausgeführt wurde.
   */
  public executed: boolean;

  /**
   * Status ob der Request nicht erfolgreich ausgeführt wurde.
   */
  public failed: boolean;
}
