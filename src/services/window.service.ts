/**
 * Service zum Ansprechen des Window-Kontexts.
 */
export class WindowService {
  /**
   * Öffnet eine neue URL.
   * @param url URL, die geöffnet werden soll.
   */
  public open(url: string): void {
    window.open(url);
  }
}
