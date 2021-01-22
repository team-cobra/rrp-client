import {Request} from "./request";
import {RemoteRequestVerbs} from "./remote-request-verbs";

/**
 * Umschlag zur Übergabe des Request an das remote System.
 */
export class RemoteRequestEnvelope {
  /**
   * Was getan werden soll.
   */
  verb: RemoteRequestVerbs;

  /**
   * ID des Request.
   */
  requestId: String;

  /**
   * Request.
   */
  request: Request;

  /**
   * Menge der Source IDs von Validierungsmeldungen, die
   * bei der Ausführung unterdrückt werden sollen (vom Anwender "quittiert").
   */
  omitValidationSourceIds: string[];
}
