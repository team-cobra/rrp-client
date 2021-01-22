import {Request} from "./request";
import {Response} from "./response";

/**
 * Basisklasse für Requests.
 */
export abstract class RequestBase<T extends Response> implements Request {
  /**
   * Angabe des .NET-Typen des Requests, der dargestellt wird.
   * Für die Serialisierung benötigt. Wird hier aus dem
   * Typen des erzeugten Requests (der Konstruktor-Funktion) gelesen;
   * die Angabe muss dafür mit dem Decorator requestTypeName gemacht werden.
   *
   * WICHTIG: Muss die erste deklarierte Property sein,
   * damit dies die ERSTE Eigenschaft des erstellten Objekts ist und somit
   * als erste Property serialisiert wird - auch das braucht der Serializer so.
   */
  public $type = (this.constructor as any).$type;

  /**
   * Eindeutige ID der Anfrage.
   */
  public id: String;

  /**
   * Menge der Source IDs von Validierungsmeldungen, die
   * bei der Ausführung unterdrückt werden sollen (vom Anwender "quittiert").
   */
  public omitValidationSourceIds: string[] = [];

  /**
   * Alle Ergebnisse in zeitlich absteigender Reihenfolge.
   * Bei Mehrfachausführungen relevant.
   */
  public responses: T[] = [];

  /**
   * Gibt das Ergebnis zurück, falls die Anfrage ausgeführt wurde.
   * Bei Mehrfachausführung das letzte Ergebnis.
   * @returns Das letzte Ergebnis.
   */
  public getResponse(): T {
    return this.responses[0];
  }

  /**
   * Response bei Ausführung eines Handlers hinzufügen.
   * @param response Response, der hinzugefügt werden soll.
   */
  public addResponse(response: any): void {
    this.responses.unshift(response);
  }
}

/**
 * Decorator zur Angabe des .NET-Typen des Requests; wird für
 * die Ausführung über die WebApi-Schnittstelle benötigt.
 * @param typeName Vollqualifizierter .NET Typbezeichner.
 */
export function requestTypeName(typeName: string) {
  return (target: any) => {
    // Auf dem Typen selbst (der Konstruktor-Funktion) die Typangabe vorhalten.
    target.$type = typeName;
  };
}
