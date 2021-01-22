import {SerializableResponseMetadata} from "./serializable-response-metadata";
import {Response} from "./response";

/**
 * Umschlag zur Rückgabe des Response vom Remotem System an den Client.
 */
export class RemoteResponseEnvelope {
  /**
   * Response.
   */
  response: Response;

  /**
   * Metadaten zum Response.
   */
  metadata: SerializableResponseMetadata;
}
