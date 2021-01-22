import {ResponseMessage} from "./response-message";
import {Response} from "./response";

/**
 * Hilfsklasse um die "versteckten" Properties hinter "Metadata"
 * zu serialisieren.
 */
export class SerializableResponseMetadata {
  /**
   * Eindeutige ID der Antwort.
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

  /**
   * Serialisierte Metadatan auf einen Response übertragen.
   * @param response Response, auf den die Metadaten übertragen werden sollen.
   * @param metadata Metadaten, die übertragen werden sollen.
   */
  public static applyTo(response: Response, metadata: SerializableResponseMetadata) {
    response.id = metadata.id;
    response.messages = metadata.messages;
    response.executed = metadata.executed;
    response.failed = metadata.failed;
  }
}
