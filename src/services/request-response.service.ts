/**
 * Token, über das die URL der RRP-WebApi
 * per Dependency Injection bereit gestellt werden muss.
 */
import {EventLevel} from "../models/event-level";
import {RequestResponseInterceptor} from "./interceptors/request-response-interceptor";
import {RemoteRequestVerbs} from "../models/remote-request-verbs";
import {RemoteRequestEnvelope} from "../models/remote-request-envelope";
import {SerializableResponseMetadata} from "../models/serializable-response-metadata";
import {ResponseMessage} from "../models/response-message";
import {RemoteResponseEnvelope} from "../models/remote-response-envelope";
import {Observable, Subject, Subscriber} from "rxjs";
import {RequestBase} from "../models/request-base";
import {Request} from "../models/request";
import {Response} from "../models/response";
import {ResponseBase} from "../models/response-base";
import {WebApiResponseSanitizer} from "./webapi-response.sanitizer";
import axios from "axios";

/**
 * Bietet Operationen zum Ausführen von Requests. Die Requests werden
 * dazu an einen Server geschickt, der eine WebApi-Schnittstelle
 * gemäß AppFrameDotNet.RequestResponsePattern anbietet.
 *
 * WICHTIG: Die URLs müssen über Dependency Injection bereitgestellt werden,
 * indem ein Provider für das Token RRP_URL und RRP_BINARY_URL bereit gestellt wird.
 */
export class RequestResponseService {
  private static readonly globalSubject: Subject<Request> = new Subject<Request>();
  private static readonly requestResponseInterceptor: RequestResponseInterceptor;

  public static rrpUrl;


  /**
   * Gibt ein Observable zurück, auf dem alle Requests nach ihrer Ausführung veröffentlicht werden.
   * Dieses Observable wird nie abgeschlossen.
   * @returns Observable, auf dem alle ausgeführten Requests veröffentlicht werden.
   */
  public static getGlobalObservable(): Observable<Request> {
    return this.globalSubject.asObservable();
  }

  /**
   * Prüft, ob der Request sich mit den vorliegenden Angaben ausführen ließe,
   * ohne ihn tatsächlich auszuführen. Die Prüfung findet am Server statt,
   * sodass auch logische Geschäftsregeln berücksichtigt werden.
   * @param request Den zu prüfenden Request.
   * @returns Ein Observable, das den Request nach erfolgter Ausführung (mit der Response) erhält.
   */
  public static evaluate<TRequest extends RequestBase<TResponse>, TResponse extends ResponseBase>(request: TRequest): Observable<TRequest> {
    return this.execute(request, RemoteRequestVerbs.Evaluate);
  }

  /**
   * Async/Await-kompatible Version von try.
   * Prüft, ob der Request sich mit den vorliegenden Angaben ausführen ließe,
   * ohne ihn tatsächlich auszuführen. Die Prüfung findet am Server statt,
   * sodass auch logische Geschäftsregeln berücksichtigt werden.
   * @param request Request. der ausgeführt werden soll.
   * @returns Ein Promise, das den Request nach erfolgter Ausführung (mit der Response) erhält.
   */
  public static evaluateAsync<TRequest extends RequestBase<TResponse>, TResponse extends ResponseBase>(request: TRequest): Promise<TRequest> {
    return this.evaluate(request).toPromise();
  }

  /**
   * Führt den Request aus, wobei Fehler abgefangen und in einen Response übersetzt werden.
   * Die Ausführung ist dadurch immer erfolgreich, der Status des Response muss berücksichtigt werden.
   * @param request Request. der ausgeführt werden soll.
   * @returns Ein Observable, das den Request nach erfolgter Ausführung (mit der Response) erhält.
   */
  public static try<TRequest extends RequestBase<TResponse>, TResponse extends ResponseBase>(request: TRequest): Observable<TRequest> {
    return this.execute(request, RemoteRequestVerbs.Execute);
  }

  /**
   * Async/Await-kompatible Version von try.
   * Führt den Request aus, wobei Fehler abgefangen und in einen Response übersetzt werden.
   * Die Ausführung ist dadurch immer erfolgreich, der Status des Response muss berücksichtigt werden.
   * @param request Request. der ausgeführt werden soll.
   * @returns Ein Promise, das den Request nach erfolgter Ausführung (mit der Response) erhält.
   */
  public static tryAsync<TRequest extends RequestBase<TResponse>, TResponse extends ResponseBase>(request: TRequest): Promise<TRequest> {
    return this.try(request).toPromise();
  }


