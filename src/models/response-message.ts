import {EventLevel} from "./event-level";

/**
 * Generische Basisklasse für Meldungen.
 */
export class ResponseMessage {
  /**
   * Konstruktor mit optionalen Vorbelegungen für einfache Informationsmeldungen.
   * @param sourceId Identifikationsmerkmal für die Nachricht.
   * @param userFriendlyCaption Text der zur Anzeige an Benutzer geeignet ist.
   * @param completeText Vollständiger Meldungstext (wenn nicht angegeben, gleich UserFriendlyCaption).
   */
  public constructor(sourceId?: string, userFriendlyCaption?: string, completeText?: string) {
    this.sourceId = sourceId;
    this.userFriendlyCaption = userFriendlyCaption;
    this.completeText = completeText || userFriendlyCaption;
  }

  /**
   * Identifikationsmerkmal für die Nachricht.
   */
  public sourceId: string;

  /**
   * Gibt an, ob es sich um eine Validierungsmeldung handelt, die
   * vom Anwender unterdrückt werden kann.
   */
  public isOmittableValidation: boolean;

  /**
   * Vollständiger Inhalt der Message als Text.
   */
  public completeText: string;

  /**
   * Text der zur Anzeige an Benutzer geeignet ist.
   */
  public userFriendlyCaption: string;

  /**
   * Meldungen die dieser als Details untergeordnet sind.
   */
  public nestedMessages: ResponseMessage[];

  /**
   * Einstufung der Message. Folgt den Einstufungen im Diagnostics-Bereich.
   * Default ist "Informational"
   */
  public eventLevel: EventLevel = EventLevel.Informational;

  /**
   * Auflistung von Kategorien, mit denen die Art der Message angegeben werdne kann.
   */
  public categories: string[];
}
