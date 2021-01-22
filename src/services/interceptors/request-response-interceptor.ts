/**
 * Basis für einen Interceptor, der es ermöglicht, in verschiedene
 * Stellen der Abläufe des RequestResponseServices einzugreifen.
 *
 * Anwendung:
 * 1. Ableitung von Basis erstellen.
 * 2. In Module als Provider registrieren mit Kennzeichnung multi: true.
 *    z.B. { provide: RequestResponseInterceptor, useClass: Ableitung, multi: true }.
 *    WICHTIG, damit mehrere Interceptors (ggf. aus verschiedenen Modulen) registriert werden können.
 */
import {Observable, of} from "rxjs";
import {RemoteRequestVerbs} from "../../models/remote-request-verbs";
import {Request} from "../../models/request";
import {Response} from "../../models/response";

export abstract class RequestResponseInterceptor {
  /**
   * Abfangen eines Requests, bevor er zur Ausführung abgesendet wird.
   * @param request Request, der abgesendet werden soll.
   * @param verb Verb, mit dem der Request ausgeführt werden soll.
   * @returns Den Response, der nach dem Eingriff als Response auf den Request gilt.
   */
  public interceptRequest(request: Request, verb: RemoteRequestVerbs): void { }

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
    // Standard: Nichts tun und Durchschleifen.
    return of(response);
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
    return of(null);
  }
}