  /**
   * Lässt einen Request durch Senden an die WebApi-Schnittstelle ausführen.
   * Fehler werden in einen Response übersetzt; die Ausführung ist immer erfolgreich,
   * der Status des Response muss berücksichtigt werden.
   * @param request Request, der ausgeführt werden soll.
   * @param verb Verb, mit dem der Request ausgeführt werden soll.
   * @param subject Optionale Angabe eines eigenen Subjects, auf das die Response veröffentlicht werden soll.
   * @returns Ein Observable, das den Request nach erfolgter Ausführung (mit der Response) erhält.
   */
  private static execute<TRequest extends RequestBase<TResponse>, TResponse extends ResponseBase>(
    request: TRequest,
    verb: RemoteRequestVerbs,
    subject: Subject<TRequest> = null): Observable<TRequest> {

    // Eigene Quelle für ein Observable erstellen, um den Fehlerfall des HTTP-Requests
    // auf ein erfolgreiches Event im Observable umändern zu können.
    subject = subject || new Subject<TRequest>();

    // Interceptor auf Request vor Ausführung anwenden.
    this.requestResponseInterceptor.interceptRequest(request, verb);
    
    // Post-Parameter vorbereiten; ggf. auf File-Upload Mechanik ausweichen.
    const envelope = this.createRequestEnvelope(request, verb);

    try {
      axios.post<RemoteResponseEnvelope>(this.rrpUrl, envelope).then(x => {
        // Response vom Server anwenden und in Observable geben.
        const sanitizedResponse = WebApiResponseSanitizer.sanitizeWebApiValue(x);
        const unwrappedResponse = this.unwrapResponseEnvelope(sanitizedResponse);
        this.emitResponse(subject, request, unwrappedResponse, verb);
      }, error => {
        // Fehler in Response übersetzen und als erfolgreiches Event in Observable geben.
        // Interceptors berücksichtigen; ggf. übersetzen diese den Fehler in einen Response.
        this.requestResponseInterceptor.interceptHttpError(request, error, verb).subscribe(r => {
          r = r || this.createErrorResponse("HTTP Error", error.message, error);
          this.emitResponse(subject, request, r, verb);
        });
      });
    } catch (error) {
      // Fehler in Response übersetzen und als erfolgreiches Event in Observable geben.
      // Hier wird Observable.create verwendet, damit auch die Subscriber, die sich erst nachträglich
      // registrieren, dieses Event erhalten (Regelfall, da das Observable noch nicht zurückgegeben wurde).
      return Observable.create((subscriber: Subscriber<TRequest>) => {
        const response = this.createErrorResponse("Exception", error.toString(), error);
        this.emitResponse(subscriber, request, response, verb);
      });
    }

    return subject.asObservable();
  }

  /**
   * Erstellt einen RequestEnvelope zum Versenden des Requests an die WebApi-Schnittstelle.
   * @param request Request, der im Envelope enthalten sein soll.
   * @param verb Verb, das im Envelope angegeben werden soll.
   * @returns Den RequestEnvelope mit dem angegebenen Request.
   */
  private static createRequestEnvelope(request: Request, verb: RemoteRequestVerbs): RemoteRequestEnvelope {
    const requestEnvelope = new RemoteRequestEnvelope();
    requestEnvelope.request = request;
    requestEnvelope.requestId = request.id;
    requestEnvelope.omitValidationSourceIds = request.omitValidationSourceIds;
    requestEnvelope.verb = verb;

    return requestEnvelope;
  }

  /**
   * Entpackt den ResponseEnvelope von der WebApi-Schnittstelle, um die Response zu erhalten.
   * @param responseEnvelope ResponseEnvelope von der WebApi-Schnittstelle.
   * @returns Den Response, der im Envelope enthalten war.
   */
  private static unwrapResponseEnvelope(responseEnvelope: RemoteResponseEnvelope): Response {
    const response = responseEnvelope.response;

    // Metadaten auf den Response anwenden, die separat geschickt werden.
    SerializableResponseMetadata.applyTo(response, responseEnvelope.metadata);
    return response;
  }

  /**
   * Gibt einen neuen Response für den Request bekannt.
   * @param subject Objekt zum Veröffentlichen des Events für den neuen Response.
   * @param request Request, für den der Response gilt.
   * @param response Response, der neu bekannt geworden ist.
   */
  private static emitResponse<TRequest extends RequestBase<TResponse>, TResponse extends Response>(
    subject: {next: (x: TRequest) => void, complete: () => void},
    request: TRequest,
    response: TResponse,
    verb: RemoteRequestVerbs) {

    // Interceptors das Eingreifen in den Response ermöglichen.
    this.requestResponseInterceptor.interceptResponse(request, response, verb).subscribe(res => {
      // Response zum Request hinzufügen und Event veröffentlichen.
      request.addResponse(res);
      subject.next(request);
      subject.complete();

      // Ausgeführten Request auf globalem Observable veröffentlichen.
      this.globalSubject.next(request);
    });
  }

  /**
   * Übersetzt einen Fehler in einen Response.
   * @param sourceId Herkunftsangabe in der ResponseMessage für den Fehler.
   * @param message Fehlernachricht.
   * @param error Fehler, der in einen Response übersetzt werden soll.
   * @returns Response, der den Fehler darstellt.
   */
  private static createErrorResponse(sourceId: string, message: string, error: any): Response {
    const response = new ResponseBase();
    const responseMessage = new ResponseMessage(sourceId, "Fehler beim Aufruf der Schnittstelle: " + message, JSON.stringify(error));
    responseMessage.eventLevel = EventLevel.Error;

    response.failed = true;
    response.messages = [responseMessage];

    return response;
  }
}
