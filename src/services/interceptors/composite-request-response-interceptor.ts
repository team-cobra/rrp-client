import { RequestResponseInterceptor } from "./request-response-interceptor";
import { Observable, from } from "rxjs";
import {RemoteRequestVerbs} from "../../models/remote-request-verbs";
import {Request} from "../../models/request";
import {Response} from "../../models/response";

/**
 * Sammlung mehrerer RequestResponseInterceptors, um diese wie
 * einen einzelnen Interceptor zu nutzen.
 */
export class CompositeRequestResponseInterceptor extends RequestResponseInterceptor {
  /**
   * Gesammelte Interceptors in umgekehrter Reihenfolge für die Response-Verarbeitung.
   * Die Request-Verarbeitung erfolgt "vorwärts", die Response-Verarbeitung "rückwärts",
   * damit sich eine natürliche Reihenfolge beim Ablauf ergibt (FILO):
   * 
   * Request => Interceptor1 => Interceptor2 => 
   *                                             Response
   *            Interceptor1 <= Interceptor2 <= 
   */
  private readonly reversedInterceptors: RequestResponseInterceptor[];
  
  /**
   * Konstruktor.
   * @param interceptors Interceptors, auf die Aufrufe weitergeleitet werden sollen.
   */
  public constructor(private readonly interceptors: RequestResponseInterceptor[]) {
    super();

    // Interceptors in umgekehrter Reihenfolge in neuem Array vorhalten.
    this.reversedInterceptors = [];
    this.reversedInterceptors.push(...interceptors);
    this.reversedInterceptors.reverse();
  }
    
  /**
   * Abfangen eines Requests, bevor er zur Ausführung abgesendet wird.
   * @param request Request, der abgesendet werden soll.
   * @param verb Verb, mit dem der Request ausgeführt werden soll.
   * @returns Den Response, der nach dem Eingriff als Response auf den Request gilt.
   */
  public interceptRequest(request: Request, verb: RemoteRequestVerbs): void {
    this.interceptors.forEach(i => i.interceptRequest(request, verb));
  }

  /**
   * Abfangen eines empfangenen Response, um darauf zu reagieren und ggf.
   * durch einen anderen Response auszutauschen.
   * Der Original-Response kann durch Durchschleifen mit `of(response)` beibehalten werden.
   * Weitere Interceptors arbeiten auf dem ausgetauschten Response.
   * @param request Request, für den der Response empfangen wurde.
   * @param response Response, der empfangen wurde (womöglich bereits durch andere Interceptors verändert).
   * @param verb Verb, mit dem der Request ausgeführt wurde.
   * @returns Den Response, der nach dem Eingriff als Response auf den Request gilt.
   */
  public interceptResponse(request: Request, response: Response, verb: RemoteRequestVerbs): Observable<Response> {
    return from(this.interceptResponseAsync(request, response, verb));
  }

  /**
   * Abfangen eines empfangenen HTTP-Fehlers, um darauf zu reagieren und ggf.
   * in einen eigenen Response zu übersetzen.
   * Wird der Fehler übersetzt, wird die Anwendung weiterer Interceptors übersprungen.
   * @param request Request, bei dessen Ausführung der HTTP-Fehler empfangen wurde.
   * @param error HTTP-Fehler, der empfangen wurde.
   * @param verb Verb, mit dem der Request ausgeführt wurde.
   * @returns Optional: Den Response, in den der Fehler übersetzt wurde; null für Fallback auf Standardmechanik.
   */
  public interceptHttpError(request: Request, error: any, verb: RemoteRequestVerbs): Observable<Response> {
    return from(this.interceptHttpErrorAsync(request, error, verb));
  }

  private async interceptResponseAsync(request: Request, response: Response, verb: RemoteRequestVerbs) {
    // Nacheinander Interceptors "rückwärts" durchlaufen; dabei jeweils
    // den neuen Response übernehmen (kann durchgeschleift werden oder neu sein).
    for (const interceptor of this.reversedInterceptors) {
      response = await interceptor.interceptResponse(request, response, verb).toPromise();
    }

    // Endgültigen Response anwenden.
    return response;
  }

  private async interceptHttpErrorAsync(request: Request, error: any, verb: RemoteRequestVerbs): Promise<Response> {
    // Nacheinander Interceptors "rückwärts" durchlaufen; Abbruch bei erstem
    // Interceptor, der den Fehler in einen Response übersetzt.
    for (const interceptor of this.reversedInterceptors) {
      const response = await interceptor.interceptHttpError(request, error, verb).toPromise();
      if (!!response) return response;
    }

    return null;
  }
}
