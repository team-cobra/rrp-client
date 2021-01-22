/**
 * Operationen, die Remote ausgeführt werden können.
 */
export enum RemoteRequestVerbs {
  /**
   * IHandler.Execute
   * @type {string}
   */
  Execute = "Execute",

  /**
   * IHandler.Evaluate
   * @type {string}
   */
  Evaluate = "Evaluate"
}
